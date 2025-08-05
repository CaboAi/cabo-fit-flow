# Cabo FitPass Booking API

A local Node.js Express server for managing fitness class bookings with Supabase integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Supabase account and project
- Environment variables configured

### Installation
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Supabase credentials
# Start the server
npm start

# Or start in development mode with auto-reload
npm run dev
```

### Server will start at: `http://localhost:3000`

## 📋 Environment Variables

Create a `.env` file with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Server Configuration
PORT=3000
NODE_ENV=development

# API Configuration
API_VERSION=v1
CORS_ORIGIN=http://localhost:3000,https://cabo-fit-pass.lovable.app

# Booking Configuration
MAX_BOOKINGS_PER_USER=10
BOOKING_CANCELLATION_HOURS=24

# Logging
LOG_LEVEL=info
```

## 📡 API Endpoints

### Base URL: `http://localhost:3000/api/v1`

### Health & Info
- `GET /health` - Server health check
- `GET /api/v1/info` - Server information and configuration

### Gyms & Classes
- `GET /api/v1/gyms` - Get all gyms
- `GET /api/v1/classes` - Get all classes
- `GET /api/v1/classes?gym_id=UUID` - Get classes for specific gym

### Bookings
- `POST /api/v1/book` - Create a new booking
- `GET /api/v1/bookings/:userId` - Get user's bookings
- `GET /api/v1/bookings/:userId?status=pending` - Get user's bookings by status
- `DELETE /api/v1/bookings/:bookingId` - Cancel a booking

## 🎯 Booking Endpoint Details

### POST /api/v1/book

Create a new booking with validation and capacity checking.

**Request Body:**
```json
{
  "user_id": "uuid",
  "class_id": "uuid", 
  "type": "drop-in|monthly|one-time",
  "payment_status": "pending|completed|failed|cancelled|refunded",
  "notes": "Optional booking notes (max 500 characters)"
}
```

**Valid Booking Types:**
- `drop-in` - Single class booking
- `monthly` - Monthly subscription booking
- `one-time` - One-time class booking

**Response (Success):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "booking-uuid",
    "user_id": "user-uuid",
    "class_id": "class-uuid",
    "type": "drop-in",
    "payment_status": "pending",
    "created_at": "2025-08-04T03:00:00Z",
    "classes": {
      "title": "Yoga Session",
      "schedule": "2025-08-04T10:00:00Z",
      "price": 15,
      "capacity": 20,
      "gyms": {
        "name": "Cabo Fit Gym",
        "location": "Cabo San Lucas, Mexico"
      }
    }
  },
  "meta": {
    "remainingCapacity": 15,
    "userBookingCount": 3
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Invalid booking data provided",
  "code": "VALIDATION_ERROR",
  "details": ["user_id is required", "Invalid booking type"]
}
```

## 🔒 Validation Rules

### Booking Validation
- ✅ **Required Fields**: `user_id`, `class_id`
- ✅ **Valid Types**: `drop-in`, `monthly`, `one-time`
- ✅ **Valid Payment Status**: `pending`, `completed`, `failed`, `cancelled`, `refunded`
- ✅ **UUID Format**: Validates UUID format for IDs
- ✅ **Class Existence**: Verifies class exists and is bookable
- ✅ **Capacity Check**: Ensures class is not full
- ✅ **User Limit**: Prevents users from exceeding booking limit
- ✅ **Duplicate Prevention**: Prevents duplicate bookings for same class

### Business Rules
- **Class Capacity**: Bookings rejected when class is full
- **User Limit**: Maximum 10 active bookings per user (configurable)
- **Cancellation Policy**: Bookings can only be cancelled 24+ hours before class
- **Duplicate Prevention**: One booking per user per class

## 🧪 Testing

### Test the API Server
```bash
# Start the server first
npm start

# In another terminal, run API tests
node test_api_client.js
```

### Manual Testing with curl

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Get Classes:**
```bash
curl http://localhost:3000/api/v1/classes
```

**Create Booking:**
```bash
curl -X POST http://localhost:3000/api/v1/book \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "661db286-593a-4c1e-8ce8-fb4ea43cd58a",
    "class_id": "e8c7dd4f-2346-484d-9933-2b338c405540",
    "type": "drop-in",
    "payment_status": "pending"
  }'
```

**Get User Bookings:**
```bash
curl http://localhost:3000/api/v1/bookings/661db286-593a-4c1e-8ce8-fb4ea43cd58a
```

## 🚨 Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `CLASS_NOT_FOUND` | 404 | Class does not exist |
| `CLASS_FULL` | 409 | Class at capacity |
| `DUPLICATE_BOOKING` | 409 | User already booked this class |
| `BOOKING_LIMIT_EXCEEDED` | 409 | User has too many bookings |
| `BOOKING_NOT_FOUND` | 404 | Booking does not exist |
| `UNAUTHORIZED` | 403 | User cannot access booking |
| `CANCELLATION_TOO_LATE` | 400 | Cannot cancel within 24 hours |
| `CONSTRAINT_VIOLATION` | 400 | Database constraint violated |
| `SCHEMA_CACHE_ERROR` | 503 | Database schema updating (retry) |
| `CONNECTION_ERROR` | 503 | Database connection issue (retry) |
| `TABLE_NOT_FOUND` | 503 | Database table not accessible |
| `INVALID_FIELD` | 400 | Database field invalid |
| `DATABASE_ERROR` | 400 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Server error |

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js 16+
- **Framework**: Express.js 5.1.0
- **Database**: Supabase (PostgreSQL)
- **Environment**: dotenv
- **CORS**: Enabled for specified origins
- **Validation**: Custom middleware with business rules

### Database Integration
- **Client**: @supabase/supabase-js
- **Tables**: gyms, classes, bookings, profiles
- **Relationships**: Foreign keys with cascade rules
- **Constraints**: Type validation, capacity limits
- **Indexes**: Optimized for booking queries

### Security Features
- **CORS Protection**: Configured allowed origins
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **Error Handling**: Sanitized error responses
- **Environment Variables**: Secure credential management

## 📊 Performance Considerations

### Database Optimization
- Indexes on frequently queried fields
- Efficient join queries for related data
- Connection pooling via Supabase client
- Pagination support for large datasets

### API Performance
- Async/await for non-blocking operations
- Error handling middleware
- Request logging for monitoring
- Graceful shutdown handling

## 🔧 Development

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start with nodemon (auto-reload)
npm run fix-bookings  # Run database fixes
npm run test-server   # Test booking system
npm run test-api      # Test API endpoints
npm run test-updated  # Test updated booking features
npm run demo          # Run API usage demonstration
```

### Project Structure
```
├── server.js              # Main Express server
├── booking_system_fix.js  # Database setup/fixes
├── test_api_client.js     # API testing client
├── .env                   # Environment variables
├── .env.example          # Environment template
└── package.json          # Dependencies and scripts
```

### Adding New Endpoints

1. **Add route handler in server.js:**
```javascript
app.get('/api/v1/new-endpoint', async (req, res, next) => {
  try {
    // Implementation
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});
```

2. **Add validation if needed:**
```javascript
const validateNewData = (data) => {
  const errors = [];
  // Add validation rules
  return errors;
};
```

3. **Update tests in test_api_client.js**

## 🚀 Deployment

### Local Development
```bash
npm install
cp .env.example .env
# Configure .env
npm run dev
```

### Production
```bash
npm install --production
export NODE_ENV=production
npm start
```

### Docker (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔗 Integration

### Frontend Integration
```javascript
// Example fetch request
const bookClass = async (bookingData) => {
  const response = await fetch('http://localhost:3000/api/v1/book', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bookingData)
  });
  
  return await response.json();
};
```

### Lovable.io Integration
Update your Lovable.io project to use the local API:
```javascript
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Use in your React components
const { data: classes } = await fetch(`${API_BASE_URL}/classes`);
```

## 📝 Changelog

### v1.1.0 (Latest)
- ✅ Enhanced notes field validation (optional, 500 char limit)
- ✅ Updated booking types: drop-in, monthly, one-time
- ✅ Schema cache error handling with retry logic
- ✅ Connection error handling and recovery
- ✅ Database operation retry mechanism
- ✅ Improved error codes and messages
- ✅ Additional test suite for updated features

### v1.0.0
- ✅ Express server with Supabase integration
- ✅ Booking creation with validation
- ✅ Class and gym endpoints
- ✅ User booking management
- ✅ Comprehensive error handling
- ✅ Environment variable configuration
- ✅ API testing suite

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-endpoint`
3. Make changes and test: `npm run test-server`
4. Commit: `git commit -m 'feat: add new endpoint'`
5. Push: `git push origin feature/new-endpoint`
6. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Repository**: https://github.com/CaboAi/cabo-fit-flow.git
- **Issues**: Create GitHub issue
- **Email**: mariopjr91@gmail.com

---

**🏖️ Built for Cabo FitPass - Your fitness journey in paradise! 💪**