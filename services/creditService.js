/**
 * Credit System Service
 * Handles all credit-related operations for the Cabo Fit Pass platform
 */

const { createClient } = require('@supabase/supabase-js');

class CreditService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    /**
     * Get user's current credit balance
     * @param {string} userId - User UUID
     * @returns {Promise<number>} Current credit balance
     */
    async getUserCreditBalance(userId) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_user_credit_balance', { p_user_id: userId });

            if (error) throw error;
            return data || 0;
        } catch (error) {
            console.error('Error getting user credit balance:', error);
            throw new Error(`Failed to get credit balance: ${error.message}`);
        }
    }

    /**
     * Calculate the credit cost for a specific class
     * @param {string} classId - Class UUID
     * @param {Date} bookingDateTime - When the booking is being made (optional, defaults to now)
     * @returns {Promise<number>} Credit cost for the class
     */
    async getClassCreditCost(classId, bookingDateTime = new Date()) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_class_credit_cost', { 
                    p_class_id: classId,
                    p_booking_datetime: bookingDateTime.toISOString()
                });

            if (error) throw error;
            return data || 1;
        } catch (error) {
            console.error('Error getting class credit cost:', error);
            throw new Error(`Failed to get class cost: ${error.message}`);
        }
    }

    /**
     * Book a class using credits
     * @param {string} userId - User UUID
     * @param {string} classId - Class UUID
     * @returns {Promise<string>} Booking UUID
     */
    async bookClassWithCredits(userId, classId) {
        try {
            const { data, error } = await this.supabase
                .rpc('book_class_with_credits', { 
                    p_user_id: userId,
                    p_class_id: classId
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error booking class with credits:', error);
            throw new Error(`Failed to book class: ${error.message}`);
        }
    }

    /**
     * Cancel a booking and process credit refund
     * @param {string} bookingId - Booking UUID
     * @param {string} userId - User UUID (for security)
     * @returns {Promise<boolean>} Success status
     */
    async cancelBookingWithRefund(bookingId, userId) {
        try {
            const { data, error } = await this.supabase
                .rpc('cancel_booking_with_credit_refund', { 
                    p_booking_id: bookingId,
                    p_user_id: userId
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error cancelling booking:', error);
            throw new Error(`Failed to cancel booking: ${error.message}`);
        }
    }

    /**
     * Purchase additional credits
     * @param {string} userId - User UUID
     * @param {number} creditsAmount - Number of credits to purchase
     * @param {number} amountCents - Payment amount in cents
     * @param {string} paymentMethod - Payment method (stripe, paypal, etc.)
     * @param {string} paymentIntentId - External payment reference
     * @returns {Promise<string>} Transaction UUID
     */
    async purchaseCredits(userId, creditsAmount, amountCents, paymentMethod = 'stripe', paymentIntentId = null) {
        try {
            const { data, error } = await this.supabase
                .rpc('purchase_credits', { 
                    p_user_id: userId,
                    p_credits_amount: creditsAmount,
                    p_amount_cents: amountCents,
                    p_payment_method: paymentMethod,
                    p_payment_intent_id: paymentIntentId
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error purchasing credits:', error);
            throw new Error(`Failed to purchase credits: ${error.message}`);
        }
    }

    /**
     * Get user's credit dashboard with comprehensive information
     * @param {string} userId - User UUID
     * @returns {Promise<Object>} User credit dashboard data
     */
    async getUserCreditDashboard(userId) {
        try {
            const { data, error } = await this.supabase
                .from('user_credit_dashboard')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting credit dashboard:', error);
            throw new Error(`Failed to get credit dashboard: ${error.message}`);
        }
    }

    /**
     * Get user's credit transaction history
     * @param {string} userId - User UUID
     * @param {number} limit - Number of transactions to return (default: 50)
     * @param {number} offset - Pagination offset (default: 0)
     * @returns {Promise<Array>} Array of credit transactions
     */
    async getCreditTransactionHistory(userId, limit = 50, offset = 0) {
        try {
            const { data, error } = await this.supabase
                .from('credit_transactions')
                .select(`
                    *,
                    classes:class_id(title, start_time),
                    bookings:booking_id(status)
                `)
                .eq('user_id', userId)
                .order('transaction_date', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting transaction history:', error);
            throw new Error(`Failed to get transaction history: ${error.message}`);
        }
    }

    /**
     * Get credit cost breakdown for multiple classes (for booking preview)
     * @param {Array<string>} classIds - Array of class UUIDs
     * @param {Date} bookingDateTime - When the booking is being made
     * @returns {Promise<Array>} Array of classes with credit costs
     */
    async getClassesCreditCosts(classIds, bookingDateTime = new Date()) {
        try {
            const costs = await Promise.all(
                classIds.map(async (classId) => {
                    const cost = await this.getClassCreditCost(classId, bookingDateTime);
                    return { classId, creditCost: cost };
                })
            );

            // Get class details
            const { data: classes, error } = await this.supabase
                .from('classes')
                .select(`
                    id,
                    title,
                    start_time,
                    end_time,
                    max_participants,
                    current_participants,
                    gyms:gym_id(name, location)
                `)
                .in('id', classIds);

            if (error) throw error;

            // Merge costs with class details
            return classes.map(classObj => ({
                ...classObj,
                creditCost: costs.find(c => c.classId === classObj.id)?.creditCost || 1,
                isAvailable: classObj.current_participants < classObj.max_participants,
                spotsRemaining: classObj.max_participants - classObj.current_participants
            }));

        } catch (error) {
            console.error('Error getting classes credit costs:', error);
            throw new Error(`Failed to get classes costs: ${error.message}`);
        }
    }

    /**
     * Check if user can book a specific class (credit balance check)
     * @param {string} userId - User UUID
     * @param {string} classId - Class UUID
     * @returns {Promise<Object>} Booking eligibility with details
     */
    async checkBookingEligibility(userId, classId) {
        try {
            const [balance, cost, classDetails] = await Promise.all([
                this.getUserCreditBalance(userId),
                this.getClassCreditCost(classId),
                this.supabase
                    .from('classes')
                    .select(`
                        id,
                        title,
                        start_time,
                        max_participants,
                        current_participants
                    `)
                    .eq('id', classId)
                    .single()
            ]);

            if (classDetails.error) throw classDetails.error;

            const now = new Date();
            const classStart = new Date(classDetails.data.start_time);
            const isClassInFuture = classStart > now;
            const hasCapacity = classDetails.data.current_participants < classDetails.data.max_participants;
            const hasEnoughCredits = balance >= cost;

            return {
                eligible: isClassInFuture && hasCapacity && hasEnoughCredits,
                reasons: {
                    classInPast: !isClassInFuture,
                    classFull: !hasCapacity,
                    insufficientCredits: !hasEnoughCredits
                },
                userBalance: balance,
                requiredCredits: cost,
                classDetails: classDetails.data,
                spotsRemaining: classDetails.data.max_participants - classDetails.data.current_participants
            };

        } catch (error) {
            console.error('Error checking booking eligibility:', error);
            throw new Error(`Failed to check eligibility: ${error.message}`);
        }
    }

    /**
     * Admin function: Process monthly credit rollover for all users or specific user
     * @param {string|null} userId - Specific user ID or null for all users
     * @returns {Promise<Array>} Array of rollover results
     */
    async processMonthlyRollover(userId = null) {
        try {
            const { data, error } = await this.supabase
                .rpc('process_credit_rollover', { p_user_id: userId });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error processing rollover:', error);
            throw new Error(`Failed to process rollover: ${error.message}`);
        }
    }

    /**
     * Get credit system analytics for admin dashboard
     * @param {Date} startDate - Start date for analytics
     * @param {Date} endDate - End date for analytics
     * @returns {Promise<Object>} Credit system analytics
     */
    async getCreditAnalytics(startDate, endDate) {
        try {
            const { data, error } = await this.supabase
                .from('credit_transaction_summary')
                .select('*')
                .gte('month', startDate.toISOString().substring(0, 7)) // YYYY-MM format
                .lte('month', endDate.toISOString().substring(0, 7));

            if (error) throw error;

            // Process analytics data
            const analytics = {
                totalUsers: new Set(data.map(d => d.user_id)).size,
                totalTransactions: data.reduce((sum, d) => sum + d.transaction_count, 0),
                totalCreditsEarned: data.filter(d => d.transaction_type === 'earned').reduce((sum, d) => sum + d.total_credits, 0),
                totalCreditsUsed: data.filter(d => d.transaction_type === 'used').reduce((sum, d) => sum + Math.abs(d.total_credits), 0),
                totalCreditsPurchased: data.filter(d => d.transaction_type === 'purchased').reduce((sum, d) => sum + d.total_credits, 0),
                totalRevenue: data.reduce((sum, d) => sum + d.total_revenue_cents, 0),
                monthlyBreakdown: {}
            };

            // Group by month
            data.forEach(record => {
                const month = record.month;
                if (!analytics.monthlyBreakdown[month]) {
                    analytics.monthlyBreakdown[month] = {
                        earned: 0,
                        used: 0,
                        purchased: 0,
                        expired: 0,
                        revenue: 0
                    };
                }

                analytics.monthlyBreakdown[month][record.transaction_type] = record.total_credits;
                analytics.monthlyBreakdown[month].revenue += record.total_revenue_cents;
            });

            return analytics;

        } catch (error) {
            console.error('Error getting credit analytics:', error);
            throw new Error(`Failed to get analytics: ${error.message}`);
        }
    }
}

module.exports = new CreditService();