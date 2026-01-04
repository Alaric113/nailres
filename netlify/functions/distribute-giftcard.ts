import type { Handler, HandlerEvent } from '@netlify/functions';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

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
    const { giftCardId, targets } = JSON.parse(event.body || '{}');

    if (!giftCardId || !targets || !Array.isArray(targets) || targets.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing giftCardId or targets.' }) };
    }

    // Get gift card template info
    const giftCardDoc = await db.collection('gift_cards').doc(giftCardId).get();
    if (!giftCardDoc.exists) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Gift card not found.' }) };
    }
    const giftCardData = giftCardDoc.data()!;

    const allUserIds = new Set<string>();

    // Get target user IDs based on target type
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

    // Batch write user gift cards
    const MAX_BATCH_SIZE = 500;
    const batches = [];

    for (let i = 0; i < userIds.length; i += MAX_BATCH_SIZE) {
      const batch = db.batch();
      const chunk = userIds.slice(i, i + MAX_BATCH_SIZE);
      for (const userId of chunk) {
        const userGiftCardRef = db.collection('user_giftcards').doc();
        batch.set(userGiftCardRef, {
          userId: userId,
          giftCardId: giftCardId,
          name: giftCardData.name,
          description: giftCardData.description || '',
          imageUrl: giftCardData.imageUrl || null,
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      batches.push(batch.commit());
    }

    await Promise.all(batches);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully distributed gift card to ${userIds.length} users.`,
        distributedCount: userIds.length,
      }),
    };

  } catch (error: any) {
    console.error('Error distributing gift card:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
};

export { handler };
