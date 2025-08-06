// components/ClassCreditCost.jsx
// Shows credit cost on class cards

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const ClassCreditCost = ({ classId, className = "" }) => {
  const [cost, setCost] = useState(1);
  const [isPeak, setIsPeak] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCost = async () => {
      try {
        const { data } = await supabase.rpc('get_class_credit_cost', {
          p_class_id: classId
        });
        setCost(data || 1);
        
        // Simple peak time check (6-9 AM, 5-8 PM)
        const hour = new Date().getHours();
        setIsPeak((hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 20));
      } catch (error) {
        setCost(1);
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchCost();
    }
  }, [classId]);

  if (loading) {
    return (
      <div className={`inline-flex items-center space-x-1 ${className}`}>
        <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-1 ${className}`}>
      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
      </svg>
      <span className="font-semibold text-blue-600">{cost}</span>
      <span className="text-sm text-gray-600">credit{cost > 1 ? 's' : ''}</span>
      {isPeak && (
        <span className="bg-orange-100 text-orange-700 text-xs px-1 py-0.5 rounded ml-1">
          Peak
        </span>
      )}
    </div>
  );
};