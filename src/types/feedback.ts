import { Timestamp } from 'firebase/firestore';

export interface Feedback {
    id: string;
    content: string;
    status: 'pending' | 'done';
    createdAt: Timestamp;
}

export interface FeedbackComment {
    id: string;
    content: string;
    createdAt: Timestamp;
    authorName: string;
    authorRole?: string;
}
