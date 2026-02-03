# Pastebin Lite

A simple Pastebin-like application built with Node.js, Express, React, and PostgreSQL.

## Features

- Create text pastes with optional constraints
- Time-based expiry (TTL)
- View count limits
- Shareable URLs
- Safe HTML rendering
- RESTful API
- Deterministic time testing support

## Persistence Layer

This application uses **PostgreSQL** as the persistence layer. The database stores pastes with the following schema:

```sql
CREATE TABLE pastes (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  expires_at TIMESTAMP,
  max_views INTEGER,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Setup Instructions

### Prerequisites

- Node.js 16+ 
- PostgreSQL database
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd pastebin-lite
   ```

2. **Install dependencies:**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your PostgreSQL connection string:
   ```
   DATABASE_URL=postgresql://username:password@hostname:5432/database_name
   PORT=3001
   NODE_ENV=development
   ```

4. **Run the application:**
   
   For development (runs both backend and frontend):
   ```bash
   npm run dev
   ```
   
   Or run them separately:
   ```bash
   # Backend
   npm run server
   
   # Frontend (in another terminal)
   npm run client
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Health Check
- `GET /api/healthz` - Returns application health status

### Create Paste
- `POST /api/pastes` - Create a new paste
  
  Request body:
  ```json
  {
    "content": "string",
    "ttl_seconds": 60,
    "max_views": 5
  }
  ```

### Fetch Paste (API)
- `GET /api/pastes/:id` - Retrieve paste content and metadata

### View Paste (HTML)
- `GET /p/:id` - View paste in HTML format

## Testing Mode

Set `TEST_MODE=1` in environment variables to enable deterministic time testing. When enabled, use the `x-test-now-ms` header to control the current time for expiry logic.

Example:
```bash
curl -H "x-test-now-ms: 1640995200000" http://localhost:3001/api/pastes/some-id
```

## Design Decisions

1. **PostgreSQL for Persistence**: Chosen for reliability, ACID compliance, and serverless compatibility
2. **UUID for Paste IDs**: Prevents enumeration and provides sufficient entropy
3. **Express.js**: Minimal, battle-tested framework for the API
4. **React with TypeScript**: Type safety and better developer experience
5. **Server-side Rendering for Paste Views**: Ensures content is accessible even without JavaScript
6. **HTML Escaping**: Prevents XSS attacks when rendering paste content
7. **Connection Pooling**: Efficient database connection management for serverless environments

## Deployment

The application is designed to work well on serverless platforms like Vercel:

- Uses connection pooling for database efficiency
- No global mutable state
- Stateless design
- Static file serving for React build

## Security Considerations

- All user input is validated
- HTML content is properly escaped
- CORS headers are configured
- Helmet.js for security headers
- No sensitive data in client-side code
