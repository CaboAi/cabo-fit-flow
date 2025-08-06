/**
 * Authentication Middleware for Cabo Fit Pass
 * Handles JWT token verification and user authentication
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

/**
 * Middleware to require authentication
 * Verifies JWT token and attaches user to req.user
 */
const requireAuth = async (req, res, next) => {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'No token provided'
            });
        }

        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                message: error?.message || 'Token verification failed'
            });
        }

        // Get user profile from database
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Error fetching user profile:', profileError);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch user profile',
                message: profileError.message
            });
        }

        // Attach user and profile to request
        req.user = {
            id: user.id,
            email: user.email,
            ...profile
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            error: 'Authentication failed',
            message: error.message
        });
    }
};

/**
 * Middleware for optional authentication
 * Attaches user if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);
        
        if (!token) {
            req.user = null;
            return next();
        }

        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            req.user = null;
            return next();
        }

        // Get user profile from database
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            req.user = null;
            return next();
        }

        // Attach user and profile to request
        req.user = {
            id: user.id,
            email: user.email,
            ...profile
        };

        next();
    } catch (error) {
        console.error('Optional auth middleware error:', error);
        req.user = null;
        next();
    }
};

/**
 * Middleware to require specific role
 * @param {string} requiredRole - Required user role
 */
const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'No authenticated user'
            });
        }

        if (req.user.role !== requiredRole) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                message: `${requiredRole} role required`
            });
        }

        next();
    };
};

/**
 * Middleware to require admin role
 */
const requireAdmin = requireRole('admin');

/**
 * Extract token from Authorization header
 * Supports both "Bearer token" and "token" formats
 */
function extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    
    return authHeader;
}

/**
 * Middleware to check if user owns resource
 * Compares req.user.id with req.params.userId or req.body.userId
 */
const requireOwnership = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    const targetUserId = req.params.userId || req.body.userId;
    
    if (!targetUserId) {
        return res.status(400).json({
            success: false,
            error: 'User ID required in request'
        });
    }

    if (req.user.id !== targetUserId && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Access denied',
            message: 'Can only access your own resources'
        });
    }

    next();
};

/**
 * Rate limiting middleware for authentication endpoints
 * Simple in-memory rate limiting (use Redis in production)
 */
const authRateLimit = (() => {
    const attempts = new Map();
    
    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        const windowMs = 15 * 60 * 1000; // 15 minutes
        const maxAttempts = 5;

        if (!attempts.has(key)) {
            attempts.set(key, []);
        }

        const userAttempts = attempts.get(key);
        
        // Remove old attempts
        const recentAttempts = userAttempts.filter(time => now - time < windowMs);
        attempts.set(key, recentAttempts);

        if (recentAttempts.length >= maxAttempts) {
            return res.status(429).json({
                success: false,
                error: 'Too many authentication attempts',
                message: 'Please try again later',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        // Add current attempt on auth failure
        res.on('finish', () => {
            if (res.statusCode === 401 || res.statusCode === 403) {
                recentAttempts.push(now);
                attempts.set(key, recentAttempts);
            }
        });

        next();
    };
})();

module.exports = {
    requireAuth,
    optionalAuth,
    requireRole,
    requireAdmin,
    requireOwnership,
    authRateLimit,
    extractTokenFromHeader
};