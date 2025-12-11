import type { BusinessHours } from './businessHours';

export interface Designer {
  id: string;
  name: string;
  title?: string; // 例如：資深設計師、店長
  bio?: string;   // 個人簡介
  avatarUrl?: string;
  
  // 關聯設定
  linkedUserId?: string | null; // 連結到的系統使用者 ID (用於通知、權限判定)
  
  // 營運設定
  customBusinessHours?: BusinessHours; // 該設計師的獨立營業時間 (若無則使用全店預設)
  isActive: boolean; // 是否接受預約
  displayOrder: number; // 前台顯示順序
  
  // 價格設定 (預留)
  priceModifier?: number; // 例如 1.2 代表價格加成 20%
}
