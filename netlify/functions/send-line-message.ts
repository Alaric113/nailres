import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import admin from 'firebase-admin';
import type { UserDocument } from '../../src/types/user';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  if (!FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('Firebase service account is not configured.');
  }
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT)),
  });
}

const db = admin.firestore();

const sendLineMessage = async (to: string, message: string) => {
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to,
      messages: [{ type: 'text', text: message }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Failed to send message to ${to}:`, errorData);
    throw new Error(`LINE API Error: ${errorData.message}`);
  }
};

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  if (!LINE_CHANNEL_ACCESS_TOKEN || !FIREBASE_SERVICE_ACCOUNT) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server environment is not configured correctly.' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { type, userId, serviceNames, dateTime, amount, notes } = body;

    // 1. Get all Admins who want to receive notifications
    const adminsQuery = db.collection('users').where('receivesAdminNotifications', '==', true);
    const adminSnapshot = await adminsQuery.get();
    const adminLineUserIds = adminSnapshot.docs
      .map(doc => (doc.data() as UserDocument).lineUserId)
      .filter((id): id is string => !!id);

    // Handle test notification
    if (type === 'test_notification') {
      if (adminLineUserIds.length > 0) {
        const testMessage = `✅ 這是一則來自後台的測試訊息 (${new Date().toLocaleTimeString()})。如果您收到此訊息，表示 LINE 通知功能運作正常！`;
        await Promise.all(adminLineUserIds.map(adminId => sendLineMessage(adminId, testMessage)));
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Test notification sent successfully.' }),
        };
      } else {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'No admins found with notifications enabled.' }),
        };
      }
    }

    // Handle regular booking notification
    if (!userId || !serviceNames || !dateTime) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing required booking information.' }) };
    }

    // 2. Get Customer's LINE User ID from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    const customerLineUserId = userDoc.exists ? (userDoc.data() as UserDocument).lineUserId : null;
    const customerName = userDoc.exists ? (userDoc.data() as UserDocument).profile.displayName : '客戶';

    const formattedDateTime = new Date(dateTime).toLocaleString('zh-TW', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });

    const messagePromises = [];

    // 3. Send message to Admin
    if (adminLineUserIds.length > 0) {
      const adminMessage = `🔔 新預約通知 🔔\n\n客戶：${customerName}\n服務：${serviceNames.join('、')}\n時間：${formattedDateTime}\n金額：$${amount}\n備註：${notes || '無'}`;
      for (const adminId of adminLineUserIds) {
        messagePromises.push(sendLineMessage(adminId, adminMessage));
      }
    }

    // 4. Send message to Customer
    if (customerLineUserId) {
      const customerMessage = `您好，${customerName}！\n您的預約已成功建立 ✨\n\n服務：${serviceNames.join('、')}\n時間：${formattedDateTime}\n金額：$${amount}\n\n期待您的光臨！`;
      messagePromises.push(sendLineMessage(customerLineUserId, customerMessage));
    }

    await Promise.all(messagePromises);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Notification sent successfully.' }),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      statusCode: errorMessage.includes('LINE API Error') ? 502 : 500,
      body: JSON.stringify({ message: 'Failed to send message', error: errorMessage }),
    };
  }
};

export { handler };