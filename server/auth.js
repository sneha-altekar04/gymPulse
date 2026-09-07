import { getAdminAuth, getAdminDb } from './firebaseAdmin.js';

const ALLOWED_MESSAGING_ROLES = new Set(['OWNER', 'MANAGER', 'RECEPTIONIST']);

export async function requireMessagingUser(request) {
  const authorization = request.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    const error = new Error('Authentication required.');
    error.statusCode = 401;
    throw error;
  }

  const decodedToken = await getAdminAuth().verifyIdToken(authorization.slice(7));
  const userSnapshot = await getAdminDb().doc(`users/${decodedToken.uid}`).get();
  const user = userSnapshot.data();

  if (!user?.gymId || !ALLOWED_MESSAGING_ROLES.has(user.role)) {
    const error = new Error('You do not have permission to send messages.');
    error.statusCode = 403;
    throw error;
  }

  return { uid: decodedToken.uid, gymId: user.gymId, role: user.role };
}

export function requireCronSecret(request) {
  const configuredSecret = process.env.CRON_SECRET;
  const authorization = request.headers.authorization || '';
  if (!configuredSecret || authorization !== `Bearer ${configuredSecret}`) {
    const error = new Error('Unauthorized cron request.');
    error.statusCode = 401;
    throw error;
  }
}