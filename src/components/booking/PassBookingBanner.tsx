import React from 'react';
import { TicketIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { ActivePass } from '../../types/user';

interface PassBookingBannerProps {
  activePasses: ActivePass[];
  onUsePass: (pass: ActivePass) => void;
}

/**
 * Banner shown on BookingPage when user has active Season Passes
 * Allows user to switch to "Pass Booking Mode"
 */
const PassBookingBanner: React.FC<PassBookingBannerProps> = ({
  activePasses,
  onUsePass,
}) => {
  if (activePasses.length === 0) return null;

  // Filter to only valid (non-expired) passes
  const validPasses = activePasses.filter(pass => {
    const expiry = pass.expiryDate.toDate();
    return expiry > new Date();
  });

  if (validPasses.length === 0) return null;

  return (
    <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-amber-100 rounded-lg">
          <TicketIcon className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-amber-900 text-sm">您有可用的季卡</h3>
          <p className="text-xs text-amber-700">使用季卡權益來預約服務</p>
        </div>
      </div>
      
      <div className="space-y-2 mt-3">
        {validPasses.map((pass, idx) => {
          const totalRemaining = Object.values(pass.remainingUsages).reduce((a, b) => a + b, 0);
          const expiry = pass.expiryDate.toDate();
          const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          return (
            <button
              key={idx}
              onClick={() => onUsePass(pass)}
              className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100 hover:border-amber-300 hover:shadow-sm transition-all group"
            >
              <div className="text-left">
                <p className="font-bold text-gray-800 text-sm">
                  {pass.passName}
                  {pass.variantName && <span className="text-gray-500 font-normal ml-1">({pass.variantName})</span>}
                </p>
                <p className="text-xs text-gray-500">
                  剩餘 {totalRemaining} 次使用 • 還有 {daysLeft} 天到期
                </p>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PassBookingBanner;
