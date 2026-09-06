import { admin } from '../firebaseAdmin.js';

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // contains uid, email, etc.
    next();
  } catch (error) {
    console.error('Auth token verification failed');
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
