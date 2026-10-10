# AI Travel Planner ✈️

An AI-powered travel planning web application that helps users organize trips, generate personalized itineraries, track expenses, and explore destinations using an AI Photo Guide.

[Live Demo](https://ai-travel-planner-ivory-delta.vercel.app/) · [GitHub Repository](https://github.com/Aaditya0700/AI-Travel-Planner)


## Features

* **User Authentication:** Registration, login, and JWT-based authentication.
* **Trip Management:** Create, view, update, and delete trips with destination, travel dates, budget, and currency.
* **AI Itinerary Generator:** Generate personalized day-by-day travel plans using Google Gemini.
* **AI Travel Chatbot:** Get travel-related information and assistance through a conversational interface.
* **AI Photo Guide:** Upload or capture a photo to receive AI-generated information about the location or landmark.
* **Multilingual Photo Guide:** Get Photo Guide responses in English or Hindi.
* **Voice Assistance:** Listen to Photo Guide responses using the voice feature.
* **Expense Tracking:** Record, categorize, and summarize expenses for individual trips.
* **Protected Resources:** Keep trip-related data scoped to authenticated users.
* **Responsive Interface:** Explore the application through a modern web interface.

## Screenshots

Add screenshots of your actual deployed application here.

| Home Page               | AI Itinerary             |
| ----------------------- | ------------------------ |
| Add homepage screenshot | Add itinerary screenshot |

| AI Photo Guide             | Travel Chatbot         |
| -------------------------- | ---------------------- |
| Add Photo Guide screenshot | Add chatbot screenshot |

## Tech Stack

### Frontend

* React 19
* Vite
* React Router DOM
* Fetch API
* CSS

### Backend

* Node.js
* Express 5
* REST API
* JSON Web Tokens (JWT)
* bcryptjs
* express-validator

### Database

* MongoDB
* Mongoose ODM

### AI Integration

* Google Gemini API
* `@google/genai`

### Deployment

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas

## Architecture

The application follows a client-server architecture.

```text
React Frontend (Vercel)
          |
          | HTTP / REST API
          v
Express + Node.js Backend (Render)
          |
          +---- MongoDB Atlas
          |
          +---- Google Gemini API
```

The frontend communicates with the backend through REST API endpoints. The backend handles authentication, database operations, and AI requests.

## Project Structure

```text
AI-Travel-Planner/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── vercel.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## Getting Started

### Prerequisites

Install the following before running the project:

* Node.js 18 or later, compatible with the installed dependencies
* npm
* MongoDB locally or a MongoDB Atlas account
* A Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/Aaditya0700/AI-Travel-Planner.git
cd AI-Travel-Planner
```

### 2. Install dependencies

Install the backend dependencies:

```bash
cd server
npm install
```

Install the frontend dependencies in a separate terminal:

```bash
cd AI-Travel-Planner/client
npm install
```

Use the actual local project path if your terminal is not already in the repository root.

### 3. Configure environment variables

Create `server/.env` using `server/.env.example` as a reference.

Configure the following variables:

```env
PORT=5100
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_supported_gemini_model
```

Create `client/.env` using `client/.env.example` as a reference:

```env
VITE_API_URL=http://localhost:5100
```

Use the API base URL format expected by the application. If the frontend expects `/api/v1` as part of the base URL, include it accordingly.

**Security:** Never commit real API keys, database credentials, JWT secrets, or `.env` files to GitHub. Use your hosting provider's environment-variable settings for production.

### 4. Run the backend

Open a terminal:

```bash
cd server
npm run dev
```

The backend should start on the configured port.

### 5. Run the frontend

Open another terminal:

```bash
cd client
npm run dev
```

Open the local URL displayed by Vite in your terminal, usually `http://localhost:5173`.

### 6. Build the frontend

To create a production build:

```bash
cd client
npm run build
```

### 7. Run lint checks

Run the following commands if the corresponding lint scripts are configured in each package:

```bash
cd client
npm run lint
```

```bash
cd server
npm run lint
```

## API Overview

The backend exposes REST API endpoints for authentication, trip management, expenses, and AI itineraries.

| Method | Endpoint                       | Purpose                   |
| ------ | ------------------------------ | ------------------------- |
| POST   | `/api/v1/auth/register`        | Register a user           |
| POST   | `/api/v1/auth/login`           | Authenticate a user       |
| GET    | `/api/v1/auth/me`              | Retrieve the current user |
| `/`    | `/api/v1/trips/*`              | Trip management           |
| `/`    | `/api/v1/expenses/*`           | Expense management        |
| GET    | `/api/v1/expenses/summary`     | Retrieve expense totals   |
| POST   | `/api/v1/itineraries/generate` | Generate an AI itinerary  |
| GET    | `/api/v1/itineraries/`         | List user itineraries     |
| GET    | `/api/v1/health`               | Check backend health      |

Protected endpoints require authentication. Refer to the source code for the exact HTTP methods, request bodies, and response formats supported by each route.

## Security Considerations

* Passwords are hashed using bcryptjs.
* JWTs are used for authenticated requests.
* Protected routes enforce authentication.
* User ownership checks help prevent unauthorized access to trip resources.
* Gemini API requests are made from the backend.
* Environment variables keep credentials out of frontend source code.

## Future Improvements

* Edit and customize AI-generated itineraries.
* Add expense charts and spending analytics.
* Add trip sharing and collaboration.
* Implement email verification and password recovery.
* Expand automated testing.
* Add offline support and progressive web app capabilities.
* Improve travel recommendations and itinerary personalization.

## Author

Developed as a full-stack portfolio project to explore React, Node.js, Express, MongoDB, authentication, and generative AI.

**Live application:** https://ai-travel-planner-ivory-delta.vercel.app/

**Source code:** https://github.com/Aaditya0700/AI-Travel-Planner
