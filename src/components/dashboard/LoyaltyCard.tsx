import { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import UserAvatar from '../common/UserAvatar';

interface LoyaltyCardProps {
  previewBackground?: string; // New prop for preview
  previewTextColor?: string; // New prop for preview text color
  onReady?: () => void; // Callback when card is ready (bg image loaded or no bg)
  className?: string;
}

// Skeleton Component for Loyalty Card
const LoyaltyCardSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-gray-200 rounded-3xl shadow-xl p-5 sm:p-7 h-full min-h-[220px] min-w-[300px] xs:min-w-[320px] sm:min-w-[360px] w-full flex flex-col animate-pulse ${className}`}>
    <div className="flex items-center justify-between mb-4 px-3">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-300" />
        <div>
          <div className="h-5 bg-gray-300 rounded w-24 mb-2" />
        </div>
      </div>
      <div className="w-20 h-6 bg-gray-300 rounded-full" />
    </div>

    <div className="flex flex-col items-end justify-between px-3 mt-auto">
      <div className="flex flex-col items-center w-full">
        <div className="h-4 bg-gray-300 rounded w-20 mb-2" />
        <div className="h-3 bg-gray-300 rounded w-32 mt-1" />
      </div>
      <div className="flex items-baseline gap-2 mt-4">
        <div className="h-12 bg-gray-300 rounded w-24" />
        <div className="h-5 bg-gray-300 rounded w-6" />
      </div>
    </div>
  </div>
);

const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ previewBackground, previewTextColor, onReady, className = '' }) => {
  const { userProfile } = useAuthStore();
  const loyaltyPoints = userProfile?.loyaltyPoints || 0;
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [textColor, setTextColor] = useState<string>('#FAF9F6'); // Default off-white
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Determine membership tier (simple logic for now)
  const role = userProfile?.role;
  const tierName = role === 'platinum' ? '白金會員' : role === 'admin' ? '管理員' : role === 'manager' ? '管理設計師' : role === 'designer' ? '設計師' : '一般會員'; // could be dynamic based on points later

  useEffect(() => {
    // If preview props are provided, use them directly
    if (previewBackground !== undefined || previewTextColor !== undefined) {
      if (previewBackground !== undefined) setBackgroundImage(previewBackground);
      if (previewTextColor !== undefined) setTextColor(previewTextColor);

      setIsImageLoaded(false); // Reset loading state for new image
      return;
    }

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'globals', 'homepageImages');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.loyaltyCardBackground) {
            setBackgroundImage(data.loyaltyCardBackground);
          }
          if (data.loyaltyCardTextColor) {
            setTextColor(data.loyaltyCardTextColor);
          }
          setIsImageLoaded(false); // Reset for new image
        } else {
          // No background configured, mark as loaded
          setIsImageLoaded(true);
          onReady?.();
        }
      } catch (e) {
        console.error(e);
        setIsImageLoaded(true);
        onReady?.();
      }
    };
    fetchSettings();
  }, [previewBackground, previewTextColor]);

  const getAdvancedContrastHex = ({ useColor }: { useColor: string }): string => {
    // 1. 清理 Hex 並轉為 RGB
    const hex = useColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // 2. 使用感知亮度公式 (Perceptive Luminance)
    // 人眼對綠色最敏感，藍色最弱
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    // 3. 根據背景亮度，回傳「柔和色」而非「純色」
    if (luminance > 0.6) {
      // 背景很亮（如淺粉、珍珠白）：回傳「深咖啡灰色」比純黑柔和
      return '#2D2926';
    } else if (luminance > 0.4) {
      // 背景中等（如奶茶色、莫蘭迪色）：回傳「極深色」確保可讀性
      return '#faf9f6';
    } else {
      // 背景很深（如深藍、酒紅）：回傳「米白色」比死白更高級
      return '#FAF9F6';
    }
  };

  // Preload background image
  useEffect(() => {
    if (!backgroundImage) {
      setIsImageLoaded(true); // No bg image needed, mark as ready
      onReady?.();
      return;
    }

    const img = new Image();
    img.onload = () => {
      setIsImageLoaded(true);
      onReady?.();
    };
    img.onerror = () => {
      setIsImageLoaded(true); // Still show card even if image fails
      onReady?.();
    };
    img.src = backgroundImage;
  }, [backgroundImage, onReady]);

  // Show skeleton while loading
  if (!isImageLoaded) {
    return <LoyaltyCardSkeleton className={className} />;
  }

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-[#9F9586] to-[#8A8173] rounded-3xl shadow-xl p-5 sm:p-7 transition-all hover:shadow-2xl h-full min-h-[220px] min-w-[300px] xs:min-w-[320px] sm:min-w-[360px] w-full flex flex-col bg-center bg-no-repeat border border-white/20 ${className}`}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: '100% 100%',
        color: textColor // Apply dynamic text color
      }}
    >
      {/* Overlay for readability if image is present */}
      {!backgroundImage && <div className="absolute inset-0 bg-black/40 z-0"></div>}

      {/* Decorative Background Elements (Only if no custom background) */}
      {!backgroundImage && (
        <>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        </>
      )}

      <div className="relative z-10 flex flex-col justify-between h-full px-3 min-h-[160px] ">
        {/* Card Header: User Info & Tier */}
        <div className="flex items-center justify-between ">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <UserAvatar
                src={userProfile?.profile.avatarUrl}
                name={userProfile?.profile.displayName}
                className="w-16 h-16 sm:w-14 sm:h-14 border-2 border-white/30 shadow-sm"
              />
              <div className="absolute bottom-0 right-0 bg-white text-[#9F9586] rounded-full p-0.5 shadow-sm">
                <StarIcon className="w-3 h-3" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold tracking-wide">
                {userProfile?.profile.displayName || '親愛的會員'}
              </h2>

            </div>
          </div>

          <div>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full backdrop-blur-sm border text-xs font-medium tracking-wide"
              style={{
                backgroundColor: textColor,
                borderColor: textColor,
                color: getAdvancedContrastHex({ useColor: textColor }) // Ensure badge text inherits color
              }}
            >
              {tierName}
            </span>
          </div>
        </div>

        {/* Card Body: Points & Description */}
        <div className="flex flex-col items-end justify-between">
          <div className="flex flex-col items-center w-full"> {/* New div to hold points AND description */}
            <div className="text-sm font-medium mb-1" style={{ opacity: 0.9 }}>目前累積點數</div>
            {/* Description moved here */}
            <p className="font-light text-xs sm:text-xs" style={{ opacity: 0.8 }}>
              每消費 $1,000 累積 1 點
            </p>

            {/* Carryover spending remainder info */}
            {(() => {
              const unclaimed = userProfile?.unclaimedSpending || 0;
              const expiresAt = userProfile?.unclaimedSpendingExpiresAt;
              const now = new Date();
              let isExpired = false;
              let expiryStr = '';
              if (expiresAt) {
                const expDate = typeof expiresAt.toDate === 'function'
                  ? expiresAt.toDate()
                  : new Date((expiresAt as any).seconds * 1000);
                isExpired = expDate < now;
                expiryStr = `${expDate.getFullYear()}/${expDate.getMonth() + 1}/${expDate.getDate()}`;
              }

              if (unclaimed > 0 && !isExpired) {
                return (
                  <div className="mt-3 w-full max-w-[280px] bg-black/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/20">
                    <div className="flex justify-between text-[11px] font-medium mb-1" style={{ opacity: 0.95 }}>
                      <span>累積消費：${unclaimed.toLocaleString()} / $1,000</span>
                      <span>差 ${(1000 - unclaimed).toLocaleString()} 得 1 點</span>
                    </div>
                    <div className="w-full bg-white/25 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (unclaimed / 1000) * 100)}%` }}
                      />
                    </div>
                    {expiryStr && (
                      <p className="text-[10px] text-center mt-1 font-light" style={{ opacity: 0.8 }}>
                        餘額效期至 {expiryStr}（消費自動延長3個月）
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-5xl sm:text-6xl font-serif font-bold leading-none">
              {loyaltyPoints}
            </span>
            <span className="text-lg opacity-80 font-medium">pt</span>
          </div>

          <div className="flex items-end"> {/* Only "查看兌換紀錄" button here */}
            <button
              className="flex hidden items-center gap-1 hover:opacity-80 transition-opacity font-medium group text-xs"
              style={{ color: textColor }}
            >
              查看兌換紀錄
              <ChevronRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyCard;

