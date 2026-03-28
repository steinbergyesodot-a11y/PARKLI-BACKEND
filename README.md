# PARKLI Backend

A Node.js/Express backend for PARKLI, a parking space rental platform. Users can list driveways, book parking spaces, and process payments via Stripe.

## Tech Stack

- **Runtime**: Node.js 20.x
- **Framework**: Express.js 5.x
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + Google OAuth
- **Payments**: Stripe
- **File Upload**: Cloudinary
- **Logging**: Winston + Logtail
- **Error Tracking**: Sentry
- **Validation**: Zod
- **Rate Limiting**: express-rate-limit
- **Security**: Helmet, CORS, bcrypt

## Quick Start

### Prerequisites
- Node.js 20.x
- MongoDB connection string
- Cloudinary account
- Stripe account
- Google OAuth credentials
- Logtail & Sentry accounts (optional)

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd PARKLI-BACKEND
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Start development server**
```bash
npm run dev
```

Server runs on `http://localhost:4000` by default.

## Project Structure

```
src/
├── express/
│   ├── server.ts          # Express app setup & middleware
│   ├── router.ts          # Main API router
│   ├── stripe.ts          # Stripe client
│   ├── users/             # User management routes & logic
│   ├── driveways/         # Driveway listing routes & logic
│   ├── bookings/          # Booking routes & logic
│   └── webhook/           # Stripe webhook handler
├── config/
│   ├── index.ts           # Environment configuration
│   └── dotenv.ts          # Dotenv setup
├── utils/
│   ├── middleware/        # Custom Express middleware
│   │   ├── authenticateToken.ts
│   │   ├── authorize.ts
│   │   ├── errorHandler.ts
│   │   └── ...
│   ├── logger/            # Winston logger setup
│   ├── responseWrapper.ts # Standardized API responses
│   └── ...
└── index.ts               # Database connection
```

## API Endpoints

### Users
- `POST /api/users/addUser` - Register new user
- `POST /api/users/login` - Login (rate limited)
- `POST /api/users/google-login` - Google OAuth login
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId/firstName/:firstName` - Update first name
- `PUT /api/users/:userId/lastName/:lastName` - Update last name
- `PUT /api/users/:userId/email/:email` - Update email
- `GET /api/users/stripe/check-status` - Check Stripe onboarding status

### Driveways
- `POST /api/driveways` - Create driveway (with image upload)
- `GET /api/driveways` - Get all driveways
- `GET /api/driveways/:drivewayId` - Get single driveway
- `GET /api/driveways/getAllDrivewaysByUserId/:userId` - Get user's driveways
- `PUT /api/driveways/:drivewayId` - Update driveway
- `PUT /api/driveways/:drivewayId/block/:gameDate` - Block date
- `PUT /api/driveways/:drivewayId/unblock/:gameDate` - Unblock date

### Bookings
- `POST /api/bookings` - Create booking
- `POST /api/bookings/createPaymentIntent` - Create Stripe payment intent
- `GET /api/bookings/:userId` - Get user's bookings
- `DELETE /api/bookings/:bookingId` - Cancel booking
- `POST /api/bookings/cancelBooking` - Cancel booking (alternative)

## Authentication

- **JWT**: Pass token in `Authorization: Bearer <token>` header
- **Rate Limiting**: Login endpoint limited to 5 attempts per 10 minutes
- **Ownership**: Protected endpoints verify user ownership

## Response Format

All API responses follow this format:
```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null
}
```

## Error Handling

Errors are caught globally by the error handler middleware and return appropriate HTTP status codes:
- `400` - Bad request / validation errors
- `401` - Unauthorized / invalid credentials
- `403` - Forbidden / access denied
- `404` - Not found
- `500` - Server error

## Scripts

```bash
npm run dev      # Start development server (with hot reload)
npm run build    # Compile TypeScript to JavaScript
npm start        # Run compiled production build
```

## Build & Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guide.

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -m "Add my feature"`
3. Push to remote: `git push origin feature/my-feature`
4. Open a pull request

## Security

- All sensitive data removed from `.env` before commit
- Password hashed with bcrypt (12 rounds)
- SQL/NoSQL injection prevention via schema validation
- Rate limiting on sensitive endpoints
- CORS configured for frontend domains
- Helmet for HTTP headers security
- Fraud detection for rapid bookings
- Sentry for error monitoring

## Monitoring & Logging

- **Logs**: Winston logger outputs to console and Logtail
- **Errors**: Sentry captures unhandled exceptions
- **Stripe Events**: Webhook handler processes payment events
- **Health Check**: `GET /health` or `/isAlive`

## License

ISC
