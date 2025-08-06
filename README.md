# Cabo FitPass Booking System

A comprehensive Node.js booking system for fitness classes with Supabase backend integration. This project provides a complete solution for managing gym classes, user profiles, and bookings through a web interface and REST API.

## Features

- **Class Management**: Browse available fitness classes with capacity tracking
- **User Booking System**: Book classes with different payment types (drop-in, monthly, one-time)
- **Foreign Key Validation**: Comprehensive user profile validation and error handling
- **Web Interface**: EJS-based UI for easy class browsing and booking
- **REST API**: Full API endpoints for programmatic booking management
- **Supabase Integration**: PostgreSQL database with Row Level Security (RLS)
- **MCP Server Support**: Model Context Protocol integration for Lovable.dev

## Technologies

- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL with pgvector)
- **Frontend**: EJS templates, CSS
- **Authentication**: Supabase Auth
- **Environment**: MCP (Model Context Protocol)

## Getting Started

### Prerequisites

- Node.js (>=16.0.0)
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/CaboAi/cabo-fit-flow.git
cd cabo-fit-flow
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. Start the development server:
```bash
npm run dev
```

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run fix-profiles` - Fix foreign key violations
- `npm run test-profile` - Test profile and booking creation
- `npm run create-user` - Create user with service role (if available)

## API Endpoints

### Classes
- `GET /classes` - View classes with booking interface
- `GET /api/v1/classes` - Get all classes (JSON)
- `GET /api/v1/classes/:id` - Get specific class

### Bookings
- `POST /book-class` - Book a class (form submission)
- `POST /api/v1/book` - Book a class (JSON API)
- `GET /api/v1/bookings` - Get all bookings
- `GET /api/v1/bookings/user/:userId` - Get user bookings

### System
- `GET /api/v1/info` - API information and health check

## Database Schema

The system uses these main tables:
- `gyms` - Gym locations and information
- `classes` - Fitness classes with scheduling and capacity
- `profiles` - User profiles linked to auth.users
- `bookings` - Class bookings with payment tracking

## Foreign Key Resolution

The system includes comprehensive foreign key validation and automatic resolution for common issues:

- **User Profile Validation**: Ensures users exist before allowing bookings
- **RLS Policy Handling**: Manages Row Level Security restrictions
- **Manual SQL Scripts**: Provided for dashboard-based fixes
- **Service Role Integration**: Automated fixes with admin privileges

See `PROFILES_FKEY_VIOLATION_SOLUTION.md` for detailed troubleshooting.

## Development

### Project Structure
```
├── server.js                 # Main Express server
├── views/                    # EJS templates
├── public/                   # Static assets (CSS, images)
├── *.js                     # Test and utility scripts
├── *.sql                    # Database setup scripts
└── *.md                     # Documentation
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Check existing documentation files
- Review SQL scripts for database setup
- Use provided test scripts for debugging
- Contact: Mario Polanco Jr <mariopjr91@gmail.com>