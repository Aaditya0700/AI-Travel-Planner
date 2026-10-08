import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { photoService } from '../services/photoService.js';
import { PhotoUpload, PhotoGuide } from '../components/PhotoGuideSection.jsx';

export default function PhotoGuidePage() {
  const [guide, setGuide] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = useCallback(async (base64Image, mimeType) => {
    setAnalyzing(true);
    setError(null);
    setGuide(null);

    try {
      // For standalone page, we don't pass a tripId
      const result = await photoService.analyzePhoto(null, base64Image, mimeType);
      setGuide(result);
    } catch (err) {
      const message = err?.status === 0
        ? 'Could not reach the server. Check your connection.'
        : err?.message || 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setAnalyzing(false);
    }
  }, []);

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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/trips" className="back-link">
            &larr; My Trips
          </Link>
          <h1>
            <span className="material-symbols-outlined section-icon">camera_alt</span>
            AI Photo Guide
          </h1>
          <p className="page-subtitle">
            Upload a photo of any landmark or place and get an instant travel guide with highlights, practical info, and photography tips.
          </p>
        </div>
      </div>

      <section className="card photo-guide-card" aria-labelledby="photo-guide-heading">
        <div className="section-head">
          <div>
            <h2 id="photo-guide-heading">AI Photo Guide</h2>
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
    </div>
  );
}