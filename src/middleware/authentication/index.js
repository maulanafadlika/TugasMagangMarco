const { UserModel } = require("../../models");
const { ResponseHandler, verifyToken, CryptingTool } = require("../../utils");
const { dateNow } = require("../../utils/dateTime");
const jwt = require("jsonwebtoken");

const User = new UserModel();

class AuthenticationMiddleware {
  static async auth(req, res, next) {
    const bearerToken = req.headers["authorization"];
    if (!bearerToken) {
      return ResponseHandler.error(res, "credentials mandatory", "", 401);
    }

    let [bearer, token] = bearerToken.split(" ");

    if (bearer !== "Bearer" || !token) {
      return ResponseHandler.error(res, "Invalid token format", "", 401);
    }

    try {
      const decodedJwt = verifyToken(token, process.env.JWT_SECRET); // valid token
      const decryptedPayload = CryptingTool.decrypt(decodedJwt.payload);
      const parsedPayload = JSON.parse(decryptedPayload);
      req.tokenUser = token
      req.userData = parsedPayload;
      
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        try {
          const decoded = jwt.decode(token);
          if (decoded?.payload) {
            const decryptedPayload = CryptingTool.decrypt(decoded.payload);
            const parsedPayload = JSON.parse(decryptedPayload);
            await User.updateLogout(parsedPayload.id);
          }
        } catch (innerError) {
          console.error("Failed to handle expired token cleanup:", innerError);
        }
        return ResponseHandler.error(res, "Token expired", "", 401);
      }

      console.log(error);
      return ResponseHandler.error(res, error.message ?? "internal server error", error, 401);
    }
  }
}

module.exports = AuthenticationMiddleware;
