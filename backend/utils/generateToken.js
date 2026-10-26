const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT token.
 * Accepts either an object (e.g. { id, name, email, role }) or a scalar id.
 *
 * @param {string|object} payloadOrId
 * @returns {string} signed JWT
 */
const generateToken = (payloadOrId) => {
  const secret = process.env.JWT_SECRET || "repairchain-default-jwt-secret-dev";
  let payload;

  if (typeof payloadOrId === "object" && payloadOrId !== null && !payloadOrId._bsontype) {
    payload = {
      id: payloadOrId.id || (payloadOrId._id ? payloadOrId._id.toString() : undefined),
      name: payloadOrId.name,
      email: payloadOrId.email,
      role: payloadOrId.role,
    };
  } else {
    payload = { id: payloadOrId ? payloadOrId.toString() : payloadOrId };
  }

  return jwt.sign(payload, secret, { expiresIn: "7d" });
};

module.exports = generateToken;
