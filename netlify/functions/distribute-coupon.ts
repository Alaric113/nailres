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
    const { couponId, targets } = JSON.parse(event.body || '{}');

    if (!couponId || !targets || !Array.isArray(targets) || targets.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing couponId or targets.' }) };
    }

    // 1. Fetch source coupon details
    const couponDoc = await db.collection('coupons').doc(couponId).get();
    if (!couponDoc.exists) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Coupon not found.' }) };
    }
    const couponData = couponDoc.data()!;

    const allUserIds = new Set<string>();

    // 2. Get target user IDs
    for (const target of targets) {
      switch (target.type) {
        case 'all': {
          const usersSnapshot = await db.collection('users').select().get();
          usersSnapshot.docs.forEach(doc => allUserIds.add(doc.id));
          break;
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
      if (target.type === 'all') break;
    }

    const userIds = Array.from(allUserIds);

    if (userIds.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: 'No users found for the specified target.', distributedCount: 0 }) };
    }

    // 3. Batch write to user_coupons (Root Collection)
    const MAX_BATCH_SIZE = 500;
    const batches = [];

    for (let i = 0; i < userIds.length; i += MAX_BATCH_SIZE) {
      const batch = db.batch();
      const chunk = userIds.slice(i, i + MAX_BATCH_SIZE);
      for (const userId of chunk) {
        const userCouponRef = db.collection('user_coupons').doc(); // Auto-ID
        batch.set(userCouponRef, {
          userId: userId,
          couponId: couponId,
          code: couponData.code, // Use template code. If unique instance code is needed, append hash.
          title: couponData.title,
          status: 'active',
          value: couponData.value,
          type: couponData.type,
          minSpend: couponData.minSpend || 0,
          scopeType: couponData.scopeType || 'all',
          scopeIds: couponData.scopeIds || [],
          details: couponData.details || '',
          validFrom: couponData.validFrom,
          validUntil: couponData.validUntil,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isUsed: false, // Legacy field, kept for safety
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
