// Builds the prompt for photo-based travel guide generation.
// The client sends a base64 encoded image; the server constructs a prompt
// asking Gemini to identify the landmark/place and generate a travel guide.
//
// The model is asked for plain JSON in the prompt instead of using a
// responseSchema, because constrained schema output was one of the request
// shapes that stalled gemini-3.8-flash. Parsing is defensive instead.

export function buildPhotoGuidePrompt() {
  const systemInstruction = [
    'You are an expert travel guide and landmark identification specialist.',
    'Analyze the provided photo to identify the landmark or notable place.',
    'Generate a concise travel guide for that place.',
    'Only respond with a single valid JSON object.',
    'No markdown, no code fences, no commentary before or after the JSON.',
    'If you cannot identify the place with confidence, still return a valid JSON object but say in placeName that the location is uncertain, and say in the description that identification is uncertain instead of inventing facts.',
    'Be accurate and factual. If unsure about details, give general guidance rather than inventing specifics.',
    'Keep every field short: one or two sentences for prose fields, up to five short items for list fields.'
  ].join(' ');

  const userPrompt = [
    'Identify the landmark or notable place in this photo and create a travel guide.',
    '',
    'Return JSON in exactly this shape:',
    '{',
    '  "placeName": "string",',
    '  "location": "string",',
    '  "description": "string",',
    '  "history": "string",',
    '  "significance": "string",',
    '  "bestTimeToVisit": "string",',
    '  "highlights": ["string", "string", "string"],',
    '  "practicalInfo": {',
    '    "openingHours": "string",',
    '    "entryFee": "string",',
    '    "howToGetThere": "string",',
    '    "tips": ["string", "string"]',
    '  },',
    '  "nearbyAttractions": ["string", "string"],',
    '  "photoTips": ["string", "string"]',
    '}'
  ].join('\n');

  return { systemInstruction, userPrompt };
}

function readRequiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Gemini response is missing ${field}`);
  }
  return value.trim();
}

function readRequiredArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Gemini response is missing ${field}`);
  }
  return value.map((item) => readRequiredString(item, `${field} item`));
}

function readRequiredObject(value, field, requiredKeys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Gemini response is missing ${field}`);
  }
  const result = {};
  for (const key of requiredKeys) {
    result[key] = readRequiredString(value[key], `${field}.${key}`);
  }
  return result;
}

// Gemini sometimes wraps JSON in a ```json markdown fence despite instructions.
function stripCodeFences(text) {
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return fenced[1].trim();
  return text;
}

export function parseAndValidatePhotoGuide(text) {
  let parsed;
  try {
    parsed = JSON.parse(stripCodeFences(text));
  } catch {
    throw new Error('Gemini response was not valid JSON');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Gemini response was not an object');
  }

  return {
    placeName: readRequiredString(parsed.placeName, 'placeName'),
    location: readRequiredString(parsed.location, 'location'),
    description: readRequiredString(parsed.description, 'description'),
    history: readRequiredString(parsed.history, 'history'),
    significance: readRequiredString(parsed.significance, 'significance'),
    bestTimeToVisit: readRequiredString(parsed.bestTimeToVisit, 'bestTimeToVisit'),
    highlights: readRequiredArray(parsed.highlights, 'highlights'),
    practicalInfo: readRequiredObject(parsed.practicalInfo, 'practicalInfo', [
      'openingHours',
      'entryFee',
      'howToGetThere',
      'tips'
    ]),
    nearbyAttractions: readRequiredArray(parsed.nearbyAttractions, 'nearbyAttractions'),
    photoTips: readRequiredArray(parsed.photoTips, 'photoTips')
  };
}
