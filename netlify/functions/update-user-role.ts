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

const auth = admin.auth();
const db = getFirestore();

const VALID_ROLES = ['user', 'platinum', 'designer', 'manager', 'admin'] as const;
type ValidRole = typeof VALID_ROLES[number];

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  try {
    // 1. Parse body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON body.' }) };
    }

    const { targetUserId, newRole } = body;

    if (!targetUserId || !newRole) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing required fields: targetUserId, newRole.' }) };
    }

    if (!VALID_ROLES.includes(newRole)) {
      return { statusCode: 400, body: JSON.stringify({ message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }) };
    }

    // 2. Verify requester identity
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized: Missing Token' }) };
    }
    const idToken = authHeader.split('Bearer ')[1];

    const decodedToken = await auth.verifyIdToken(idToken);
    const requesterUid = decodedToken.uid;

    // 3. Check admin permission — only 'admin' can change roles
    const requesterDoc = await db.collection('users').doc(requesterUid).get();
    if (!requesterDoc.exists) {
      return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden: Requester profile not found.' }) };
    }

    const requesterRole = requesterDoc.data()?.role;
    if (requesterRole !== 'admin') {
      console.warn(`[update-user-role] Access denied for ${requesterUid} (Role: ${requesterRole})`);
      return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden: Only admins can change user roles.' }) };
    }

    // 4. Check target user exists
    const targetUserRef = db.collection('users').doc(targetUserId);
    const targetUserSnap = await targetUserRef.get();
    if (!targetUserSnap.exists) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Target user not found.' }) };
    }

    const oldRole = targetUserSnap.data()?.role || 'unknown';

    // 5. Perform role update
    await targetUserRef.update({ role: newRole });
    console.log(`[update-user-role] Admin ${requesterUid} changed role of ${targetUserId}: ${oldRole} → ${newRole}`);

    // 6. Write audit log (non-blocking — failure won't abort the role update)
    try {
      const auditLogRef = db.collection('audit_logs').doc();
      await auditLogRef.set({
        action: 'update_user_role',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        performedBy: requesterUid,
        targetUserId: targetUserId,
        oldRole: oldRole,
        newRole: newRole,
      });
      console.log(`[update-user-role] Audit log written: ${auditLogRef.id}`);
    } catch (auditErr) {
      console.error('[update-user-role] Audit log write failed (non-fatal):', auditErr);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Role updated successfully.',
        targetUserId,
        oldRole,
        newRole,
      }),
    };

  } catch (error: any) {
    console.error('[update-user-role] Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error.message || String(error),
      }),
    };
  }
};

export { handler };
