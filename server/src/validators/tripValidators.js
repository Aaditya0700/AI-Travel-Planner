import { body } from 'express-validator';
import { handleValidation } from './authValidators.js';

// Every field except destination can be left out when creating a trip.
const optionalTripFields = [
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date, for example 2026-12-10')
    .toDate(),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date, for example 2026-12-14')
    .toDate(),
  body('budget')
    .optional()
    .bail()
    .isNumeric()
    .withMessage('Budget must be a number')
    .isFloat({ min: 0 })
    .withMessage('Budget cannot be negative')
    .toFloat(),
  body('currency')
    .optional()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3 letter code, for example INR'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be at most 500 characters'),
  body('status')
    .optional()
    .isIn(['planned', 'ongoing', 'completed'])
    .withMessage('Status must be planned, ongoing or completed'),
];

export const createTripRules = [
  body('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Destination must be between 2 and 100 characters'),
  ...optionalTripFields,
];

// On update every field is optional, so a client can change just one field.
export const updateTripRules = [
  body('destination')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Destination cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Destination must be between 2 and 100 characters'),
  ...optionalTripFields,
];

// start date and end date can both change, so the comparison against
// the start date happens in the route where the final dates are known.
export { handleValidation };