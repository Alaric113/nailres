import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import admin from 'firebase-admin';
import type { UserDocument } from '../../src/types/user';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (admin.apps.length > 0) {
    console.log('[send-line-message] Firebase already initialized.');
    return true;
  }

  console.log('[send-line-message] Initializing Firebase Admin...');
  let serviceAccount: any = null;

  try {
    // Option 1: Full JSON in FIREBASE_SERVICE_ACCOUNT
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountJson) {
      console.log('[send-line-message] Found FIREBASE_SERVICE_ACCOUNT');
      try {
        let jsonStr = serviceAccountJson;
        // Check if base64 encoded
        if (!jsonStr.trim().startsWith('{')) {
          try {
            jsonStr = Buffer.from(jsonStr, 'base64').toString('utf-8');
          } catch (e) {
            console.warn("[send-line-message] Failed to decode FIREBASE_SERVICE_ACCOUNT from Base64, attempting to use raw value.");
          }
        }
        serviceAccount = JSON.parse(jsonStr);
        console.log('[send-line-message] Successfully parsed FIREBASE_SERVICE_ACCOUNT JSON');
      } catch (e) {
        console.error('[send-line-message] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e);
        serviceAccount = null;
      }
    }

    // Option 2: Individual variables (Fallback or Primary if Option 1 missing)
    if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('[send-line-message] Using FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL');
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      // Fix potential formatting issues with env vars
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
      }

      // Replace escaped newlines (handle both \\n and \n)
      privateKey = privateKey.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');

      serviceAccount = {
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      };
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[send-line-message] Firebase initialized successfully.');
      return true;
    } else {
      console.warn("[send-line-message] Firebase credentials missing. LINE notifications may fail if they depend on Firestore.");
      return false;
    }
  } catch (e) {
    console.error("[send-line-message] Error init firebase admin:", e);
    return false;
  }
};

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
    titleText: '等待訂金支付',
    statusText: '待付訂金',
    statusTextColor: '#B45309', // Amber 700
    themeColor: '#D97706', // Amber 600
  },
  pending_confirmation: {
    headerColor: '#F5F3EF', // Soft cream
    titleText: '等待確認',
    statusText: '待確認',
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
    statusTextColor: '#1159bdff',
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

const createBookingConfirmationFlex = (customerName: string, serviceNames: string[], formattedDateTime: string, amount: number, status: string, bookingId: string) => {
  const style = statusStyles[status] || statusStyles.default;

  let actionData: any = {
    label: '查看詳細資訊',
    uri: 'https://liff.line.me/' + process.env.VITE_LIFF_ID + '/orders/' + bookingId
  };

  if (status === 'pending_payment') {
    actionData = {
      label: '我已付款?', // Go to Payment
      uri: 'https://liff.line.me/' + process.env.VITE_LIFF_ID + '/booking/pay/' + bookingId
    };
  } else if (bookingId) {
    // Optional: Deep link to specific booking details if you have a detail page
    // actionData.uri = ...
  }

  const footerContents: any[] = [
    {
      type: 'button',
      action: {
        type: 'uri',
        label: actionData.label,
        uri: actionData.uri
      },
      style: 'primary',
      color: status === 'pending_payment' ? '#B45309' : '#9F9586', // Amber for payment, Brand color for others
      height: 'sm'
    }
  ];

  if (status === 'completed') {
    footerContents.unshift({ // Add to top or bottom? User requested "increase a button"
      type: 'button',
      action: {
        type: 'uri',
        label: '給予評價',
        uri: 'https://liff.line.me/' + process.env.VITE_LIFF_ID + '/orders/' + bookingId + '/feedback'
      },
      style: 'primary',
      color: '#9F9586', // Accent color for feedback? Or brand color? Using Amber for now to stand out or maybe consistent.
      height: 'sm',
      margin: 'md'
    });
  }

  return {
    type: 'bubble',
    size: 'mega', // Maximized width
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
          text: status === 'completed' ? '感謝您的光臨，期待再次為您服務！' : '感謝您的預約，以下是您的詳細資訊：',
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
      spacing: 'md',
      contents: [
        ...footerContents,
        {
          type: 'text',
          text: status === 'completed' ? '如有任何問題，歡迎隨時聯繫我們。' : '如需更改或取消，請提前聯繫我們。',
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

const createSeasonPassFlexMessage = (
  customerName: string,
  passName: string,
  variantName: string,
  price: number,
  bankInfo: any,
  settings: any
) => {
  const { headerText = '季卡訂單成立', headerColor = '#9F9586', bodyTextTemplate = '', footerText = '' } = settings;

  // Replace variables in template
  let bodyText = bodyTextTemplate
    .replace('{{customerName}}', customerName)
    .replace('{{passName}}', passName)
    .replace('{{variantName}}', variantName)
    .replace('{{price}}', price.toLocaleString());

  // Handle bankInfo specially
  const bankInfoText = `${bankInfo.bankCode} ${bankInfo.bankName}\n${bankInfo.accountNumber}\n${bankInfo.accountName}`;
  bodyText = bodyText.replace('{{bankInfo}}', bankInfoText);

  return {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: headerText,
          weight: 'bold',
          size: 'xl',
          color: '#FFFFFF',
          align: 'center'
        }
      ],
      backgroundColor: headerColor,
      paddingAll: '20px'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: bodyText,
          wrap: true,
          size: 'sm',
          color: '#666666',
          lineSpacing: '4px'
        }
      ],
      paddingAll: '20px',
      backgroundColor: '#FFFFFF'
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'separator',
          color: '#EFEFEF'
        },
        {
          type: 'text',
          text: footerText,
          size: 'xs',
          color: '#AAAAAA',
          align: 'center',
          margin: 'md',
          wrap: true
        }
      ],
      backgroundColor: '#FFFFFF',
      paddingAll: '10px'
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
    const { type, userId, serviceNames, dateTime, amount, notes, status, bookingId, passName, variantName, price } = body;

    console.log(`[send-line-message] Request: type=${type}, userId=${userId}`);

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
      if (customerLineUserId) {
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
      hour: '2-digit', minute: '2-digit', hour12: false
    });

    const messagePromises = [];
    const style = statusStyles[status] || statusStyles.default;

    // 3. Send message to Admin
    if (adminLineUserIds.length > 0 && status !== 'completed') {
      const adminMessage = `🔔 新預約通知 🔔\n\n客戶：${customerName}\n服務：${serviceNames.join('、')}}`;
      for (const adminId of adminLineUserIds) {
        messagePromises.push(sendLineMessage(adminId, { type: 'text', text: adminMessage }, adminMessage));
      }
    }

    // 4. Send message to Customer
    if (customerLineUserId) {
      const flexMessage = createBookingConfirmationFlex(customerName, serviceNames, formattedDateTime, amount, status || 'confirmed', bookingId);
      const altText = `您好，${customerName}！您的預約已${status === 'completed' ? '完成' : '成功建立'}：${serviceNames.join('、')} at ${formattedDateTime}`;
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