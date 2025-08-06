/**
 * Credit System API Routes
 * RESTful endpoints for credit operations in Cabo Fit Pass
 */

const express = require('express');
const creditService = require('../services/creditService');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Middleware to ensure all credit routes require authentication
router.use(requireAuth);

/**
 * GET /api/credits/balance
 * Get current user's credit balance
 */
router.get('/balance', async (req, res) => {
    try {
        const balance = await creditService.getUserCreditBalance(req.user.id);
        
        res.json({
            success: true,
            data: { 
                balance,
                userId: req.user.id
            }
        });
    } catch (error) {
        console.error('GET /api/credits/balance error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get credit balance',
            message: error.message
        });
    }
});

/**
 * GET /api/credits/dashboard
 * Get comprehensive credit dashboard for current user
 */
router.get('/dashboard', async (req, res) => {
    try {
        const dashboard = await creditService.getUserCreditDashboard(req.user.id);
        
        res.json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        console.error('GET /api/credits/dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get credit dashboard',
            message: error.message
        });
    }
});

/**
 * GET /api/credits/transactions
 * Get user's credit transaction history with pagination
 */
router.get('/transactions', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        
        const transactions = await creditService.getCreditTransactionHistory(
            req.user.id, 
            parseInt(limit), 
            parseInt(offset)
        );
        
        res.json({
            success: true,
            data: transactions,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                count: transactions.length
            }
        });
    } catch (error) {
        console.error('GET /api/credits/transactions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get transaction history',
            message: error.message
        });
    }
});

/**
 * GET /api/credits/class-cost/:classId
 * Get credit cost for a specific class
 */
router.get('/class-cost/:classId', async (req, res) => {
    try {
        const { classId } = req.params;
        const bookingDateTime = req.query.booking_time ? new Date(req.query.booking_time) : new Date();
        
        const cost = await creditService.getClassCreditCost(classId, bookingDateTime);
        
        res.json({
            success: true,
            data: {
                classId,
                creditCost: cost,
                bookingDateTime: bookingDateTime.toISOString()
            }
        });
    } catch (error) {
        console.error('GET /api/credits/class-cost error:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to get class cost',
            message: error.message
        });
    }
});

/**
 * POST /api/credits/class-costs
 * Get credit costs for multiple classes (batch operation)
 */
router.post('/class-costs', async (req, res) => {
    try {
        const { classIds, bookingDateTime } = req.body;
        
        if (!Array.isArray(classIds) || classIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'classIds must be a non-empty array'
            });
        }

        const bookingTime = bookingDateTime ? new Date(bookingDateTime) : new Date();
        const classes = await creditService.getClassesCreditCosts(classIds, bookingTime);
        
        res.json({
            success: true,
            data: classes
        });
    } catch (error) {
        console.error('POST /api/credits/class-costs error:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to get classes costs',
            message: error.message
        });
    }
});

/**
 * GET /api/credits/booking-eligibility/:classId
 * Check if user can book a specific class
 */
router.get('/booking-eligibility/:classId', async (req, res) => {
    try {
        const { classId } = req.params;
        
        const eligibility = await creditService.checkBookingEligibility(req.user.id, classId);
        
        res.json({
            success: true,
            data: eligibility
        });
    } catch (error) {
        console.error('GET /api/credits/booking-eligibility error:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to check booking eligibility',
            message: error.message
        });
    }
});

/**
 * POST /api/credits/book-class
 * Book a class using credits
 */
router.post('/book-class', async (req, res) => {
    try {
        const { classId } = req.body;
        
        if (!classId) {
            return res.status(400).json({
                success: false,
                error: 'classId is required'
            });
        }

        const bookingId = await creditService.bookClassWithCredits(req.user.id, classId);
        
        res.status(201).json({
            success: true,
            data: {
                bookingId,
                classId,
                userId: req.user.id
            },
            message: 'Class booked successfully with credits'
        });
    } catch (error) {
        console.error('POST /api/credits/book-class error:', error);
        
        // Handle specific booking errors with appropriate status codes
        if (error.message.includes('Insufficient credits')) {
            return res.status(402).json({
                success: false,
                error: 'Insufficient credits',
                message: error.message
            });
        }
        
        if (error.message.includes('Class is full')) {
            return res.status(409).json({
                success: false,
                error: 'Class is full',
                message: error.message
            });
        }
        
        if (error.message.includes('Cannot book past')) {
            return res.status(410).json({
                success: false,
                error: 'Class has already started',
                message: error.message
            });
        }

        res.status(400).json({
            success: false,
            error: 'Failed to book class',
            message: error.message
        });
    }
});

/**
 * POST /api/credits/cancel-booking
 * Cancel a booking and process credit refund
 */
router.post('/cancel-booking', async (req, res) => {
    try {
        const { bookingId } = req.body;
        
        if (!bookingId) {
            return res.status(400).json({
                success: false,
                error: 'bookingId is required'
            });
        }

        const result = await creditService.cancelBookingWithRefund(bookingId, req.user.id);
        
        res.json({
            success: true,
            data: {
                cancelled: result,
                bookingId,
                userId: req.user.id
            },
            message: 'Booking cancelled and credits refunded'
        });
    } catch (error) {
        console.error('POST /api/credits/cancel-booking error:', error);
        
        // Handle specific cancellation errors
        if (error.message.includes('Booking not found')) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found',
                message: error.message
            });
        }
        
        if (error.message.includes('already cancelled')) {
            return res.status(409).json({
                success: false,
                error: 'Booking already cancelled',
                message: error.message
            });
        }
        
        if (error.message.includes('Cannot cancel')) {
            return res.status(410).json({
                success: false,
                error: 'Cannot cancel past bookings',
                message: error.message
            });
        }

        res.status(400).json({
            success: false,
            error: 'Failed to cancel booking',
            message: error.message
        });
    }
});

/**
 * POST /api/credits/purchase
 * Purchase additional credits
 */
router.post('/purchase', async (req, res) => {
    try {
        const { creditsAmount, amountCents, paymentMethod, paymentIntentId } = req.body;
        
        // Validation
        if (!creditsAmount || creditsAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'creditsAmount must be a positive number'
            });
        }
        
        if (!amountCents || amountCents <= 0) {
            return res.status(400).json({
                success: false,
                error: 'amountCents must be a positive number'
            });
        }

        const transactionId = await creditService.purchaseCredits(
            req.user.id,
            creditsAmount,
            amountCents,
            paymentMethod || 'stripe',
            paymentIntentId
        );
        
        res.status(201).json({
            success: true,
            data: {
                transactionId,
                creditsAmount,
                amountCents,
                paymentMethod: paymentMethod || 'stripe',
                userId: req.user.id
            },
            message: `Successfully purchased ${creditsAmount} credits`
        });
    } catch (error) {
        console.error('POST /api/credits/purchase error:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to purchase credits',
            message: error.message
        });
    }
});

/**
 * Admin Routes (require admin role)
 */

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    next();
};

/**
 * POST /api/credits/admin/rollover
 * Process monthly credit rollover (admin only)
 */
router.post('/admin/rollover', requireAdmin, async (req, res) => {
    try {
        const { userId } = req.body; // Optional: rollover specific user, null for all
        
        const results = await creditService.processMonthlyRollover(userId || null);
        
        res.json({
            success: true,
            data: {
                processed: results.length,
                results: results
            },
            message: `Processed rollover for ${results.length} users`
        });
    } catch (error) {
        console.error('POST /api/credits/admin/rollover error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process rollover',
            message: error.message
        });
    }
});

/**
 * GET /api/credits/admin/analytics
 * Get credit system analytics (admin only)
 */
router.get('/admin/analytics', requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1); // Start of year
        const end = endDate ? new Date(endDate) : new Date(); // Today
        
        const analytics = await creditService.getCreditAnalytics(start, end);
        
        res.json({
            success: true,
            data: analytics,
            dateRange: {
                startDate: start.toISOString(),
                endDate: end.toISOString()
            }
        });
    } catch (error) {
        console.error('GET /api/credits/admin/analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get analytics',
            message: error.message
        });
    }
});

/**
 * Error handling middleware for credit routes
 */
router.use((err, req, res, next) => {
    console.error('Credit routes error:', err);
    
    res.status(500).json({
        success: false,
        error: 'Internal server error in credit system',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

module.exports = router;