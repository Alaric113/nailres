import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import admin from 'firebase-admin';
import type { UserDocument } from '../../src/types/user';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  let serviceAccount: any = null;

  try {
    // Option 1: Full JSON in FIREBASE_SERVICE_ACCOUNT
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountJson) {
      // Check if base64 encoded
      if (!serviceAccountJson.trim().startsWith('{')) {
        try {
          serviceAccountJson = Buffer.from(serviceAccountJson, 'base64').toString('utf-8');
        } catch (e) {
          console.warn("Failed to decode FIREBASE_SERVICE_ACCOUNT from Base64, attempting to use raw value.");
        }
      }
      serviceAccount = JSON.parse(serviceAccountJson);
    }
    // Option 2: Individual variables
    else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      serviceAccount = {
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      };
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.warn("Firebase credentials missing. LINE notifications may fail if they depend on Firestore.");
      // Don't throw here to allow function to proceed if DB isn't strictly needed for all paths?
      // Actually, this function DOES use firestore, so it will fail later.
    }
  } catch (e) {
    console.error("Error init firebase admin:", e);
  }
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

const statusStyles: Record<string, {
  headerColor: string;
  titleText: string;
  statusText: string;
  statusTextColor: string;
  themeColor: string;
}> = {
  pending_payment: {
    headerColor: '#F5F3EF', // Soft cream
    titleText: '預約確認中',
    statusText: '待付訂金',
    statusTextColor: '#B45309', // Amber 700
    themeColor: '#D97706', // Amber 600
  },
  confirmed: {
    headerColor: '#F0F2F0', // Soft Greenish
    titleText: '預約成功',
    statusText: '已確認',
    statusTextColor: '#9F9586', // Brand Olive
    themeColor: '#9F9586',
  },
  completed: {
    headerColor: '#F3F4F6', // Gray
    titleText: '服務完成',
    statusText: '已完成',
    statusTextColor: '#4B5563',
    themeColor: '#6B7280',
  },
  cancelled: {
    headerColor: '#FEF2F2', // Red fade
    titleText: '預約已取消',
    statusText: '已取消',
    statusTextColor: '#DC2626',
    themeColor: '#EF4444',
  },
  default: {
    headerColor: '#F3F4F6',
    titleText: '預約資訊',
    statusText: '狀態未知',
    statusTextColor: '#6B7280',
    themeColor: '#9CA3AF',
  },
};

const createBookingConfirmationFlex = (customerName: string, serviceNames: string[], formattedDateTime: string, amount: number, status: string) => {
  const style = statusStyles[status] || statusStyles.default;

  return {
    type: 'bubble',
    size: 'giga', // Maximized width
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: style.titleText,
              weight: 'bold',
              size: 'xl',
              color: style.themeColor,
              flex: 1
            },
            {
              type: 'text',
              text: style.statusText,
              weight: 'bold',
              size: 'sm',
              color: style.statusTextColor,
              align: 'end',
              gravity: 'center'
            }
          ]
        },
        {
          type: 'separator',
          margin: 'md',
          color: style.themeColor
        }
      ],
      backgroundColor: '#FFFFFF',
      paddingTop: '20px',
      paddingBottom: '10px',
      paddingStart: '20px',
      paddingEnd: '20px'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `Hi, ${customerName}`,
          weight: 'bold',
          size: 'md',
          margin: 'md',
          color: '#1F2937'
        },
        {
          type: 'text',
          text: '感謝您的預約，以下是您的詳細資訊：',
          size: 'xs',
          color: '#6B7280',
          margin: 'sm',
          wrap: true
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'xl',
          spacing: 'md',
          contents: [
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                { type: 'text', text: '服務項目', color: '#9CA3AF', size: 'xs', flex: 2 },
                { type: 'text', text: serviceNames.join('、'), wrap: true, color: '#374151', size: 'sm', flex: 5, weight: 'bold' }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                { type: 'text', text: '預約時間', color: '#9CA3AF', size: 'xs', flex: 2 },
                { type: 'text', text: formattedDateTime, wrap: true, color: '#374151', size: 'sm', flex: 5 }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                { type: 'text', text: '金額合計', color: '#9CA3AF', size: 'xs', flex: 2 },
                { type: 'text', text: `NT$ ${amount}`, wrap: true, color: '#9F9586', size: 'lg', flex: 5, weight: 'bold' }
              ]
            }
          ]
        }
      ],
      backgroundColor: '#FFFFFF'
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '查看詳細資訊',
            uri: 'https://liff.line.me/' + process.env.VITE_LIFF_ID // Assuming this or similar link
          },
          style: 'primary', // Filled button
          color: '#9F9586',
          height: 'sm'
        },
        {
          type: 'text',
          text: '如需更改或取消，請提前聯繫我們。',
          size: 'xxs',
          color: '#9CA3AF',
          align: 'center',
          margin: 'md',
          wrap: true
        }
      ],
      paddingAll: '20px'
    },
    styles: {
      footer: {
        separator: false
      }
    }
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
    let bodyContent = event.body || '{}';
    if (event.isBase64Encoded) {
      bodyContent = Buffer.from(bodyContent, 'base64').toString('utf-8');
    }
    const body = JSON.parse(bodyContent);
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