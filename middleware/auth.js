import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization; // standard way

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ msg: "Authorization header missing or invalid" });
    }

    const token = authHeader.split(" ")[1]; // safer way to extract token

    if (!token) {
      return res.status(401).json({ msg: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ msg: "Token verification failed" });
    }

    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res
      .status(401)
      .json({ msg: "Invalid or expired token, please login again" });
  }
};

export default auth;
