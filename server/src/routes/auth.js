import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import {
  registerRules,
  loginRules,
  handleValidation,
} from '../validators/authValidators.js';

const router = Router();

function createToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

router.post('/register', registerRules, handleValidation, async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password });

    return res.status(201).json({
      message: 'Registration successful',
      user: user.toPublicJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    console.error('[auth] registration failed:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      fullError: error,
    });

    return res.status(500).json({ error: 'Could not create the account' });
  }
});

router.post('/login', loginRules, handleValidation, async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.status(200).json({
      message: 'Login successful',
      token: createToken(user),
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('[auth] login failed:', error.message);

    return res.status(500).json({ error: 'Could not log you in' });
  }
});

router.get('/me', protect, (req, res) => {
  return res.status(200).json({ user: req.user });
});

export default router;