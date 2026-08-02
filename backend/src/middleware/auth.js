import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  const secret = process.env.JWT_SECRET || 'medconnect_karavali_super_secret_jwt_key_2026';

  jwt.verify(token, secret, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};
