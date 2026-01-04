import { Timestamp } from 'firebase/firestore';

export type FeedbackCategory = 'ui' | 'logic' | 'bug' | 'other';

export const FEEDBACK_CATEGORIES: Record<FeedbackCategory, string> = {
    ui: 'UI/介面',
    logic: '功能/邏輯',
    bug: 'Bug',
    other: '其他'
};

export interface Feedback {
    id: string;
    content: string;
    status: 'pending' | 'done';
    category: FeedbackCategory;
    createdAt: Timestamp;
}

export interface FeedbackComment {
    id: string;
    content: string;
    createdAt: Timestamp;
    authorName: string;
    authorRole?: string;
}
