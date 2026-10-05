import { body } from 'express-validator';
import { handleValidation } from './authValidators.js';

// Optional fields, shared by create and update.
const optionalExpenseFields = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date, for example 2026-10-05')
    .toDate(),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be at most 500 characters'),
];

const amountRules = (message) =>
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .bail()
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0 })
    .withMessage(message)
    .toFloat();

export const createExpenseRules = [
  // A malformed trip id is a client mistake (400), while a well formed id that
  // is missing or owned by somebody else is handled as a 404 in the route.
  body('tripId')
    .isMongoId()
    .withMessage('A valid tripId is required'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  amountRules('Amount cannot be negative'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  ...optionalExpenseFields,
];

// On update everything is optional so a client can change a single field.
// The owner (user), the trip and the id are never part of the rules, because
// they are never taken from the request body.
export const updateExpenseRules = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('amount')
    .optional()
    .bail()
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Amount cannot be negative')
    .toFloat(),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty')
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  ...optionalExpenseFields,
];

export { handleValidation };