// components/CreditBadge.jsx
// Simple credit display for header/navigation

import React from 'react';
import { useCredits } from '../hooks/useCredits';

export const CreditBadge = ({ user, className = "" }) => {
  const { balance } = useCredits(user);
  
  if (!user || balance === null) return null;

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200 ${className}`}>
      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
      </svg>
      <span className="font-medium">{balance}</span>
      <span className="ml-1 text-xs">credit{balance !== 1 ? 's' : ''}</span>
      {balance < 3 && (
        <span className="ml-1 text-orange-600 text-xs">⚠️</span>
      )}
    </div>
  );
};