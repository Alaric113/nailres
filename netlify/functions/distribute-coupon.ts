import type { Handler, HandlerEvent } from '@netlify/functions';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// FIREBASE_SERVICE_ACCOUNT is handled inside the init block

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  let serviceAccount: any = null;

  try {
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountJson) {
      if (!serviceAccountJson.trim().startsWith('{')) {
        try {
          serviceAccountJson = Buffer.from(serviceAccountJson, 'base64').toString('utf-8');
        } catch (e) {
          console.warn("Failed to decode FIREBASE_SERVICE_ACCOUNT from Base64, attempting to use raw value.");
        }
      }
      serviceAccount = JSON.parse(serviceAccountJson);
    }
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
      throw new Error("Firebase configuration missing");
    }
  } catch (e) {
    console.error("Error init firebase admin:", e);
    throw new Error("Failed to initialize Firebase Admin");
  }
}
const db = getFirestore();

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 1. 驗證使用者是否為管理員 (此為簡化版，正式環境應使用 ID Token 驗證)
    // const { uid } = await verifyIdToken(event);
    // const userDoc = await db.collection('users').doc(uid).get();
    // if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    //   return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden: Not an admin.' }) };
    // }

    const { couponId, targets } = JSON.parse(event.body || '{}');

    if (!couponId || !targets || !Array.isArray(targets) || targets.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing couponId or targets.' }) };
    }

    const allUserIds = new Set<string>();

    // 2. 根據發送類型獲取目標使用者 ID，並合併
    for (const target of targets) {
      switch (target.type) {
        case 'all': {
          const usersSnapshot = await db.collection('users').select().get();
          usersSnapshot.docs.forEach(doc => allUserIds.add(doc.id));
          break; // If 'all' is present, we can stop processing other targets
        }
        case 'new': {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const usersSnapshot = await db.collection('users').where('createdAt', '>=', sevenDaysAgo).select().get();
          usersSnapshot.docs.forEach(doc => allUserIds.add(doc.id));
          break;
        }
        case 'role': {
          if (target.ids && target.ids.length > 0) {
            const usersSnapshot = await db.collection('users').where('role', 'in', target.ids).select().get();
            usersSnapshot.docs.forEach(doc => allUserIds.add(doc.id));
          }
          break;
        }
        case 'specific': {
          if (target.ids && target.ids.length > 0) {
            target.ids.forEach((id: string) => allUserIds.add(id));
          }
          break;
        }
      }
      // If 'all' was one of the targets, no need to process further.
      if (target.type === 'all') break;
    }

    const userIds = Array.from(allUserIds);

    if (userIds.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: 'No users found for the specified target.', distributedCount: 0 }) };
    }

    // 3. 使用批次寫入來發送優惠券
    const MAX_BATCH_SIZE = 500;
    const batches = [];

    for (let i = 0; i < userIds.length; i += MAX_BATCH_SIZE) {
      const batch = db.batch();
      const chunk = userIds.slice(i, i + MAX_BATCH_SIZE);
      for (const userId of chunk) {
        const userCouponRef = db.collection('users').doc(userId).collection('userCoupons').doc(couponId);
        batch.set(userCouponRef, {
          couponId: couponId,
          isUsed: false,
          receivedAt: new Date(),
        });
      }
      batches.push(batch.commit());
    }

    await Promise.all(batches);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully distributed coupon to ${userIds.length} users.`,
        distributedCount: userIds.length,
      }),
    };

  } catch (error: any) {
    console.error('Error distributing coupon:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
};

export { handler };
