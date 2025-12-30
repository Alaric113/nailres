import React from 'react';
import { useSeasonPasses } from '../../hooks/useSeasonPasses';
import type { ActivePass } from '../../types/user';


interface SeasonPassCardProps {
  pass: ActivePass;
}

const SeasonPassCard: React.FC<SeasonPassCardProps> = ({ pass }) => {
  const { passes } = useSeasonPasses();
  const originalPass = passes.find(p => p.id === pass.passId);

  // Fallback color if original pass not found or no color set
  // Using a distinct but harmonious earth tone if strict color not found
  const cardColor = originalPass?.color || '#8B7355'; 

  // Format expiry date
  const expiryDate = pass.expiryDate 
    ? new Date(pass.expiryDate.seconds * 1000).toLocaleDateString('zh-TW') 
    : '無期限';

  return (
    <div 
      className="relative overflow-hidden rounded-2xl shadow-xl text-white p-6 sm:p-8 transition-all hover:shadow-2xl h-full min-h-[220px] flex flex-col"
      style={{ backgroundColor: cardColor }}
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
          <div className="flex items-center gap-2 text- opacity-75 ">
          <span>有效: {expiryDate}</span>
        </div>
        </div>

        {/* Content Usages */}
        <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar pr-2">
           <div className="space-y-2">
              {Object.entries(pass.remainingUsages).map(([itemId, remaining]) => {
                  const itemDef = originalPass?.contentItems.find(i => i.id === itemId);
                  const itemName = itemDef?.name || '未知項目';
                  
                  // Only show items that have remaining usages or are unlimited/special
                  // For now, showing all tracked in remainingUsages
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

        {/* Footer: Expiry */}
        

      </div>
    </div>
  );
};

export default SeasonPassCard;
