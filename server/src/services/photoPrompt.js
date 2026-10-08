// Builds the prompt for photo-based travel guide generation.
// The client sends a base64 encoded image; the server constructs a prompt
// asking Gemini to identify the landmark/place and generate a travel guide.
//
// The model is asked for plain JSON in the prompt instead of using a
// responseSchema, because constrained schema output was one of the request
// shapes that stalled gemini-3.8-flash. Parsing is defensive instead.

export function buildPhotoGuidePrompt(language = 'English') {
  const isHindi = language === 'Hindi' || language === 'hi' || language === 'हिन्दी';

  const systemInstruction = [
    'You are an expert travel guide and landmark identification specialist.',
    'Analyze the provided photo to identify the landmark or notable place.',
    'Generate a concise travel guide for that place.',
    'Only respond with a single valid JSON object.',
    'No markdown, no code fences, no commentary before or after the JSON.',
    'If you cannot identify the place with confidence, still return a valid JSON object but say in placeName that the location is uncertain, and say in the description that identification is uncertain instead of inventing facts.',
    'Be accurate and factual. If unsure about details, give general guidance rather than inventing specifics.',
    'Keep every field short: one or two sentences for prose fields, up to five short items for list fields.',
    isHindi
      ? 'CRITICAL LANGUAGE REQUIREMENT: Write ALL guide text content and array values entirely in natural Hindi using the Devanagari script (हिन्दी). Do NOT use Latin/Romanized script for Hindi. All JSON object keys/field names MUST remain strictly in English exactly as specified (e.g. "placeName", "location", "description", "history", "significance", "bestTimeToVisit", "highlights", "practicalInfo", "openingHours", "entryFee", "howToGetThere", "tips", "nearbyAttractions", "photoTips"). Never translate JSON keys into Hindi.'
      : 'Write all guide text content in English.'
  ].join(' ');

  const userPrompt = [
    'Identify the landmark or notable place in this photo and create a travel guide.',
    isHindi
      ? 'CRITICAL: The output values must be in natural Hindi written in Devanagari script (हिन्दी). Every string value in the JSON must be in Hindi. Every key name in the JSON MUST remain in English exactly as shown below without translating any key names.'
      : 'Write the travel guide in English.',
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

  if (!parsed.practicalInfo || typeof parsed.practicalInfo !== 'object' || Array.isArray(parsed.practicalInfo)) {
    throw new Error('Gemini response is missing practicalInfo');
  }

  return {
    placeName: readRequiredString(parsed.placeName, 'placeName'),
    location: readRequiredString(parsed.location, 'location'),
    description: readRequiredString(parsed.description, 'description'),
    history: readRequiredString(parsed.history, 'history'),
    significance: readRequiredString(parsed.significance, 'significance'),
    bestTimeToVisit: readRequiredString(parsed.bestTimeToVisit, 'bestTimeToVisit'),
    highlights: readRequiredArray(parsed.highlights, 'highlights'),
    practicalInfo: {
      openingHours: readRequiredString(parsed.practicalInfo.openingHours, 'practicalInfo.openingHours'),
      entryFee: readRequiredString(parsed.practicalInfo.entryFee, 'practicalInfo.entryFee'),
      howToGetThere: readRequiredString(parsed.practicalInfo.howToGetThere, 'practicalInfo.howToGetThere'),
      tips: readRequiredArray(parsed.practicalInfo.tips, 'practicalInfo.tips'),
    },
    nearbyAttractions: readRequiredArray(parsed.nearbyAttractions, 'nearbyAttractions'),
    photoTips: readRequiredArray(parsed.photoTips, 'photoTips')
  };
}
