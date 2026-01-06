import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useSeasonPasses } from '../../hooks/useSeasonPasses';
import type { ActivePass } from '../../types/user';

interface SeasonPassBackground {
  backgroundUrl: string;
  textColor: string;
}

interface SeasonPassCardProps {
  pass: ActivePass;
  previewBackground?: string;
  previewTextColor?: string;
}

// Skeleton Component
const SeasonPassCardSkeleton: React.FC = () => (
  <div className="relative overflow-hidden rounded-2xl shadow-xl p-6 sm:p-8 h-full min-h-[220px] flex flex-col bg-gray-200 animate-pulse">
    {/* Header skeleton */}
    <div className="flex justify-between items-start mb-4">
      <div className="flex flex-row gap-2">
        <div className="h-8 w-32 bg-gray-300 rounded"></div>
        <div className="h-6 w-16 bg-gray-300 rounded-full"></div>
      </div>
      <div className="h-5 w-24 bg-gray-300 rounded"></div>
    </div>
    {/* Content skeleton */}
    <div className="flex-1 space-y-3">
      <div className="h-4 w-full bg-gray-300 rounded"></div>
      <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
      <div className="h-4 w-5/6 bg-gray-300 rounded"></div>
    </div>
  </div>
);

const SeasonPassCard: React.FC<SeasonPassCardProps> = ({ pass, previewBackground, previewTextColor }) => {
  const { passes } = useSeasonPasses();
  const originalPass = passes.find(p => p.id === pass.passId);
  const [savedBackground, setSavedBackground] = useState<SeasonPassBackground | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch saved background from Firestore if not in preview mode
  useEffect(() => {
    if (previewBackground !== undefined) {
      setIsLoading(false);
      return;
    }

    const fetchBackground = async () => {
      try {
        const docRef = doc(db, 'globals', 'homepageImages');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const passBackgrounds = data.seasonPassBackgrounds || {};
          if (passBackgrounds[pass.passId]) {
            setSavedBackground(passBackgrounds[pass.passId]);
          }
        }
      } catch (e) {
        console.error('Error fetching season pass background:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBackground();
  }, [pass.passId, previewBackground]);

  // Determine background URL
  const backgroundUrl = previewBackground ?? savedBackground?.backgroundUrl;
  const textColor = previewTextColor ?? savedBackground?.textColor ?? '#FFFFFF';

  // Preload background image
  useEffect(() => {
    if (!backgroundUrl) {
      setIsImageLoaded(true);
      return;
    }

    const img = new Image();
    img.onload = () => setIsImageLoaded(true);
    img.onerror = () => setIsImageLoaded(true); // Show card anyway on error
    img.src = backgroundUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [backgroundUrl]);

  // Fallback color if original pass not found or no color set
  const cardColor = originalPass?.color || '#8B7355';

  // Format expiry date
  const expiryDate = pass.expiryDate
    ? new Date(pass.expiryDate.seconds * 1000).toLocaleDateString('zh-TW')
    : '無期限';

  // Show skeleton while loading
  if (isLoading || !isImageLoaded) {
    return <SeasonPassCardSkeleton />;
  }

  const cardStyle: React.CSSProperties = backgroundUrl
    ? {
      backgroundImage: `url(${backgroundUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: textColor
    }
    : { backgroundColor: cardColor };

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-xl text-white p-6 sm:p-8 transition-all hover:shadow-2xl h-full min-h-[220px] flex flex-col"
      style={cardStyle}
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>

      <div className="relative z-10 flex flex-col h-full justify-between">

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-row">
            <h2 className="text-2xl font-serif font-bold tracking-wide">
              {pass.passName}
            </h2>
            {pass.variantName && (
              <span className="flex items-center rounded-full ml-2 mt-1 px-2 py-0.5 text-xs bg-white/20 backdrop-blur-sm border border-white/10">
                {pass.variantName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 opacity-75">
            <span>有效: {expiryDate}</span>
          </div>
        </div>

        {/* Content Usages */}
        <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar pr-2">
          <div className="space-y-2">
            {Object.entries(pass.remainingUsages).map(([itemId, remaining]) => {
              const itemDef = originalPass?.contentItems.find(i => i.id === itemId);
              const itemName = itemDef?.name || '未知項目';

              const isBenefit = itemDef?.category === '權益';
              const showCount = remaining !== -1 && !isBenefit;

              return (
                <div key={itemId} className="flex justify-between items-center text-sm border-b border-white/10 pb-1 last:border-0 last:pb-0">
                  <span className="opacity-90 truncate mr-4">{itemName}</span>
                  {showCount && (
                    <span className="font-bold whitespace-nowrap">
                      剩餘 {remaining} 次
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SeasonPassCard;


