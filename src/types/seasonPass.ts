export interface SeasonPassVariant {
    name: string; // e.g., '120本'
    price: number;
    originalPrice?: number; // New: For displaying sale (e.g., $5200 -> $4680)
}

export interface PlanContentItem {
    id: string;
    name: string; // Display name (e.g., "3次完整睫毛嫁接", "免費升級天鵝絨扁毛")

    // Category: 服務 = redeemable service, 權益 = passive benefit
    category: '服務' | '權益';

    // === For 服務 category ===
    serviceId?: string;     // Link to service
    quantity?: number;      // Usage count (e.g., 3次)
    monthlyLimit?: number;  // Optional: max per month (e.g., 每月1次)

    // === Benefit Type (for both 服務 and 權益) ===
    // standalone: Use service directly
    // upgrade: Apply discount to service add-on
    // discount: Link to coupon
    // giftcard: Link to gift card
    benefitType?: 'standalone' | 'upgrade' | 'discount' | 'giftcard';

    // === For upgrade (附加減價/免費) ===
    appliesTo?: string;       // Service ID this applies to
    upgradeOptionId?: string; // Service option item ID to discount
    discountAmount?: number;  // Discount value (0 = free)

    // === For discount (折扣券) ===
    couponId?: string; // Link to coupon template

    // === For giftcard (商品卡) ===
    giftCardId?: string; // Link to gift card template
}

export interface SeasonPass {
    id: string;
    name: string;
    duration: string; // e.g., '3個月'
    variants: SeasonPassVariant[]; // List of pricing options
    contentItems: PlanContentItem[]; // List of included services/products
    note?: string; // Pricing calculation details
    imageUrl?: string; // URL of the uploaded image
    color: string;
    isActive: boolean;
    order: number;
}
