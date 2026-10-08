import { Router } from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';
import { isGeminiConfigured } from '../config/gemini.js';
import { generatePhotoGuide } from '../services/geminiPhoto.js';
import { GeminiNotConfiguredError } from '../config/gemini.js';
import { GeminiPhotoError } from '../services/geminiPhoto.js';

const router = Router();

router.use(protect);

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.post('/analyze', async (req, res) => {
  const { tripId, image, mimeType, language } = req.body;

  // tripId is optional for standalone photo analysis
  if (tripId && !isValidId(tripId)) {
    return res.status(400).json({ error: 'Invalid tripId format' });
  }

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

  try {
    // If tripId provided, verify the trip belongs to the user
    if (tripId) {
      const Trip = (await import('../models/Trip.js')).default;
      const trip = await Trip.findOne({ _id: tripId, user: req.user.id });

      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }
    }

    const guide = await generatePhotoGuide(image, mimeType, language);

    return res.status(200).json({
      message: 'Photo guide generated successfully',
      guide,
    });
  } catch (error) {
    if (error instanceof GeminiNotConfiguredError) {
      return res.status(503).json({ error: 'The AI photo guide is not configured on this server' });
    }

    if (error instanceof GeminiPhotoError) {
      if (error.code === 'AI_INVALID_RESPONSE') {
        console.warn('[photos] rejected an unusable AI response');
        return res.status(502).json({ error: 'The AI could not identify the place in the photo. Try a clearer image.' });
      }

      if (error.code === 'AI_UNAVAILABLE') {
        console.error('[photos] AI request failed:', error.message);
        return res.status(502).json({ error: 'The AI photo guide is unavailable right now' });
      }
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map((item) => item.message),
      });
    }

    console.error('[photos] analyze failed:', error.name);

    return res.status(500).json({ error: 'Could not analyze the photo' });
  }
});

export default router;