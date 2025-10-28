import type { Timestamp, FieldValue } from 'firebase/firestore';

export type CouponType = 'fixed' | 'percentage';
export type CouponScope = 'all' | 'category' | 'service';

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
  createdAt: Timestamp | FieldValue;
}

export type CouponDocument = Omit<Coupon, 'id'>;