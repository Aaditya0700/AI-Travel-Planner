# AI Travel Planner

A full-stack web application for planning trips, tracking expenses, and generating AI-powered day-by-day itineraries. Built as a student portfolio project.

## Features

- **User Authentication**: Secure registration, login, and JWT-based session management
- **Trip Management**: Create, read, update, and delete trips with dates, budget, and currency
- **Expense Tracking**: Log, categorize, and summarize trip expenses with per-trip totals
- **AI Itinerary Generation**: Generate detailed day-by-day itineraries using Google Gemini AI based on destination, dates, budget, and notes
- **Protected Routes**: All trip, expense, and itinerary data is scoped to authenticated users
- **Validation & Security**: Input validation, ownership checks, and secure API design

## Tech Stack

### Frontend
- React 19 with Vite
- React Router DOM (client-side routing)
- Fetch API for HTTP requests
- CSS for styling

### Backend
- Node.js with Express 5
- MongoDB with Mongoose ODM
- JSON Web Tokens (JWT) for authentication
- bcryptjs for password hashing
- express-validator for request validation
- @google/genai for Gemini API integration

## Architecture

- **Frontend**: React SPA served via Vite (dev) / static build (prod)
- **Backend**: RESTful Express API (`/api/v1/*`)
- **Database**: MongoDB (local or Atlas)
- **AI Service**: Google Gemini API for itinerary generation

Flow: React frontend → Express/Node backend → MongoDB. Backend → Gemini API for AI itinerary generation.

## Project Structure

\`\`\`
AI-Travel-Planner/
├── client/                # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # Auth context
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client/services
│   │   └── ...
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── config/       # DB, Gemini config
│   │   ├── middleware/   # Auth middleware
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic (Gemini)
│   │   ├── validators/   # Input validation
│   │   └── app.js, index.js
│   └── package.json
└── README.md
\`\`\`

## Backend

- **Auth** (`/api/v1/auth`): Register, login, get current user. Passwords hashed with bcrypt; JWTs signed with `JWT_SECRET`.
- **Trips** (`/api/v1/trips`): CRUD operations scoped to authenticated user. Ownership enforced on all operations.
- **Expenses** (`/api/v1/expenses`): CRUD + summary endpoint (`/summary?tripId=...`) with trip ownership validation.
- **Itineraries** (`/api/v1/itineraries`): Generate AI itinerary per trip (`POST /generate`), retrieve by trip or list user itineraries. Enforces max trip length and validates AI responses.
- **Health** (`/`, `/api/v1/health`): Basic health check endpoint.

## Frontend

- Vite-powered React app with client-side routing (React Router)
- Auth context for managing user/token state
- Protected routes requiring authentication
- Pages: Login, Register, Trips list, Trip detail (with expenses + itinerary)
- Services layer abstracts API calls to backend

## Gemini AI Integration

- Backend-only integration via `@google/genai`
- Configuration from `GEMINI_API_KEY` and `GEMINI_MODEL` (env vars)
- Generates structured day-by-day itineraries based on trip details (destination, dates, budget, notes)
- Validates AI responses, handles missing config/unavailable/errors gracefully
- Never exposes API key to frontend

## Authentication

- JWT-based auth with Bearer tokens
- `protect` middleware on protected routes
- User ownership enforced on all resource operations (trips/expenses/itineraries)
- Passwords never returned in API responses

## Expense Management

- Expenses belong to a trip and the owning user
- CRUD operations with validation (amount/category/date etc.)
- Aggregated summary endpoint computes total spent per trip
- Currency shown from associated trip

## Environment Variables

### Server (`server/.env`)
Required/optional variables (see `server/.env.example`):
- `PORT` (default: 5100)
- `MONGO_URI` (MongoDB connection string)
- `JWT_SECRET` (required for signing tokens)
- `JWT_EXPIRES_IN` (e.g., `7d`)
- `GEMINI_API_KEY` (required for AI itinerary generation)
- `GEMINI_MODEL` (e.g., `gemini-3.5-flash-lite`)

### Client (`client/.env`)
- `VITE_API_URL` (backend API base URL, e.g., `http://localhost:5100`) - exposed to browser (must not contain secrets)

## Local Setup

1. **Prerequisites**
   - Node.js 18+ and npm
   - MongoDB running locally (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI

2. **Clone and install**
   \`\`\`bash
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   \`\`\`

3. **Environment setup**
   - Copy `server/.env.example` to `server/.env` and fill required values
   - Copy `client/.env.example` to `client/.env` and set `VITE_API_URL`

## How to Run

### Start Backend (Dev)
\`\`\`bash
cd server
npm run dev  # uses nodemon
\`\`\`

### Start Frontend (Dev)
\`\`\`bash
cd client
npm run dev  # starts Vite dev server
\`\`\`

### Production Build (Client)
\`\`\`bash
cd client
npm run build
\`\`\`

### Linting
\`\`\`bash
# Client
cd client && npm run lint

# Server
cd server && npm run lint
\`\`\`

## API Endpoint Overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Register new user |
| POST | `/api/v1/auth/login` | No | Login, returns JWT |
| GET | `/api/v1/auth/me` | Yes | Get current user |
| GET/POST/PUT/DELETE | `/api/v1/trips/*` | Yes | Trip CRUD (scoped to user) |
| GET/POST/PUT/DELETE | `/api/v1/expenses/*` | Yes | Expense CRUD (scoped to user) |
| GET | `/api/v1/expenses/summary` | Yes | Trip expense totals |
| POST | `/api/v1/itineraries/generate` | Yes | Generate AI itinerary for trip |
| GET | `/api/v1/itineraries/` | Yes | List user's itineraries |
| GET | `/api/v1/itineraries/trip/:tripId` | Yes | Get itinerary for specific trip |
| GET | `/`, `/api/v1/health` | No | Health check |

## Production/Deployment Considerations

- Set secure `JWT_SECRET` (long random string)
- Use production MongoDB (Atlas recommended)
- Configure CORS appropriately for your frontend domain
- Set `VITE_API_URL` to production backend URL
- Run `npm run build` for client; serve static files or use reverse proxy
- Keep `GEMINI_API_KEY` server-side only; never expose to client
- Consider rate limiting, input size limits, and error monitoring for production
- Ensure `.env` files are never committed (gitignored)

## Future Improvements

- Add itinerary editing/customization after AI generation
- Implement expense categories with charts/visualizations
- Add email verification/password reset
- Enable real-time collaboration on trips
- Add offline support/PWA capabilities
- Expand test coverage (unit/integration)
- Add file uploads (receipts, photos)
- Implement trip sharing with granular permissions
- Add multi-currency conversion
- Improve mobile responsiveness further
