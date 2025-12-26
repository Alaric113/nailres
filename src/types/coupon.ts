import type { Timestamp, FieldValue } from 'firebase/firestore';

export type CouponType = 'fixed' | 'percentage';
export type CouponScope = 'all' | 'category' | 'service' | 'designer';

export interface Coupon {
  id: string;
  code: string;
  title: string;
  details: string;
  rules: string;
  type: CouponType;
  value: number;
  minSpend: number;
  scopeType: CouponScope;
  scopeIds: string[];
  validFrom: Timestamp;
  validUntil: Timestamp;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  isNewUserCoupon?: boolean;
  createdAt: Timestamp | FieldValue;
}


export interface UserCoupon {
  id: string; // The specific user_coupon instance ID
  couponId: string; // The template ID
  code: string; // Unique code (e.g. VIP-1234)
  title: string;
  status: 'active' | 'used' | 'expired';
  value: number;
  type: CouponType;
  minSpend: number;
  scopeType: CouponScope;
  scopeIds: string[];
  details: string;
  validFrom: Timestamp;
  validUntil: Timestamp;
  createdAt: Timestamp;
  redeemedAt?: Timestamp; // When it was used
  redemptionSource?: string;
}
