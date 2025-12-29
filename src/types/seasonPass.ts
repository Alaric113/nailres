export interface SeasonPassVariant {
    name: string; // e.g., '120本'
    price: number;
    originalPrice?: number; // New: For displaying sale (e.g., $5200 -> $4680)
}

export interface PlanContentItem {
    id: string;
    name: string;
    type: 'service' | 'product';
    category?: 'ticket' | 'benefit'; // New: Grouping (Ticket=Usage, Benefit=Passive)
    quantity: number;
    serviceId?: string; // Optional link to actual service
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
