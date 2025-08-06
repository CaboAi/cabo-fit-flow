#!/usr/bin/env node

/**
 * Cabo FitPass Booking API Server
 * Local Node.js Express server with Supabase integration
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Environment validation
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Configuration
const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  maxBookingsPerUser: parseInt(process.env.MAX_BOOKINGS_PER_USER) || 10,
  bookingCancellationHours: parseInt(process.env.BOOKING_CANCELLATION_HOURS) || 24,
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize Express app
const app = express();

// Configure EJS template engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Static files middleware
app.use('/css', express.static('public/css'));
app.use('/js', express.static('public/js'));
app.use('/images', express.static('public/images'));

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // For API requests
app.use(express.urlencoded({ extended: true })); // For form submissions

// Set EJS file extension for views
app.set('view options', { extension: 'ejs' });

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Validation constants
const VALID_BOOKING_TYPES = ['drop-in', 'monthly', 'one-time'];
const VALID_PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'cancelled', 'refunded'];

// Utility functions
const logger = {
  info: (message, data = null) => {
    if (config.logLevel === 'info' || config.logLevel === 'debug') {
      console.log(`ℹ️  ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  error: (message, error = null) => {
    console.error(`❌ ${message}`, error ? error.message || error : '');
  },
  warn: (message, data = null) => {
    console.warn(`⚠️  ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message, data = null) => {
    if (config.logLevel === 'debug') {
      console.log(`🐛 ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};

// Validation functions
const validateBookingData = (bookingData) => {
  const errors = [];

  // Required fields
  if (!bookingData.user_id) {
    errors.push('user_id is required');
  }

  if (!bookingData.class_id) {
    errors.push('class_id is required');
  }

  // Validate booking type
  if (bookingData.type && !VALID_BOOKING_TYPES.includes(bookingData.type)) {
    errors.push(`type must be one of: ${VALID_BOOKING_TYPES.join(', ')}`);
  }

  // Validate payment status
  if (bookingData.payment_status && !VALID_PAYMENT_STATUSES.includes(bookingData.payment_status)) {
    errors.push(`payment_status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`);
  }

  // Validate notes field (optional text field)
  if (bookingData.notes !== undefined && bookingData.notes !== null) {
    if (typeof bookingData.notes !== 'string') {
      errors.push('notes must be a string');
    } else if (bookingData.notes.length > 500) {
      errors.push('notes cannot exceed 500 characters');
    }
  }

  // Validate UUID format (basic check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (bookingData.user_id && !uuidRegex.test(bookingData.user_id)) {
    errors.push('user_id must be a valid UUID');
  }

  if (bookingData.class_id && !uuidRegex.test(bookingData.class_id)) {
    errors.push('class_id must be a valid UUID');
  }

  return errors;
};

// Database helper functions with retry logic for schema cache errors
const dbHelpers = {
  async retryOperation(operation, maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries || !(error.message && error.message.includes('schema'))) {
          throw error;
        }
        logger.warn(`Schema cache error on attempt ${attempt}, retrying...`);
        // Wait briefly before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }
  },

  async getClassById(classId) {
    return await this.retryOperation(async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          gyms (
            id,
            name,
            location
          )
        `)
        .eq('id', classId)
        .single();

      if (error) throw error;
      return data;
    });
  },

  async getUserBookingCount(userId) {
    return await this.retryOperation(async () => {
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('payment_status', ['pending', 'completed']);

      if (error) throw error;
      return count || 0;
    });
  },

  async getClassBookingCount(classId) {
    return await this.retryOperation(async () => {
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)
        .in('payment_status', ['pending', 'completed']);

      if (error) throw error;
      return count || 0;
    });
  },

  async checkUserExists(userId) {
    return await this.retryOperation(async () => {
      // Check in profiles table first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      // If profile exists, user is valid
      if (profile && !profileError) {
        return true;
      }

      // If no profile found (PGRST116 is "no rows returned")
      if (profileError && profileError.code === 'PGRST116') {
        return false;
      }

      // If other error, throw it
      if (profileError) {
        throw profileError;
      }

      return false;
    });
  },

  async ensureUserProfile(userId, userData = {}) {
    return await this.retryOperation(async () => {
      try {
        // First check if profile already exists
        const userExists = await this.checkUserExists(userId);
        if (userExists) {
          logger.debug(`Profile already exists for user: ${userId}`);
          return { exists: true, created: false };
        }

        logger.info(`Attempting to create profile for user: ${userId}`);

        // Try to create minimal profile - only include id which is required
        const profileData = {
          id: userId
        };

        // Add optional fields if provided
        if (userData.email) {
          profileData.email = userData.email;
        }
        if (userData.full_name) {
          profileData.full_name = userData.full_name;
        }

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([profileData])
          .select('id')
          .single();

        if (createError) {
          // If profile already exists (race condition), that's OK
          if (createError.code === '23505') {
            logger.info(`Profile already exists for user: ${userId} (race condition)`);
            return { exists: true, created: false };
          }
          
          // If RLS policy prevents creation, provide helpful error
          if (createError.message && createError.message.includes('row-level security')) {
            logger.warn(`Cannot create profile for ${userId} due to RLS policy. User must be created via Supabase Dashboard or Auth.`);
            throw new Error(`User profile must be created through proper authentication. Please register the user first or use an existing user ID.`);
          }
          
          logger.error('Profile creation error:', createError);
          throw new Error(`Profile creation failed: ${createError.message}`);
        }

        logger.info(`Profile created successfully for user: ${userId}`);
        return { exists: true, created: true, profile: newProfile };
        
      } catch (error) {
        logger.error(`ensureUserProfile error for ${userId}:`, error);
        throw error;
      }
    });
  }
};

// Error handling middleware
const errorHandler = (error, req, res, next) => {
  logger.error('API Error:', error);

  // Handle schema cache errors
  if (error.message && error.message.includes('schema')) {
    logger.warn('Schema cache error detected, may be temporary');
    return res.status(503).json({
      success: false,
      error: 'Schema cache error',
      message: 'Database schema is being updated, please try again',
      code: 'SCHEMA_CACHE_ERROR',
      retry: true
    });
  }

  // Handle connection errors
  if (error.code === 'PGRST301' || error.message?.includes('connection')) {
    return res.status(503).json({
      success: false,
      error: 'Database connection error',
      message: 'Unable to connect to database, please try again',
      code: 'CONNECTION_ERROR',
      retry: true
    });
  }

  // Supabase-specific errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          success: false,
          error: 'Duplicate booking',
          message: 'You have already booked this class',
          code: 'DUPLICATE_BOOKING'
        });
      
      case '23503': // Foreign key violation
        let fkMessage = 'Invalid reference - related record does not exist';
        
        // Specific handling for user foreign key
        if (error.message && error.message.includes('bookings_user_id_fkey')) {
          fkMessage = 'User profile does not exist. Please ensure the user is registered.';
        }
        // Specific handling for class foreign key
        else if (error.message && error.message.includes('bookings_class_id_fkey')) {
          fkMessage = 'Class does not exist or has been removed.';
        }
        
        return res.status(400).json({
          success: false,
          error: 'Invalid reference',
          message: fkMessage,
          code: 'INVALID_REFERENCE'
        });
      
      case '23514': // Check constraint violation
        return res.status(400).json({
          success: false,
          error: 'Constraint violation',
          message: error.message || 'Invalid data provided',
          code: 'CONSTRAINT_VIOLATION'
        });

      case '42P01': // Undefined table
        return res.status(503).json({
          success: false,
          error: 'Table not found',
          message: 'Database table does not exist or is not accessible',
          code: 'TABLE_NOT_FOUND'
        });

      case '42703': // Undefined column
        return res.status(400).json({
          success: false,
          error: 'Invalid field',
          message: 'One or more database fields are invalid',
          code: 'INVALID_FIELD'
        });
    }
  }

  // Handle Supabase REST API errors
  if (error.details || error.hint) {
    return res.status(400).json({
      success: false,
      error: 'Database operation failed',
      message: error.message || 'Database operation could not be completed',
      code: 'DATABASE_ERROR',
      details: config.nodeEnv === 'development' ? {
        details: error.details,
        hint: error.hint
      } : undefined
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? error.message : 'Something went wrong',
    code: 'INTERNAL_ERROR'
  });
};

// API Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Cabo FitPass API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: config.apiVersion
  });
});

// UI Routes

// Enhanced homepage route
app.get('/', async (req, res, next) => {
  try {
    const statsData = await Promise.all([
      supabase.from('classes').select('count', { count: 'exact', head: true }),
      supabase.from('gyms').select('count', { count: 'exact', head: true }),
      supabase.from('bookings').select('count', { count: 'exact', head: true })
    ]);

    const stats = {
      totalClasses: statsData[0].count || 0,
      totalGyms: statsData[1].count || 0,
      totalBookings: statsData[2].count || 0
    };

    res.render('enhanced_homepage', { stats });
  } catch (error) {
    logger.error('Homepage error:', error);
    res.render('enhanced_homepage', { 
      stats: { totalClasses: 0, totalGyms: 0, totalBookings: 0 }
    });
  }
});

// Enhanced classes route
app.get('/classes', async (req, res, next) => {
  try {
    const { success, error } = req.query;
    
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select(`*, gyms(*), bookings(id, payment_status)`)
      .order('schedule');

    if (classesError) throw classesError;

    res.render('enhanced_classes', {
      classes: classes || [],
      success: success ? decodeURIComponent(success) : null,
      error: error ? decodeURIComponent(error) : null
    });
  } catch (error) {
    logger.error('Classes error:', error);
    res.render('enhanced_classes', { classes: [], error: 'Unable to load classes' });
  }
});

// User dashboard route
app.get('/dashboard', async (req, res, next) => {
  try {
    const userId = '661db286-593a-4c1e-8ce8-fb4ea43cd58a';
    
    const [profileResult, bookingsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('bookings').select(`*, classes(*, gyms(*))`).eq('user_id', userId).order('created_at', { ascending: false })
    ]);

    const profile = profileResult.data || { full_name: 'Demo User', email: 'demo@cabofit.com' };
    const bookings = bookingsResult.data || [];

    const stats = {
      totalBookings: bookings.length,
      upcomingBookings: bookings.filter(b => new Date(b.classes.schedule) > new Date()).length,
      completedBookings: bookings.filter(b => b.payment_status === 'completed').length,
      monthlyCredits: 4,
      creditsUsed: bookings.filter(b => b.type === 'monthly' && new Date(b.created_at).getMonth() === new Date().getMonth()).length
    };

    res.render('user_dashboard', { profile, bookings, stats });
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.render('user_dashboard', {
      profile: { full_name: 'Demo User', email: 'demo@cabofit.com' },
      bookings: [],
      stats: { totalBookings: 0, upcomingBookings: 0, completedBookings: 0, monthlyCredits: 4, creditsUsed: 0 }
    });
  }
});

// Authentication middleware to ensure user has a profile
const ensureProfile = async (req, res, next) => {
  try {
    const userId = req.body.user_id || req.params.userId || req.query.user_id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing user ID',
        code: 'MISSING_USER_ID'
      });
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'User profile does not exist',
        message: 'Please complete your profile setup before booking classes',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    if (profileError) {
      throw profileError;
    }

    req.userProfile = profile;
    next();
  } catch (error) {
    next(error);
  }
};

// Auth Routes
app.get('/signup', (req, res) => {
  res.render('signup', { 
    title: 'Sign Up - Cabo Fit Pass',
    error: null 
  });
});

app.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Login - Cabo Fit Pass',
    error: null 
  });
});

app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || email.split('@')[0]
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(409).json({
          success: false,
          error: 'Email already registered',
          message: 'Please sign in instead or use a different email'
        });
      }
      
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Note: Profile will be created automatically by database trigger
    
    res.json({
      success: true,
      message: 'Account created successfully! Please check your email to confirm.',
      data: {
        user: data.user,
        session: data.session
      }
    });

  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Please check your email and password'
      });
    }

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        user: data.user,
        session: data.session
      }
    });

  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Enhanced booking form submission (updated route name to match template)
app.post('/book', ensureProfile, async (req, res) => {
  try {
    const { user_id, class_id, type, notes, class_title } = req.body;
    
    logger.info('Enhanced UI booking submission', { user_id, class_id, type, class_title });

    // Validate required fields
    if (!user_id || !class_id || !type) {
      return res.redirect(`/classes?error=${encodeURIComponent('All fields are required')}`);
    }

    // Validate booking type
    const allowedTypes = ['drop-in', 'monthly', 'one-time'];
    if (!allowedTypes.includes(type)) {
      return res.redirect(`/classes?error=${encodeURIComponent('Invalid booking type')}`);
    }

    // Validate user profile exists
    const userExists = await dbHelpers.checkUserExists(user_id);
    if (!userExists) {
      logger.warn(`UI booking attempted with non-existent user: ${user_id}`);
      
      // In development mode, provide helpful instructions
      if (config.nodeEnv === 'development') {
        const errorMessage = `User profile does not exist. Please create the profile manually:
        
        1. Go to Supabase Dashboard → Table Editor → profiles
        2. Insert a new row with:
           - id: ${user_id}
           - email: testuser@cabofit.local  
           - full_name: Test User
        
        Or run this SQL in Supabase SQL Editor:
        INSERT INTO profiles (id, email, full_name, created_at, updated_at) 
        VALUES ('${user_id}', 'testuser@cabofit.local', 'Test User', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;`;
        
        return res.redirect(`/classes?error=${encodeURIComponent(errorMessage)}`);
      } else {
        return res.redirect(`/classes?error=${encodeURIComponent('User profile does not exist. Please register first.')}`);
      }
    }

    // Check if class exists
    const classDetails = await dbHelpers.getClassById(class_id);
    if (!classDetails) {
      return res.redirect(`/classes?error=${encodeURIComponent('Class not found')}`);
    }

    // Check class capacity
    const currentBookings = await dbHelpers.getClassBookingCount(class_id);
    if (currentBookings >= classDetails.capacity) {
      return res.redirect(`/classes?error=${encodeURIComponent('Class is full')}`);
    }

    // Check for duplicate booking
    const existingBooking = await dbHelpers.retryOperation(async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user_id)
        .eq('class_id', class_id)
        .in('payment_status', ['pending', 'completed'])
        .single();

      if (error && error.code === 'PGRST116') {
        return null;
      }
      
      if (error) throw error;
      return data;
    });

    if (existingBooking) {
      return res.redirect(`/classes?error=${encodeURIComponent('You have already booked this class')}`);
    }

    // Create the booking
    const bookingData = {
      user_id,
      class_id,
      type,
      payment_status: 'pending',
      notes: notes || null
    };

    const newBooking = await dbHelpers.retryOperation(async () => {
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select(`
          *,
          classes (
            id,
            title,
            schedule,
            price
          )
        `)
        .single();

      if (error) throw error;
      return data;
    });

    logger.info('UI booking created successfully', { bookingId: newBooking.id });

    const successMessage = `Successfully booked "${class_title || classDetails.title}"!`;
    res.redirect(`/classes?success=${encodeURIComponent(successMessage)}`);

  } catch (error) {
    logger.error('UI booking error:', error);
    
    let errorMessage = 'Unable to create booking. Please try again.';
    
    // Handle specific error types for user-friendly messages
    if (error.code === '23505') {
      errorMessage = 'You have already booked this class';
    } else if (error.code === '23503') {
      if (error.message && error.message.includes('bookings_user_id_fkey')) {
        errorMessage = 'User profile validation failed. Please try again.';
      } else if (error.message && error.message.includes('bookings_class_id_fkey')) {
        errorMessage = 'Class no longer exists or has been removed.';
      } else {
        errorMessage = 'Invalid booking data. Please check your information.';
      }
    } else if (error.message && error.message.includes('schema')) {
      errorMessage = 'Database is being updated, please try again in a moment';
    }

    res.redirect(`/classes?error=${encodeURIComponent(errorMessage)}`);
  }
});

// Get server info
app.get(`/api/${config.apiVersion}/info`, (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Cabo FitPass Booking API',
      version: config.apiVersion,
      environment: config.nodeEnv,
      supportedBookingTypes: VALID_BOOKING_TYPES,
      supportedPaymentStatuses: VALID_PAYMENT_STATUSES,
      maxBookingsPerUser: config.maxBookingsPerUser,
      bookingCancellationHours: config.bookingCancellationHours
    }
  });
});

// Get all gyms
app.get(`/api/${config.apiVersion}/gyms`, async (req, res, next) => {
  try {
    logger.info('Fetching all gyms');

    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      count: data.length
    });

  } catch (error) {
    next(error);
  }
});

// Get all classes
app.get(`/api/${config.apiVersion}/classes`, async (req, res, next) => {
  try {
    const { gym_id } = req.query;
    
    logger.info('Fetching classes', { gym_id });

    let query = supabase
      .from('classes')
      .select(`
        *,
        gyms (
          id,
          name,
          location
        )
      `)
      .order('schedule');

    if (gym_id) {
      query = query.eq('gym_id', gym_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      count: data.length
    });

  } catch (error) {
    next(error);
  }
});

// Create booking endpoint - Main booking functionality
app.post(`/api/${config.apiVersion}/book`, async (req, res, next) => {
  try {
    const bookingData = req.body;
    
    logger.info('Creating booking', bookingData);

    // Validate input data
    const validationErrors = validateBookingData(bookingData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid booking data provided',
        details: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }

    // Set defaults
    const booking = {
      user_id: bookingData.user_id,
      class_id: bookingData.class_id,
      type: bookingData.type || 'drop-in',
      payment_status: bookingData.payment_status || 'pending',
      notes: bookingData.notes || null
    };

    // Additional validations
    
    // 0. Validate user profile exists
    const userExists = await dbHelpers.checkUserExists(booking.user_id);
    if (!userExists) {
      logger.warn(`Booking attempted with non-existent user: ${booking.user_id}`);
      
      // Provide helpful development guidance
      const devInstructions = config.nodeEnv === 'development' ? {
        sqlStatement: `INSERT INTO profiles (id, email, full_name, created_at, updated_at) VALUES ('${booking.user_id}', 'testuser@cabofit.local', 'Test User', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;`,
        dashboardSteps: [
          'Go to Supabase Dashboard → Table Editor → profiles',
          `Insert row: id='${booking.user_id}', email='testuser@cabofit.local', full_name='Test User'`
        ]
      } : undefined;
      
      return res.status(400).json({
        success: false,
        error: 'User not found',
        message: `User profile does not exist. ${config.nodeEnv === 'development' ? 'Please create the profile first.' : 'Please register the user first.'}`,
        code: 'USER_NOT_FOUND',
        data: {
          userId: booking.user_id,
          suggestion: 'Create a profile via Supabase Dashboard or SQL Editor',
          devInstructions
        }
      });
    }
    
    // 1. Check if class exists and get details
    const classDetails = await dbHelpers.getClassById(booking.class_id);
    if (!classDetails) {
      return res.status(404).json({
        success: false,
        error: 'Class not found',
        message: `Class with ID ${booking.class_id} does not exist`,
        code: 'CLASS_NOT_FOUND'
      });
    }

    // 2. Check class capacity
    const currentBookings = await dbHelpers.getClassBookingCount(booking.class_id);
    if (currentBookings >= classDetails.capacity) {
      return res.status(409).json({
        success: false,
        error: 'Class full',
        message: `Class is at full capacity (${classDetails.capacity}/${classDetails.capacity})`,
        code: 'CLASS_FULL',
        data: {
          capacity: classDetails.capacity,
          currentBookings: currentBookings
        }
      });
    }

    // 3. Check user booking limit
    const userBookingCount = await dbHelpers.getUserBookingCount(booking.user_id);
    if (userBookingCount >= config.maxBookingsPerUser) {
      return res.status(409).json({
        success: false,
        error: 'Booking limit exceeded',
        message: `User has reached maximum booking limit (${config.maxBookingsPerUser})`,
        code: 'BOOKING_LIMIT_EXCEEDED',
        data: {
          currentBookings: userBookingCount,
          maxBookings: config.maxBookingsPerUser
        }
      });
    }

    // 4. Check for duplicate bookings
    const existingBooking = await dbHelpers.retryOperation(async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', booking.user_id)
        .eq('class_id', booking.class_id)
        .in('payment_status', ['pending', 'completed'])
        .single();

      // If no data found, that's expected (no duplicate)
      if (error && error.code === 'PGRST116') {
        return null;
      }
      
      if (error) throw error;
      return data;
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate booking',
        message: 'You have already booked this class',
        code: 'DUPLICATE_BOOKING',
        data: {
          existingBookingId: existingBooking.id
        }
      });
    }

    // Create the booking with retry logic
    const newBooking = await dbHelpers.retryOperation(async () => {
      const { data, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select(`
          *,
          classes (
            id,
            title,
            schedule,
            price,
            capacity,
            gyms (
              name,
              location
            )
          )
        `)
        .single();

      if (error) throw error;
      return data;
    });

    logger.info('Booking created successfully', { bookingId: newBooking.id });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: newBooking,
      meta: {
        classDetails: classDetails,
        remainingCapacity: classDetails.capacity - currentBookings - 1,
        userBookingCount: userBookingCount + 1
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get user bookings
app.get(`/api/${config.apiVersion}/bookings/:userId`, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    logger.info('Fetching user bookings', { userId, status });

    let query = supabase
      .from('bookings')
      .select(`
        *,
        classes (
          id,
          title,
          schedule,
          price,
          capacity,
          gyms (
            name,
            location
          )
        )
      `)
      .eq('user_id', userId)
      .order('id', { ascending: false });

    if (status) {
      query = query.eq('payment_status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      count: data.length
    });

  } catch (error) {
    next(error);
  }
});

// Cancel booking
app.delete(`/api/${config.apiVersion}/bookings/:bookingId`, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { userId } = req.body;

    logger.info('Cancelling booking', { bookingId, userId });

    // Verify booking exists and belongs to user
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        classes (
          id,
          title,
          schedule
        )
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'Booking does not exist',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    if (userId && booking.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You can only cancel your own bookings',
        code: 'UNAUTHORIZED'
      });
    }

    // Check cancellation policy
    const classSchedule = new Date(booking.classes.schedule);
    const now = new Date();
    const hoursUntilClass = (classSchedule - now) / (1000 * 60 * 60);

    if (hoursUntilClass < config.bookingCancellationHours) {
      return res.status(400).json({
        success: false,
        error: 'Cancellation not allowed',
        message: `Bookings can only be cancelled at least ${config.bookingCancellationHours} hours before class`,
        code: 'CANCELLATION_TOO_LATE',
        data: {
          hoursUntilClass: Math.round(hoursUntilClass * 100) / 100,
          requiredHours: config.bookingCancellationHours
        }
      });
    }

    // Update booking status to cancelled
    const { data: cancelledBooking, error: cancelError } = await supabase
      .from('bookings')
      .update({ payment_status: 'cancelled' })
      .eq('id', bookingId)
      .select()
      .single();

    if (cancelError) throw cancelError;

    logger.info('Booking cancelled successfully', { bookingId });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: cancelledBooking
    });

  } catch (error) {
    next(error);
  }
});

// Enhanced profile creation with auth user (SECURE VERSION)
app.post('/api/create-profile', async (req, res) => {
  try {
    const userId = '661db286-593a-4c1e-8ce8-fb4ea43cd58a';
    const userEmail = 'mariopjr91@gmail.com';
    
    console.log('Creating auth user and profile for user ID:', userId);

    // Step 1: Create auth user first
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        user_id: userId,
        email: userEmail,
        password: 'temp_password_123!', // Only used once, not logged
        email_confirm: true,
        user_metadata: {
          full_name: 'Mario Polanco Jr'
        }
      });

      if (authError && !authError.message.includes('already exists')) {
        console.error('Auth user creation error (password not logged):', authError.message);
        return res.json({ success: false, error: 'Failed to create auth user' });
      }

      console.log('Auth user created or exists for email:', userEmail);
    } catch (authErr) {
      console.log('Auth user might already exist, continuing with profile creation...');
    }

    // Step 2: Create profile
    const profileData = {
      id: userId,
      email: userEmail,
      full_name: 'Mario Polanco Jr',
      role: 'user',
      monthly_credits: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert([profileData])
      .select('*')
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError.message);
      return res.json({ success: false, error: 'Failed to create profile' });
    }

    console.log('Profile created successfully for:', profile.email);
    res.json({ success: true, profile: { id: profile.id, email: profile.email, full_name: profile.full_name } });

  } catch (error) {
    console.error('Unexpected error during profile creation');
    res.json({ success: false, error: 'System error' });
  }
});

// Apply error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'API endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Start server
const server = app.listen(config.port, () => {
  console.log('\n🚀 Cabo FitPass Booking API Server Started');
  console.log('=' + '='.repeat(50));
  console.log(`📡 Server running on: http://localhost:${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`📊 API Version: ${config.apiVersion}`);
  console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log('\n📋 Available Endpoints:');
  console.log(`  GET  /health`);
  console.log(`  GET  /api/${config.apiVersion}/info`);
  console.log(`  GET  /api/${config.apiVersion}/gyms`);
  console.log(`  GET  /api/${config.apiVersion}/classes`);
  console.log(`  POST /api/${config.apiVersion}/book`);
  console.log(`  GET  /api/${config.apiVersion}/bookings/:userId`);
  console.log(`  DELETE /api/${config.apiVersion}/bookings/:bookingId`);
  console.log('\n🏷️  Valid Booking Types:', VALID_BOOKING_TYPES.join(', '));
  console.log('💳 Valid Payment Statuses:', VALID_PAYMENT_STATUSES.join(', '));
  console.log('\n✅ Server ready for requests!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;