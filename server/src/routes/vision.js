import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { isGeminiConfigured } from '../config/gemini.js';
import { generatePhotoGuide } from '../services/geminiPhoto.js';
import { GeminiNotConfiguredError } from '../config/gemini.js';
import { GeminiPhotoError } from '../services/geminiPhoto.js';

const router = Router();

router.use(protect);

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

router.post('/analyze', async (req, res) => {
  const { image, mimeType, tripId } = req.body;

  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Base64 encoded image is required' });
  }

  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
    return res.status(400).json({ error: 'Unsupported image format. Use JPEG, PNG, or WebP.' });
  }

  // Rough size check on base64 (base64 is ~33% larger than binary)
  const approxBytes = Math.ceil((image.length * 3) / 4);
  if (approxBytes > MAX_IMAGE_SIZE) {
    return res.status(400).json({ error: 'Image is too large. Maximum size is 10 MB.' });
  }

  if (!isGeminiConfigured()) {
    return res.status(503).json({ error: 'The AI photo guide is not configured on this server' });
  }

  // Detailed logging for debugging
  const model = process.env.GEMINI_MODEL || 'unknown';
  const base64SizeKB = Math.round(image.length / 1024);
  const approxBytesKB = Math.round(approxBytes / 1024);
  console.log(`[vision] Request received: mimeType=${mimeType}, base64Size=${base64SizeKB}KB, approxBinarySize=${approxBytesKB}KB, model=${model}, hasTripId=${!!tripId}`);

  const requestStart = Date.now();

  try {
    // If tripId is provided, verify it belongs to the user
    if (tripId) {
      const mongoose = (await import('mongoose')).default;
      if (!mongoose.Types.ObjectId.isValid(tripId)) {
        return res.status(400).json({ error: 'Invalid tripId format' });
      }

      const Trip = (await import('../models/Trip.js')).default;
      const trip = await Trip.findOne({ _id: tripId, user: req.user.id });

      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }
    }

    const guide = await generatePhotoGuide(image, mimeType);

    const elapsed = Date.now() - requestStart;
    console.log(`[vision] Request completed successfully in ${elapsed}ms`);

    return res.status(200).json({
      message: 'Photo guide generated successfully',
      guide,
    });
  } catch (error) {
    const elapsed = Date.now() - requestStart;
    console.error(`[vision] Request failed after ${elapsed}ms:`, error.name, error.message, error.code || '');
    if (error instanceof GeminiNotConfiguredError) {
      return res.status(503).json({ error: 'The AI photo guide is not configured on this server' });
    }

    if (error instanceof GeminiPhotoError) {
      if (error.code === 'AI_INVALID_RESPONSE') {
        console.warn('[vision] rejected an unusable AI response');
        return res.status(502).json({ error: 'The AI could not identify the place in the photo. Try a clearer image.' });
      }

      if (error.code === 'GEMINI_AUTH_ERROR') {
        console.error('[vision] Gemini authentication error:', error.message);
        return res.status(503).json({ error: 'The AI service is not properly configured. Please contact the administrator.' });
      }

      if (error.code === 'GEMINI_QUOTA_EXCEEDED') {
        console.warn('[vision] Gemini usage quota exceeded:', error.message);
        return res.status(429).json({ error: error.message });
      }

      if (error.code === 'DEADLINE_EXCEEDED') {
        console.error('[vision] AI request timed out (DEADLINE_EXCEEDED):', error.message);
        return res.status(504).json({ error: 'The AI service took too long to respond. Please try again.' });
      }

      if (error.code === 'AI_UNAVAILABLE') {
        console.error('[vision] AI request failed:', error.message);
        return res.status(502).json({ error: 'The AI photo guide is temporarily unavailable. Please try again later.' });
      }
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map((item) => item.message),
      });
    }

    console.error('[vision] analyze failed:', error.name, error.message);

    return res.status(500).json({ error: 'Could not analyze the photo' });
  }
});

export default router;