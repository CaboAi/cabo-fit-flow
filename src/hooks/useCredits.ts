// hooks/useCredits.js
// Credit management hook for Cabo Fit Pass

import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

export type BookingResult = { success: boolean; error?: string; current_balance?: number; required_credits?: number; shortage?: number };

export const useCredits = (user: { id: string } | null) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch credit balance
  const fetchBalance = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await (supabase as any).rpc('get_user_credit_balance', {
        p_user_id: user.id
      });
      
      if (!error) {
        const num = typeof data === 'number' ? data : Number(data);
        setBalance(Number.isFinite(num) ? (num as number) : 0);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
      setBalance(0); // Fallback to 0 credits
    }
  };

  // Book class with credits
  const bookWithCredits = async (classId: string): Promise<BookingResult> => {
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
        if (typeof data === 'object' && data !== null && 'success' in (data as any)) {
          return data as BookingResult;
        }
        return { success: true };
      }
      
      return { success: false, error: (error as any)?.message || 'Booking failed' };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Get class credit cost
  const getClassCost = async (classId: string): Promise<number> => {
    try {
      const { data, error } = await (supabase as any).rpc('get_class_credit_cost', {
        p_class_id: classId
      });
      const num = typeof data === 'number' ? data : Number(data);
      return !error && Number.isFinite(num) ? (num as number) : 1; // Default to 1 credit
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