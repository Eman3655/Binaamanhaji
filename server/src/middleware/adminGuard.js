// middleware/adminGuard.js
import jwt from 'jsonwebtoken';

const {
  ADMIN_TOKEN_SECRET = 'change_me_please',
} = process.env;

export default function adminGuard(req, res, next) {
  const token = req.cookies?.admin_token;
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const payload = jwt.verify(token, ADMIN_TOKEN_SECRET);
    if (payload?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.admin = payload; 
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}




