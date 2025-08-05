# CaboFit Backend

## Structure

```
backend/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Express middleware
├── models/         # Data models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
├── app.js          # Express app setup
└── server.js       # Server entry point
```

## API Endpoints

### Authentication
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- POST `/api/auth/refresh`
- POST `/api/auth/forgot-password`
- POST `/api/auth/reset-password`

### User Profile
- GET `/api/users/profile`
- PUT `/api/users/profile`
- DELETE `/api/users/profile`

### Workouts
- GET `/api/users/workouts`
- POST `/api/users/workouts`
- PUT `/api/users/workouts/:id`
- DELETE `/api/users/workouts/:id`

### Subscriptions
- GET `/api/subscriptions`
- POST `/api/subscriptions/create`
- POST `/api/subscriptions/cancel`
- POST `/api/subscriptions/update`
- GET `/api/subscriptions/plans`

### Payments
- POST `/api/payments/create-payment-intent`
- GET `/api/payments/payment-methods`
- POST `/api/payments/payment-methods`
- DELETE `/api/payments/payment-methods/:id`
- POST `/api/payments/webhook`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in values

3. Run development server:
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for required environment variables.