import { Timestamp } from 'firebase/firestore';

export interface Feedback {
    id: string;
    content: string;
    status: 'pending' | 'done';
    createdAt: Timestamp;
}
