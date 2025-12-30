import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import type { ActivePass } from '../types/user';
import type { PlanContentItem } from '../types/seasonPass';

interface UseActivePassResult {
    activePasses: ActivePass[];
    hasActivePass: boolean;
    getValidPasses: () => ActivePass[];
    getRemainingUsage: (passId: string, contentItemId: string) => number;
    getAvailableTickets: (pass: ActivePass, contentItems: PlanContentItem[]) => PlanContentItem[];
    getUpgradesForService: (pass: ActivePass, contentItems: PlanContentItem[], serviceId: string) => PlanContentItem[];
}

/**
 * Hook for managing and querying user's active Season Passes
 */
export const useActivePass = (): UseActivePassResult => {
    const { userProfile } = useAuthStore();

    const activePasses = useMemo(() => {
        return userProfile?.activePasses || [];
    }, [userProfile?.activePasses]);

    const hasActivePass = activePasses.length > 0;

    /**
     * Get passes that are not expired
     */
    const getValidPasses = (): ActivePass[] => {
        const now = new Date();
        return activePasses.filter(pass => {
            const expiry = pass.expiryDate.toDate();
            return expiry > now;
        });
    };

    /**
     * Get remaining usage count for a specific content item
     */
    const getRemainingUsage = (passId: string, contentItemId: string): number => {
        const pass = activePasses.find(p => p.passId === passId);
        if (!pass) return 0;
        return pass.remainingUsages[contentItemId] || 0;
    };

    /**
     * Get available tickets (standalone benefits with remaining usage)
     */
    const getAvailableTickets = (pass: ActivePass, contentItems: PlanContentItem[]): PlanContentItem[] => {
        return contentItems.filter(item => {
            const isStandalone = item.benefitType === 'standalone' || !item.benefitType;
            const hasRemaining = (pass.remainingUsages[item.id] || 0) > 0;
            return isStandalone && hasRemaining;
        });
    };

    /**
     * Get upgrade benefits that apply to a specific service
     */
    const getUpgradesForService = (
        pass: ActivePass,
        contentItems: PlanContentItem[],
        serviceId: string
    ): PlanContentItem[] => {
        return contentItems.filter(item => {
            const isUpgrade = item.benefitType === 'upgrade';
            const appliesTo = item.appliesTo === serviceId;
            const hasRemaining = (pass.remainingUsages[item.id] || 0) > 0;
            return isUpgrade && appliesTo && hasRemaining;
        });
    };

    return {
        activePasses,
        hasActivePass,
        getValidPasses,
        getRemainingUsage,
        getAvailableTickets,
        getUpgradesForService,
    };
};
