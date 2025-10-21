import { Timestamp, FieldValue } from 'firebase/firestore';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

/**
 * Formats a Firestore Timestamp or FieldValue into a human-readable string.
 * If the input is a FieldValue (e.g., serverTimestamp()), it returns a placeholder.
 * If the input is undefined or null, it returns 'N/A'.
 * @param timestamp The Firestore Timestamp or FieldValue to format.
 * @returns A formatted date string or a placeholder.
 */
export const formatTimestamp = (timestamp: Timestamp | FieldValue | undefined): string => {
  if (!timestamp) {
    return 'N/A';
  }

  if (timestamp instanceof Timestamp) {
    return format(timestamp.toDate(), 'yyyy年MM月dd日 HH:mm', { locale: zhTW });
  }

  // If it's a FieldValue (like serverTimestamp()), it's not a concrete date yet.
  return '處理中...';
};
