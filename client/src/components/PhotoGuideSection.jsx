import { useState, useRef, useCallback, useEffect } from 'react';
import { photoService, validateImageFile, compressImageForAnalysis } from '../services/photoService.js';
import ErrorMessage from './ErrorMessage.jsx';
import Spinner from './Spinner.jsx';

function PhotoUpload({ onAnalyze, analyzing, error, onErrorDismiss }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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

    // Compress image before sending to reduce latency
    try {
      const { base64, mimeType } = await compressImageForAnalysis(file);
      onAnalyze(base64, mimeType);
    } catch (err) {
      console.error('[PhotoGuide] Image compression failed:', err);
      onErrorDismiss('Failed to process image. Please try another.');
    }
  }, [onAnalyze, onErrorDismiss]);

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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={analyzing}
      />

      <div
        className={`photo-dropzone ${dragActive ? 'active' : ''} ${preview ? 'has-preview' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
        aria-label="Upload a photo of a landmark or place"
      >
        {preview ? (
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

      <button
        type="button"
        className="btn btn-primary photo-analyze-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={analyzing || !preview}
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

function PhotoGuide({ guide, onSpeak, speaking, onClose }) {
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
    utterance.lang = 'en-US';
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

  const handleAnalyze = useCallback(async (base64Image, mimeType) => {
    setAnalyzing(true);
    setError(null);
    setGuide(null);

    try {
      const result = await photoService.analyzePhoto(trip.id, base64Image, mimeType);
      setGuide(result);
    } catch (err) {
      const message = err?.status === 0
        ? 'Could not reach the server. Check your connection.'
        : err?.message || 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setAnalyzing(false);
    }
  }, [trip.id]);

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
        <PhotoUpload onAnalyze={handleAnalyze} analyzing={analyzing} error={error} onErrorDismiss={handleErrorDismiss} />
      )}
    </section>
  );
}