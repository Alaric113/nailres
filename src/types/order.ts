import { Timestamp } from 'firebase/firestore';

export type OrderStatus = 'pending_payment' | 'completed' | 'cancelled';

export interface SeasonPassOrder {
    id: string; // Firestore Document ID
    userId: string;
    userEmail: string;
    userName: string; // For display in admin panel

    // Pass Details Snapshot (in case pass def changes later)
    passId: string;
    passName: string;
    variantName: string;
    price: number;

    status: OrderStatus;

    paymentMethod: 'transfer'; // Currently only bank transfer
    paymentNote?: string; // Optional: Last 5 digits of account, etc.

    createdAt: Timestamp;
    updatedAt: Timestamp;
    completedAt?: Timestamp; // When admin confirmed
}
