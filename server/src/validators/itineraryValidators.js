import { body } from 'express-validator';
import { handleValidation } from './authValidators.js';

// The only thing a client may send is which trip to plan. The prompt, the owner
// and the model are all decided on the server.
export const generateItineraryRules = [
  body('tripId')
    .isMongoId()
    .withMessage('A valid tripId is required'),
];

export { handleValidation };
