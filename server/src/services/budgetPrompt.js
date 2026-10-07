// Builds the structured prompt for the AI budget planner.
// The client only sends a tripId. All trip data is fetched server-side
// and structured here so the model never receives raw database documents.

import { Type } from '@google/genai';

const MAX_EXPENSES_IN_PROMPT = 50;

export const budgetResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'Short explanation of the budget allocation strategy.'
    },
    currency: {
      type: Type.STRING,
      description: 'Trip currency code (e.g., INR, EUR, USD).'
    },
    budget: {
      type: Type.NUMBER,
      description: 'Total trip budget as provided by the user.'
    },
    estimatedTotal: {
      type: Type.NUMBER,
      description: 'Total estimated spending across all categories.'
    },
    estimatedRemaining: {
      type: Type.NUMBER,
      description: 'Budget minus estimated total. Can be negative.'
    },
    categories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Category name (e.g., Accommodation, Food).' },
          amount: { type: Type.NUMBER, description: 'Estimated amount for this category.' },
          percentage: { type: Type.NUMBER, description: 'Percentage of estimated total.' },
          reason: { type: Type.STRING, description: 'Brief reasoning for this allocation.' }
        },
        required: ['name', 'amount', 'percentage', 'reason']
      }
    },
    savingTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Practical ways to reduce costs for this trip.'
    },
    warnings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Any concerns about budget realism or overspending.'
    }
  },
  required: ['summary', 'currency', 'budget', 'estimatedTotal', 'estimatedRemaining', 'categories', 'savingTips', 'warnings']
};

function formatCurrency(amount, currency) {
  if (amount === null || amount === undefined) return 'Not set';
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(value) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildTripContext(trip) {
  const startDate = formatDate(trip.startDate);
  const endDate = formatDate(trip.endDate);
  const duration = trip.numberOfDays ? `${trip.numberOfDays} days` : 'Duration not set';
  const budgetLine =
    trip.budget === null || trip.budget === undefined
      ? 'No budget was set for this trip.'
      : `Total budget: ${formatCurrency(trip.budget, trip.currency || 'INR')}`;

  return [
    'TRIP:',
    `Destination: ${trip.destination}`,
    `Dates: ${startDate} → ${endDate}`,
    `Duration: ${duration}`,
    budgetLine,
    `Currency: ${trip.currency || 'INR'}`,
    trip.notes ? `Notes: ${trip.notes}` : 'Notes: None',
  ].join('\n');
}

function buildExpenseContext(expenses, trip) {
  if (!expenses || expenses.length === 0) {
    return [
      'EXISTING EXPENSES:',
      'No expenses recorded yet.',
      'Actual total spent: 0',
      trip.budget !== null && trip.budget !== undefined
        ? `Actual remaining budget: ${formatCurrency(trip.budget, trip.currency || 'INR')}`
        : 'Actual remaining budget: Unknown (no budget set)',
    ].join('\n');
  }

  const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const categoryTotals = expenses.reduce((acc, e) => {
    const cat = e.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0);
    return acc;
  }, {});

  const categoryLines = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([cat, amount]) => `  ${cat}: ${formatCurrency(amount, trip.currency || 'INR')}`);

  const remaining = trip.budget !== null && trip.budget !== undefined
    ? trip.budget - totalSpent
    : null;

  const expenseCount = expenses.length;
  const showCount = Math.min(expenseCount, MAX_EXPENSES_IN_PROMPT);
  const note = expenseCount > MAX_EXPENSES_IN_PROMPT
    ? ` (showing top ${showCount} of ${expenseCount} categories)`
    : '';

  return [
    'EXISTING EXPENSES:',
    `Actual total spent: ${formatCurrency(totalSpent, trip.currency || 'INR')}`,
    remaining !== null
      ? `Actual remaining budget: ${formatCurrency(remaining, trip.currency || 'INR')}`
      : 'Actual remaining budget: Unknown (no budget set)',
    `Number of expenses recorded: ${expenseCount}`,
    '',
    'Spending by category:' + note,
    ...(categoryLines.length ? categoryLines : ['  (none)']),
  ].join('\n');
}

export function buildBudgetPrompt(trip, expenses) {
  const tripContext = buildTripContext(trip);
  const expenseContext = buildExpenseContext(expenses, trip);

  const systemInstruction = [
    'You are a travel budget planning assistant.',
    'Your job is to create a realistic estimated budget allocation for the given trip.',
    'Rules:',
    '1. Use ONLY the provided trip information. Do not invent or assume data not in the context.',
    '2. Existing expenses are FACTUAL application data. Do not modify or question them.',
    '3. Budget recommendations are ESTIMATES. Clearly distinguish them from actual spending.',
    '4. Respect the trip currency. All amounts must be in that currency.',
    '5. Consider trip duration, destination, and total budget when allocating.',
    '6. If existing spending is present, account for it. The estimated total should be for REMAINING trip spending.',
    '7. Try to keep the proposed total (actual spent + estimated remaining) within the user\'s budget.',
    '8. If the current budget appears unrealistic for the destination, explain why in warnings.',
    '9. Provide practical cost-saving suggestions in savingTips.',
    '10. Do not claim prices are live/current unless the application provides live pricing data.',
    '11. Do not modify database records, create expenses, or modify the trip.',
    '12. Only return a single valid JSON object matching the required schema. No markdown, no code fences, no commentary.',
  ].join(' ');

  const userPrompt = [
    'Generate an estimated budget allocation for the remaining trip spending based on the context below.',
    '',
    tripContext,
    '',
    expenseContext,
    '',
    'IMPORTANT: The "estimatedTotal" should represent the ESTIMATED REMAINING spending for the trip',
    '(not including already-spent money). The "budget" field is the user\'s total budget.',
    'The "estimatedRemaining" = budget - (actualSpent + estimatedTotal).',
    'If actualSpent is already close to or exceeds budget, note this in warnings and still provide',
    'an estimate for what the rest of the trip might cost.',
    '',
    'Categories should be practical for the destination (e.g., Accommodation, Food, Transportation, Activities, Shopping, Emergency/Miscellaneous).',
    'Do not force every category if it does not make sense for this trip.',
    '',
    'Return JSON in exactly this shape:',
    '{',
    '  "summary": "string",',
    '  "currency": "string",',
    '  "budget": number,',
    '  "estimatedTotal": number,',
    '  "estimatedRemaining": number,',
    '  "categories": [',
    '    { "name": "string", "amount": number, "percentage": number, "reason": "string" }',
    '  ],',
    '  "savingTips": ["string", ...],',
    '  "warnings": ["string", ...]',
    '}',
  ].join('\n');

  return { systemInstruction, userPrompt };
}