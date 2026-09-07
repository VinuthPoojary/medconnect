import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'medconnect_karavali_super_secret_jwt_key_2026';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};

/**
 * Enforces authenticated hospital session and extracts verified server-side hospitalId
 */
export const requireHospitalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No session token provided.',
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token. Please sign in again.',
      });
    }

    if (user.role !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Access restricted to authorized hospital accounts.',
      });
    }

    const hospitalId = user.hospitalId || user.hospital_id;
    if (!hospitalId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. No linked hospital account found in credentials.',
      });
    }

    // Attach server-verified user and hospitalId (Never trust client input)
    req.user = user;
    req.hospitalId = hospitalId;
    next();
  });
};

