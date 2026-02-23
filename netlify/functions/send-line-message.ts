import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import admin from 'firebase-admin';
import type { UserDocument } from '../../src/types/user';
import { statusStyles, createBookingConfirmationFlex, createSeasonPassFlexMessage } from '../utils/line-message-utils';
import { initializeFirebase } from '../utils/firebase-admin';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

/**
 * Sends a message to a specified LINE user.
 * @param to - The LINE user ID to send the message to.
 * @param message - The message object, can be a text message or a Flex Message.
 * @param altText - Fallback text for notifications and devices that can't render Flex Messages.
 */
const sendLineMessage = async (to: string, message: object, altText: string) => {
  let messagePayload;

  if ('type' in message && message['type'] === 'text') {
    messagePayload = message;
  } else {
    // Assume it's a Flex Message content object
    messagePayload = {
      type: 'flex',
      altText: altText,
      contents: message,
    };
  }

  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to, messages: [messagePayload] }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Failed to send message to ${to}:`, errorData);
    throw new Error(`LINE API Error: ${errorData.message || JSON.stringify(errorData)}`);
  }
};

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  // Check for LINE Token
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.error('[send-line-message] Missing LINE_CHANNEL_ACCESS_TOKEN');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server environment is not configured correctly. Missing: LINE_CHANNEL_ACCESS_TOKEN' }),
    };
  }

  // Check for Firebase Config (Either full JSON or split keys)
  const hasFirebaseConfig = process.env.FIREBASE_SERVICE_ACCOUNT || (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL);

  if (!hasFirebaseConfig) {
    const missingKeys = [];
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) missingKeys.push('FIREBASE_SERVICE_ACCOUNT');
    // We only complain about split keys if the main one is also missing
    if (!process.env.FIREBASE_PRIVATE_KEY) missingKeys.push('FIREBASE_PRIVATE_KEY');
    if (!process.env.FIREBASE_CLIENT_EMAIL) missingKeys.push('FIREBASE_CLIENT_EMAIL');

    console.error('[send-line-message] Missing Firebase Configuration (FIREBASE_SERVICE_ACCOUNT or PRIVATE_KEY/CLIENT_EMAIL). Missing:', missingKeys.join(', '));
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server environment is not configured correctly. Missing Firebase Credentials.' }),
    };
  }

  if (!process.env.VITE_LIFF_ID) {
    console.warn("[send-line-message] VITE_LIFF_ID is missing in environment variables. URLs may be malformed.");
  }

  try {
    let bodyContent = event.body || '{}';
    if (event.isBase64Encoded) {
      bodyContent = Buffer.from(bodyContent, 'base64').toString('utf-8');
    }
    const body = JSON.parse(bodyContent);
    const { 
      type, 
      userId, 
      serviceNames, 
      dateTime, 
      amount, 
      notes, 
      status, 
      bookingId, 
      passName, 
      variantName, 
      price,
      skipCustomerNotification 
    } = body;

    console.log(`[send-line-message] Request: type=${type}, userId=${userId}, skipCustomer=${skipCustomerNotification}`);

    // Check Firebase Admin Init
    if (!initializeFirebase()) {
      throw new Error("Firebase Admin failed to initialize.");
    }

    const db = admin.firestore();

    // 1. Get all Admins who want to receive notifications
    const adminsQuery = db.collection('users').where('receivesAdminNotifications', '==', true);
    const adminSnapshot = await adminsQuery.get();

    const adminLineUserIds = adminSnapshot.docs
      .map(doc => (doc.data() as UserDocument).lineUserId)
      .filter((id): id is string => !!id);


    // Handle Test Notification
    if (type === 'test_notification') {
      if (adminLineUserIds.length > 0) {
        const testMessage = `✅ 這是一則來自後台的測試訊息 (${new Date().toLocaleTimeString()})。如果您收到此訊息，表示 LINE 通知功能運作正常！`;
        await Promise.all(adminLineUserIds.map(adminId => sendLineMessage(adminId, { type: 'text', text: testMessage }, testMessage)));
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

    // Handle Payment Report Notification
    if (type === 'payment_report') {
      const { note, amount, customerName, serviceName, bookingId } = body;

      if (!note || !bookingId) {
        return { statusCode: 400, body: JSON.stringify({ message: "Missing note or bookingId" }) };
      }

      if (adminLineUserIds.length > 0) {
        const adminMessage = `💰 匯款回報通知 💰\n\n客戶：${customerName || '未知客戶'}\n訂單：${serviceName || '一般預約'}\n金額：$${amount || '-'}\n末五碼：${note}\n\n請至後台確認款項與訂單狀態。`;
        const actionUrl = `https://liff.line.me/${process.env.VITE_LIFF_ID}/orders/${bookingId}`;

        // Send simple text message (easier for admins to read quickly)
        // Or Flex message for better looking actions
        // Let's stick to text for simplicity as requested, but maybe add link

        await Promise.all(adminLineUserIds.map(adminId => sendLineMessage(adminId, {
          type: 'text',
          text: `${adminMessage}\n\n👇 查看訂單\n${actionUrl}`
        }, adminMessage)));

        return { statusCode: 200, body: JSON.stringify({ message: 'Payment report sent to admins.' }) };
      } else {
        console.log("[send-line-message] No admins available to receive payment report.");
        return { statusCode: 200, body: JSON.stringify({ message: 'No admins subscribed.' }) };
      }
    }

    // Handle Season Pass Purchase Notification
    if (type === 'season_pass_purchase') {
      if (!userId || !passName || !variantName || !price) {
        console.error("[send-line-message] Missing required fields for season pass:", { userId, passName, variantName, price });
        return { statusCode: 400, body: JSON.stringify({ message: "Missing required fields" }) };
      }

      // Fetch Settings
      // Fetch Settings
      const settingsDoc = await db.collection('globals').doc('settings').get();
      const settings = settingsDoc.data();
      const flexSettings = settings?.seasonPassFlexMessage;
      const bankInfo = settings?.bankInfo;

      if (!flexSettings?.enabled) {
        console.log("[send-line-message] Season Pass notifications disabled.");
        return { statusCode: 200, body: JSON.stringify({ message: 'Notifications disabled' }) };
      }

      // Get Customer
      const userDoc = await db.collection('users').doc(userId).get();
      const customerData = userDoc.exists ? (userDoc.data() as UserDocument) : null;
      const customerLineUserId = customerData?.lineUserId;
      const customerName = customerData?.profile?.displayName || '客戶';

      // 1. Send Flex to Customer
      const messagePromises = [];
      if (customerLineUserId && !skipCustomerNotification) {
        const flexMessage = createSeasonPassFlexMessage(
          customerName,
          passName,
          variantName,
          price,
          bankInfo || { bankCode: '', bankName: '', accountNumber: '', accountName: '' },
          flexSettings
        );
        const altText = `訂單成立通知：${passName}`;
        messagePromises.push(sendLineMessage(customerLineUserId, flexMessage, altText));
      }

      // 2. Send Text to Admins
      if (adminLineUserIds.length > 0) {
        const adminMessage = `🔔 新季卡訂單 🔔\n\n客戶：${customerName}\n方案：${passName} - ${variantName}\n金額：$${price}\n\n請至後台確認款項。`;
        for (const adminId of adminLineUserIds) {
          messagePromises.push(sendLineMessage(adminId, { type: 'text', text: adminMessage }, adminMessage));
        }
      }

      await Promise.all(messagePromises);
      return { statusCode: 200, body: JSON.stringify({ message: 'Season pass notifications sent.' }) };
    }

    // Handle regular booking notification
    if (!userId || !serviceNames || !dateTime || !bookingId) {
      const missing = [];

      if (!userId) missing.push('userId');
      if (!serviceNames) missing.push('serviceNames');
      if (!dateTime) missing.push('dateTime');
      if (!bookingId) missing.push('bookingId');

      console.error("[send-line-message] Missing required fields:", missing.join(', '));
      return { statusCode: 400, body: JSON.stringify({ message: `Missing required booking information: ${missing.join(', ')}` }) };
    }

    // 2. Get Customer's LINE User ID from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    const customerData = userDoc.exists ? (userDoc.data() as UserDocument) : null;
    const customerLineUserId = customerData?.lineUserId ?? null;
    const customerName = customerData?.profile?.displayName ?? '客戶';

    const formattedDateTime = new Date(dateTime).toLocaleString('zh-TW', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone: 'Asia/Taipei'
    });
    

    const messagePromises = [];
    const style = statusStyles[status] || statusStyles.default;

    // 3. Send message to Admin
    if (adminLineUserIds.length > 0 && status !== 'completed') {
      const adminMessage = `🔔 新預約通知 🔔\n\n客戶：${customerName}\n服務：${serviceNames.join('、')}\n狀態：${status}`;
      for (const adminId of adminLineUserIds) {
        messagePromises.push(sendLineMessage(adminId, { type: 'text', text: adminMessage }, adminMessage));
      }
    }

    // 4. Send message to Customer
    if (customerLineUserId && !skipCustomerNotification) {
      const flexMessage = createBookingConfirmationFlex(customerName, serviceNames, formattedDateTime, amount, status || 'confirmed', bookingId, process.env.VITE_LIFF_ID);
      const altText = `您好，${customerName}！您的預約已${status === 'completed' ? '完成' :status === 'cancelled' ? '取消' : '成功建立'}`;
      messagePromises.push(sendLineMessage(customerLineUserId, flexMessage, altText));
    }

    await Promise.all(messagePromises);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Notification sent successfully.' }),
    };
  } catch (error: any) {
    console.error('[send-line-message] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';

    return {
      statusCode: errorMessage.includes('LINE API Error') ? 502 : 500,
      body: JSON.stringify({
        message: 'Failed to send message',
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      }),
    };
  }
};

export { handler };