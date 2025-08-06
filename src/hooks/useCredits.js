// hooks/useCredits.js
// Credit management hook for Cabo Fit Pass

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useCredits = (user) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch credit balance
  const fetchBalance = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_credit_balance', {
        p_user_id: user.id
      });
      
      if (!error) {
        setBalance(data);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
      setBalance(0); // Fallback to 0 credits
    }
  };

  // Book class with credits
  const bookWithCredits = async (classId) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('book_class_with_credits', {
        p_user_id: user.id,
        p_class_id: classId,
        p_booking_type: 'subscription'
      });

      if (!error && data) {
        // Refresh balance after booking
        await fetchBalance();
        return data;
      }
      
      return { success: false, error: error?.message || 'Booking failed' };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Get class credit cost
  const getClassCost = async (classId) => {
    try {
      const { data, error } = await supabase.rpc('get_class_credit_cost', {
        p_class_id: classId
      });
      
      return !error ? data : 1; // Default to 1 credit
    } catch (error) {
      return 1;
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user]);

  return {
    balance,
    loading,
    bookWithCredits,
    getClassCost,
    refetchBalance: fetchBalance
  };
};