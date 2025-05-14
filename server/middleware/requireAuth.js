const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] REQUIRE_AUTH: Entered for ${req.method} ${req.originalUrl}`);
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    console.log(`[${new Date().toISOString()}] REQUIRE_AUTH: Auth header: ${authHeader ? 'Present' : 'Missing or undefined'}`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`[${new Date().toISOString()}] REQUIRE_AUTH: Authorization header missing or invalid format.`);
      return res.status(401).json({ error: 'No token provided. Please log in again.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log(`[${new Date().toISOString()}] REQUIRE_AUTH: Token is empty after splitting.`);
      return res.status(401).json({ error: 'Invalid token format. Please log in again.' });
    }
    
    // Log a masked version of the token for debugging
    if (token.length > 10) {
      console.log(`[${new Date().toISOString()}] REQUIRE_AUTH: Token received (first 10 chars): ${token.substring(0, 10)}...`);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`[${new Date().toISOString()}] REQUIRE_AUTH: Token verified successfully for user ID: ${decoded.id}`);
      
      // Ensure req.user has consistent id fields
      req.user = {
        ...decoded,
        id: decoded.id || decoded._id, // Use either id or _id, ensuring 'id' is always set
      };
      
      console.log(`[${new Date().toISOString()}] REQUIRE_AUTH: req.user set. Proceeding to next middleware/route.`);
      next();
    } catch (err) {
      console.error(`[${new Date().toISOString()}] REQUIRE_AUTH: Token verification error: ${err.message}`, err);
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] REQUIRE_AUTH: Outer catch block error: ${err.message}`, err);
    return res.status(500).json({ error: 'Authentication process failed' });
  }
};