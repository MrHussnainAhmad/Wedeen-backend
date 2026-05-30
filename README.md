# WeDeen Backend

Production-ready Express + MongoDB API for WeDeen.

## Setup

1. Copy `.env.example` to `.env`
2. Fill env values
3. Install and run:

```bash
npm install
npm run dev
```

## Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Memorization
- `GET /api/memorization`
- `POST /api/memorization/mark`
- `PUT /api/memorization/update`
- `DELETE /api/memorization/:id`
- `GET /api/memorization/stats`
