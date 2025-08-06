// components/EnhancedBookingButton.tsx
// Enhanced booking button with credit functionality and insufficient credits modal

import React, { useState } from 'react';
import { useCredits } from '@/hooks/useCredits';

interface EnhancedBookingButtonProps {
  classId: string;
  user: any;
  children: React.ReactNode;
  className?: string;
  onBookingSuccess?: (result: any) => void;
  onBookingError?: (error: string) => void;
  disabled?: boolean;
  [key: string]: any;
}

export const EnhancedBookingButton: React.FC<EnhancedBookingButtonProps> = ({ 
  classId, 
  user, 
  children, 
  className = "",
  onBookingSuccess,
  onBookingError,
  disabled = false,
  ...props 
}) => {
  const { bookWithCredits, loading } = useCredits(user);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<any>(null);

  const handleClick = async () => {
    if (!user) {
      onBookingError?.('Please sign in to book classes');
      return;
    }

    if (disabled || loading) return;

    const result = await bookWithCredits(classId);
    
    if (result.success) {
      onBookingSuccess?.(result);
    } else {
      if (result.error === 'insufficient_credits') {
        setModalData(result);
        setShowModal(true);
      } else {
        onBookingError?.(result.error);
      }
    }
  };

  const isDisabled = disabled || loading || !user;

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        {...props}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>Booking...</span>
          </div>
        ) : children}
      </button>

      {/* Insufficient Credits Modal */}
      {showModal && modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-orange-100 rounded-full p-2">
                <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Not Enough Credits</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                This class requires {modalData.required_credits} credits, but you only have {modalData.current_balance}.
              </p>
              <p className="text-sm text-gray-500">
                You need {modalData.shortage} more credit{modalData.shortage > 1 ? 's' : ''} to book this class.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  // Future: integrate with Stripe
                  console.log('Purchase credits:', modalData.shortage);
                  alert(`Would purchase ${modalData.shortage} credits for $${((modalData.shortage || 1) * 1.5).toFixed(2)}`);
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Buy {modalData.shortage} Credit{modalData.shortage > 1 ? 's' : ''} 
                <span className="text-blue-200 ml-1">
                  (${((modalData.shortage || 1) * 1.5).toFixed(2)})
                </span>
              </button>
              
              <button
                onClick={() => {
                  setShowModal(false);
                  console.log('Upgrade plan');
                  alert('Would redirect to upgrade plan page');
                }}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Upgrade to Monthly Plan
              </button>
              
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};