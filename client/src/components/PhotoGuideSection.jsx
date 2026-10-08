import { useState, useRef, useCallback, useEffect } from 'react';
import { photoService, validateImageFile, compressImageForAnalysis } from '../services/photoService.js';
import ErrorMessage from './ErrorMessage.jsx';
import Spinner from './Spinner.jsx';

export function PhotoUpload({
  onAnalyze,
  analyzing,
  error,
  onErrorDismiss,
  language = 'English',
  onLanguageChange,
}) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const streamRef = useRef(null);
  const [internalLanguage, setInternalLanguage] = useState('English');

  const selectedLanguage = onLanguageChange ? language : internalLanguage;
  const handleLanguageChange = onLanguageChange || setInternalLanguage;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraError(null);
    setVideoReady(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.play().catch((err) => {
        console.error('[PhotoGuide] video.play() failed:', err);
      });
    }
  }, [cameraActive]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setVideoReady(false);
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
      } catch (err) {
        if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw err;
        }
      }
      streamRef.current = stream;
      setCameraActive(true);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('[PhotoGuide] Camera access failed:', err);
      setCameraError(err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : 'Could not access camera. Please use file upload instead.');
      setCameraActive(false);
    }
  }, []);

  const handleVideoCanPlay = useCallback(() => {
    setVideoReady(true);
  }, []);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError('Camera not ready. Please wait a moment and try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.85);
    });

    if (!blob) {
      setCameraError('Failed to capture photo. Please try again.');
      return;
    }

    const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
    stopCamera();

    const validationError = validateImageFile(file);
    if (validationError) {
      onErrorDismiss();
      setTimeout(() => onErrorDismiss(validationError), 0);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
    };
    reader.readAsDataURL(file);

    try {
      const { base64, mimeType } = await compressImageForAnalysis(file);
      onAnalyze(base64, mimeType, selectedLanguage);
    } catch (err) {
      console.error('[PhotoGuide] Image compression failed:', err);
      onErrorDismiss('Failed to process image. Please try another.');
    }
  }, [onAnalyze, onErrorDismiss, stopCamera, selectedLanguage]);

  const handleFile = useCallback(async (file) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      onErrorDismiss();
      setTimeout(() => onErrorDismiss(validationError), 0);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
    };
    reader.readAsDataURL(file);

    try {
      const { base64, mimeType } = await compressImageForAnalysis(file);
      onAnalyze(base64, mimeType, selectedLanguage);
    } catch (err) {
      console.error('[PhotoGuide] Image compression failed:', err);
      onErrorDismiss('Failed to process image. Please try another.');
    }
  }, [onAnalyze, onErrorDismiss, selectedLanguage]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="photo-upload">
      <div className="photo-lang-selector" role="group" aria-label="Select guide language">
        <span className="photo-lang-label">
          <span className="material-symbols-outlined photo-lang-icon">translate</span>
          <span>Language:</span>
        </span>
        <div className="photo-lang-options">
          <button
            type="button"
            className={`photo-lang-btn ${selectedLanguage === 'English' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('English')}
            disabled={analyzing || cameraActive}
            aria-pressed={selectedLanguage === 'English'}
          >
            English
          </button>
          <button
            type="button"
            className={`photo-lang-btn ${selectedLanguage === 'हिन्दी' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('हिन्दी')}
            disabled={analyzing || cameraActive}
            aria-pressed={selectedLanguage === 'हिन्दी'}
          >
            हिन्दी
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={analyzing || cameraActive}
      />

      <div
        className={`photo-dropzone ${dragActive ? 'active' : ''} ${preview ? 'has-preview' : ''} ${cameraActive ? 'camera-active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={cameraActive ? undefined : handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !cameraActive && handleClick()}
        aria-label={cameraActive ? 'Camera active' : 'Upload a photo of a landmark or place'}
      >
{cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  className="camera-video"
                  autoPlay
                  playsInline
                  muted
                  aria-label="Camera preview"
                  onCanPlay={handleVideoCanPlay}
                  onLoadedMetadata={handleVideoCanPlay}
                />
                {cameraError && (
                  <div className="camera-error" role="alert">
                    <span className="material-symbols-outlined">error</span>
                    {cameraError}
                  </div>
                )}
                <div className="camera-controls">
                  <button
                    type="button"
                    className="btn btn-primary camera-capture-btn"
                    onClick={capturePhoto}
                    disabled={analyzing || !videoReady}
                    aria-label="Take photo"
                  >
                    <span className="material-symbols-outlined">circle</span>
                    <span>Capture</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost camera-cancel-btn"
                    onClick={stopCamera}
                    aria-label="Cancel camera"
                  >
                    <span className="material-symbols-outlined">close</span>
                    <span>Cancel</span>
                  </button>
                </div>
              </>
        ) : preview ? (
          <>
            <img src={preview} alt="Preview" className="photo-preview" />
            <button
              type="button"
              className="photo-clear"
              onClick={(e) => { e.stopPropagation(); clearPreview(); }}
              aria-label="Remove photo"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <p className="photo-preview-label">Click to change photo</p>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined photo-icon">add_photo_alternate</span>
            <p>Drag & drop a photo or click to upload</p>
            <p className="photo-hint">JPEG, PNG, or WebP · Max 10 MB</p>
          </>
        )}
      </div>

      <ErrorMessage error={error} onDismiss={onErrorDismiss} />

      {!cameraActive && !preview && (
        <button
          type="button"
          className="btn btn-secondary photo-camera-btn"
          onClick={startCamera}
          disabled={analyzing}
          aria-label="Take photo with camera"
        >
          <span className="material-symbols-outlined">camera_alt</span>
          Take Photo
        </button>
      )}

      <button
        type="button"
        className="btn btn-primary photo-analyze-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={analyzing || !preview || cameraActive}
      >
        {analyzing ? (
          <>
            <Spinner label="Analyzing..." size="small" />
            Analyzing photo...
          </>
        ) : (
          'Analyze Photo'
        )}
      </button>
    </div>
  );
}

export function PhotoGuide({ guide, onSpeak, speaking, onClose }) {
  const utteranceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = useCallback(() => {
    if (!guide) return;

    const text = [
      `Welcome to ${guide.placeName} in ${guide.location}.`,
      guide.description,
      `History: ${guide.history}.`,
      `Significance: ${guide.significance}.`,
      `The best time to visit is ${guide.bestTimeToVisit}.`,
      `Highlights include: ${guide.highlights.join(', ')}.`,
      `Practical information: ${guide.practicalInfo.openingHours}. Entry fee: ${guide.practicalInfo.entryFee}. Getting there: ${guide.practicalInfo.howToGetThere}.`,
      `Tips: ${guide.practicalInfo.tips.join(' ')}`,
      `Nearby attractions: ${guide.nearbyAttractions.join(', ')}.`,
      `Photography tips: ${guide.photoTips.join(' ')}`
    ].join(' ');

    if (speaking) {
      window.speechSynthesis.cancel();
      onSpeak(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const hasHindiChars = /[\u0900-\u097F]/.test(text);
    utterance.lang = hasHindiChars ? 'hi-IN' : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => onSpeak(false);
    utterance.onerror = () => onSpeak(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    onSpeak(true);
  }, [guide, speaking, onSpeak]);

  return (
    <div className="photo-guide">
      <div className="photo-guide-header">
        <div>
          <h2 className="photo-guide-title">{guide.placeName}</h2>
          <p className="photo-guide-location">
            <span className="material-symbols-outlined">location_on</span>
            {guide.location}
          </p>
        </div>
        <button
          type="button"
          className="photo-guide-close"
          onClick={onClose}
          aria-label="Close guide"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="photo-guide-content">
        <section className="photo-guide-section">
          <h3>About</h3>
          <p>{guide.description}</p>
        </section>

        <section className="photo-guide-section">
          <h3>
            <span className="material-symbols-outlined">history</span>
            History
          </h3>
          <p>{guide.history}</p>
        </section>

        <section className="photo-guide-section">
          <h3>
            <span className="material-symbols-outlined">landmark</span>
            Significance
          </h3>
          <p>{guide.significance}</p>
        </section>

        <section className="photo-guide-section">
          <h3>
            <span className="material-symbols-outlined">schedule</span>
            Best Time to Visit
          </h3>
          <p>{guide.bestTimeToVisit}</p>
        </section>

        <section className="photo-guide-section">
          <h3>
            <span className="material-symbols-outlined">star</span>
            Highlights
          </h3>
          <ul className="photo-guide-list">
            {guide.highlights.map((highlight, index) => (
              <li key={index}>{highlight}</li>
            ))}
          </ul>
        </section>

        <section className="photo-guide-section">
          <h3>
            <span className="material-symbols-outlined">info</span>
            Practical Information
          </h3>
          <dl className="photo-guide-dl">
            <div>
              <dt>Opening Hours</dt>
              <dd>{guide.practicalInfo.openingHours}</dd>
            </div>
            <div>
              <dt>Entry Fee</dt>
              <dd>{guide.practicalInfo.entryFee}</dd>
            </div>
            <div>
              <dt>How to Get There</dt>
              <dd>{guide.practicalInfo.howToGetThere}</dd>
            </div>
            <div>
              <dt>Tips</dt>
              <dd>
                <ul className="photo-guide-list">
                  {guide.practicalInfo.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </section>

        <section className="photo-guide-section">
          <h3>
            <span className="material-symbols-outlined">near_me</span>
            Nearby Attractions
          </h3>
          <ul className="photo-guide-list">
            {guide.nearbyAttractions.map((attraction, index) => (
              <li key={index}>{attraction}</li>
            ))}
          </ul>
        </section>

        <section className="photo-guide-section">
          <h3>
            <span className="material-symbols-outlined">camera</span>
            Photography Tips
          </h3>
          <ul className="photo-guide-list">
            {guide.photoTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="photo-guide-actions">
        <button
          type="button"
          className={`btn ${speaking ? 'btn-primary' : 'btn-ghost'}`}
          onClick={handleSpeak}
          aria-pressed={speaking}
        >
          <span className="material-symbols-outlined">{speaking ? 'stop' : 'volume_up'}</span>
          {speaking ? 'Stop Speaking' : 'Read Aloud'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default function PhotoGuideSection({ trip }) {
  const [guide, setGuide] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('English');

  const handleAnalyze = useCallback(async (base64Image, mimeType, selectedLang = language) => {
    setAnalyzing(true);
    setError(null);
    setGuide(null);

    try {
      const result = await photoService.analyzePhoto(trip.id, base64Image, mimeType, selectedLang);
      setGuide(result);
    } catch (err) {
      const message = err?.status === 0
        ? 'Could not reach the server. Check your connection.'
        : err?.message || 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setAnalyzing(false);
    }
  }, [trip.id, language]);

  const handleErrorDismiss = useCallback((message) => {
    if (message) setError(message);
    else setError(null);
  }, []);

  const handleSpeak = useCallback((isSpeaking) => {
    setSpeaking(isSpeaking);
  }, []);

  const handleClose = useCallback(() => {
    setGuide(null);
    setError(null);
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [speaking]);

  if (!trip) return null;

  return (
    <section className="card photo-guide-card" aria-labelledby="photo-guide-heading">
      <div className="section-head">
        <div>
          <h2 id="photo-guide-heading">
            <span className="material-symbols-outlined section-icon">camera_alt</span>
            AI Photo Guide
          </h2>
          <p className="section-sub">
            Upload a photo of any landmark or place and get an instant travel guide with highlights, practical info, and photography tips.
          </p>
        </div>
      </div>

      {guide ? (
        <PhotoGuide guide={guide} onSpeak={handleSpeak} speaking={speaking} onClose={handleClose} />
      ) : (
        <PhotoUpload
          onAnalyze={handleAnalyze}
          analyzing={analyzing}
          error={error}
          onErrorDismiss={handleErrorDismiss}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}
    </section>
  );
}