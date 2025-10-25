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

/**
 * Sends a message to a specified LINE user.
 * @param to - The LINE user ID to send the message to.
 * @param message - The message object, can be a text message or a Flex Message.
 * @param altText - Fallback text for notifications and devices that can't render Flex Messages.
 */
const sendLineMessage = async (to: string, message: object, altText: string) => {
  let messagePayload;

  if ('type' in message && message.type === 'text') {
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

const statusStyles: Record<string, { titleText: string; titleColor: string; tagText?: string; tagBackgroundColor?: string; tagBorderColor?: string; }> = {
  pending_payment: {
    titleText: '預約資訊',
    titleColor: '#ff9800', // Orange
    tagText: '待付訂金',
    tagBackgroundColor: '#fff3e0',
    tagBorderColor: '#ffe0b2',
  },
  confirmed: {
    titleText: '預約資訊',
    titleColor: '#28a745', // Green
    tagText: '預約成功/已收訂金',
    tagBackgroundColor: '#d4edda',
    tagBorderColor: '#c3e6cb',
  },
  completed: {
    titleText: '預約資訊',
    titleColor: '#007bff', // Blue
    tagText: '已完成',
    tagBackgroundColor: '#d1ecf1',
    tagBorderColor: '#bee5eb',
  },
  cancelled: {
    titleText: '預約資訊',
    titleColor: '#dc3545', // Red
    tagText: '已取消',
    tagBackgroundColor: '#f8d7da',
    tagBorderColor: '#f5c6cb',
  },
  default: {
    titleText: '預約資訊',
    titleColor: '#6c757d', // Gray
  },
};

const createBookingConfirmationFlex = (customerName: string, serviceNames: string[], formattedDateTime: string, amount: number, status: string) => {
  const style = statusStyles[status] || statusStyles.default;

  const footerContent = style.tagText ? {
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          contents: [{ type: 'text', text: style.tagText, margin: 'none', size: 'sm', align: 'center' }],
          borderWidth: '1px',
          borderColor: style.tagBorderColor || '#dee2e6',
          cornerRadius: '50px',
          spacing: 'none',
          paddingAll: '5px',
          backgroundColor: style.tagBackgroundColor || '#e9ecef',
        },
      ],
      flex: 0,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 'none',
    }
  } : {};

  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: style.titleText, weight: 'bold', size: 'xl', color: style.titleColor, align: 'center' },
        { type: 'separator', margin: 'md' },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            { type: 'box', layout: 'baseline', spacing: 'sm', contents: [{ type: 'text', text: '項目', color: '#aaaaaa', size: 'sm', flex: 1 }, { type: 'text', text: serviceNames.join('、'), wrap: true, color: '#666666', size: 'sm', flex: 4 }] },
            { type: 'box', layout: 'baseline', spacing: 'sm', contents: [{ type: 'text', text: '時間', color: '#aaaaaa', size: 'sm', flex: 1 }, { type: 'text', text: formattedDateTime, wrap: true, color: '#666666', size: 'sm', flex: 4 }] },
            { type: 'box', layout: 'baseline', spacing: 'sm', contents: [{ type: 'text', text: '金額', color: '#aaaaaa', size: 'sm', flex: 1 }, { type: 'text', text: `$${amount}`, wrap: true, color: '#666666', size: 'sm', flex: 4 }] },
          ],
        },
      ],
    },
    ...footerContent,
  };
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
    const { type, userId, serviceNames, dateTime, amount, notes, status } = body;

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

    // Handle regular booking notification
    if (!userId || !serviceNames || !dateTime) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing required booking information.' }) };
    }

    // 2. Get Customer's LINE User ID from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    const customerData = userDoc.exists ? (userDoc.data() as UserDocument) : null;
    const customerLineUserId = customerData?.lineUserId ?? null;
    const customerName = customerData?.profile?.displayName ?? '客戶';

    const formattedDateTime = new Date(dateTime).toLocaleString('zh-TW', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });

    const messagePromises = [];

    // 3. Send message to Admin
    if (adminLineUserIds.length > 0) {
      const adminMessage = `🔔 新預約通知 🔔\n\n客戶：${customerName}\n服務：${serviceNames.join('、')}\n時間：${formattedDateTime}\n金額：$${amount}\n備註：${notes || '無'}`;
      for (const adminId of adminLineUserIds) {
        messagePromises.push(sendLineMessage(adminId, { type: 'text', text: adminMessage }, adminMessage));
      }
    }

    // 4. Send message to Customer
    if (customerLineUserId) {
      const flexMessage = createBookingConfirmationFlex(customerName, serviceNames, formattedDateTime, amount, status || 'confirmed');
      const altText = `您好，${customerName}！您的預約已成功建立：${serviceNames.join('、')} at ${formattedDateTime}`;
      messagePromises.push(sendLineMessage(customerLineUserId, flexMessage, altText));
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