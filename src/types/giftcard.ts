import type { Timestamp, FieldValue } from 'firebase/firestore';

export interface GiftCard {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Timestamp | FieldValue;
}

export type GiftCardDocument = Omit<GiftCard, 'id'>;

// User-owned gift card (from redemption or distribution)
export interface UserGiftCard {
  id: string;
  userId: string;
  giftCardId: string; // Reference to template
  name: string;
  description: string;
  imageUrl?: string;
  status: 'active' | 'redeemed';
  createdAt: Timestamp;
  redeemedAt?: Timestamp;
}
