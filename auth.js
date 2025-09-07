import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({ msg: "No Authorization header provided" });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ msg: "Authorization format must be Bearer <token>" });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({ msg: "No token, authorization denied" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      res.status(401).json({ msg: "Please login first" });
      return;
    }

    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };

    next();
  } catch (error) {
    return res.status(500).json({ msg: "Server error in auth middleware" });
  }
};

export default auth;
