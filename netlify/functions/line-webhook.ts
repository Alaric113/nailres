
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import * as crypto from 'crypto';
import { initializeFirebase } from '../utils/firebase-admin';
import { createBookingConfirmationFlex } from '../utils/line-message-utils';

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

const verifySignature = (body: string, signature: string): boolean => {
  if (!CHANNEL_SECRET) return false;
  const hash = crypto
    .createHmac('sha256', CHANNEL_SECRET)
    .update(body)
    .digest('base64');
  return hash === signature;
};

const replyMessage = async (replyToken: string, messages: any[]) => {
  if (!CHANNEL_ACCESS_TOKEN) {
    console.error('Missing LINE_CHANNEL_ACCESS_TOKEN');
    return;
  }

  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to reply message:', error);
    throw new Error(`LINE API Error: ${JSON.stringify(error)}`);
  }
};

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // 1. Verify Request Method
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 2. Verify Signature
  const signature = event.headers['x-line-signature'];
  if (!signature || !verifySignature(event.body || '', signature)) {
    console.warn('Invalid signature');
    return { statusCode: 401, body: 'Invalid signature' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const events = body.events || [];

    // Initialize Firebase if we have events to process
    if (events.length > 0) {
      if (!initializeFirebase()) {
        console.error('Failed to initialize Firebase Admin');
        return { statusCode: 500, body: 'Internal Server Error' };
      }
    }

    const { getFirestore } = await import('firebase-admin/firestore'); // Dynamic import to ensure init happened
    const db = getFirestore();

    await Promise.all(events.map(async (lineEvent: any) => {
      // We only care about Message events of type Text
      if (lineEvent.type !== 'message' || lineEvent.message.type !== 'text') {
        return;
      }

      const replyToken = lineEvent.replyToken;
      const text = lineEvent.message.text?.trim();

      // Check for Booking Confirmation Pattern: "查詢預約 [bookingId]"
      const bookingMatch = text.match(/^查詢預約 (.+)$/);
      
      if (bookingMatch) {
        const bookingId = bookingMatch[1];
        console.log(`Processing booking inquiry for: ${bookingId}`);

        try {
          const bookingDoc = await db.collection('bookings').doc(bookingId).get();
          
          if (!bookingDoc.exists) {
            await replyMessage(replyToken, [{ type: 'text', text: '找不到相關的預約紀錄。' }]);
            return;
          }

          const bookingData = bookingDoc.data();
          if (!bookingData) return;

          // Format Date
          let formattedDateTime = '未定';
          if (bookingData.dateTime) {
             const dateObj = bookingData.dateTime.toDate ? bookingData.dateTime.toDate() : new Date(bookingData.dateTime);
             formattedDateTime = dateObj.toLocaleString('zh-TW', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: false
            });
          }

          const flexMessage = createBookingConfirmationFlex(
            bookingData.customerName || '客戶',
            bookingData.serviceNames || [],
            formattedDateTime,
            bookingData.amount || 0,
            bookingData.status || 'confirmed',
            bookingId,
            process.env.VITE_LIFF_ID
          );

          const altText = `訂單詳情：${bookingData.serviceNames?.join(', ')}`;
          
          await replyMessage(replyToken, [flexMessage]);

        } catch (err) {
          console.error('Error processing booking inquiry:', err);
          await replyMessage(replyToken, [{ type: 'text', text: '系統發生錯誤，請稍後再試。' }]);
        }
      }
    }));

    return { statusCode: 200, body: 'OK' };

  } catch (error) {
    console.error('Webhook error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};

export { handler };
