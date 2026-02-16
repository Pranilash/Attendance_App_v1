import crypto from "crypto";
import QRCode from "qrcode";

/**
 * QR Code Generation and Verification Utility
 * 
 * This utility handles the creation and verification of HMAC-signed QR codes
 * for secure attendance marking with anti-replay protection.
 */

// Configuration
const QR_REFRESH_INTERVAL = parseInt(process.env.QR_REFRESH_INTERVAL) || 15; // seconds
const QR_SECRET_SALT = process.env.QR_SECRET_SALT || "default-qr-salt-change-in-production";

/**
 * Generate a unique session token
 * @returns {string} Random session token
 */
export const generateSessionToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Generate a QR secret for a session
 * @param {string} sessionId - Session ID
 * @returns {string} QR secret key
 */
export const generateQRSecret = (sessionId) => {
  const baseSecret = crypto.randomBytes(64).toString("hex");
  const derivedSecret = crypto
    .createHmac("sha256", QR_SECRET_SALT)
    .update(sessionId + baseSecret)
    .digest("hex");
  return derivedSecret;
};

/**
 * Generate QR payload with HMAC signature
 * @param {string} sessionId - Session ID
 * @param {string} qrSecret - QR secret for the session
 * @param {number} timestamp - Unix timestamp (optional, defaults to now)
 * @returns {Object} QR payload object
 */
export const generateQRPayload = (sessionId, qrSecret, timestamp = null) => {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  
  const payload = {
    sessionId: sessionId,
    timestamp: ts,
  };

  // Create HMAC signature
  const dataToSign = payload.sessionId + ":" + payload.timestamp;
  const signature = crypto
    .createHmac("sha256", qrSecret)
    .update(dataToSign)
    .digest("hex");

  return {
    ...payload,
    signature: signature,
  };
};

/**
 * Generate QR code as data URL
 * @param {string} sessionId - Session ID
 * @param {string} qrSecret - QR secret for the session
 * @returns {Promise<{payload: Object, qrDataUrl: string, expiresAt: Date}>}
 */
export const generateQRCode = async (sessionId, qrSecret) => {
  const payload = generateQRPayload(sessionId, qrSecret);
  
  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });

  // Calculate expiry time
  const expiresAt = new Date((payload.timestamp + QR_REFRESH_INTERVAL) * 1000);

  return {
    payload,
    qrDataUrl,
    expiresAt,
    refreshInterval: QR_REFRESH_INTERVAL,
  };
};

/**
 * Generate multiple QR codes for display (current + next)
 * @param {string} sessionId - Session ID
 * @param {string} qrSecret - QR secret for the session
 * @returns {Promise<Object>} Object with current and next QR codes
 */
export const generateQRCodeSequence = async (sessionId, qrSecret) => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  
  const currentQR = await generateQRCode(sessionId, qrSecret);
  
  // Pre-generate next QR code (for smooth transition)
  const nextTimestamp = currentTimestamp + QR_REFRESH_INTERVAL;
  const nextPayload = generateQRPayload(sessionId, qrSecret, nextTimestamp);
  const nextQRDataUrl = await QRCode.toDataURL(JSON.stringify(nextPayload), {
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });

  return {
    current: currentQR,
    next: {
      payload: nextPayload,
      qrDataUrl: nextQRDataUrl,
      expiresAt: new Date((nextTimestamp + QR_REFRESH_INTERVAL) * 1000),
    },
    refreshInterval: QR_REFRESH_INTERVAL,
  };
};

/**
 * Verify QR payload
 * @param {Object} payload - QR payload to verify
 * @param {string} qrSecret - QR secret for the session
 * @param {number} refreshInterval - Allowed time window (seconds)
 * @returns {Object} Verification result
 */
export const verifyQRPayload = (payload, qrSecret, refreshInterval = QR_REFRESH_INTERVAL) => {
  const { sessionId, timestamp, signature } = payload;
  const currentTime = Math.floor(Date.now() / 1000);

  // Check if all required fields are present
  if (!sessionId || !timestamp || !signature) {
    return {
      valid: false,
      reason: "Invalid QR code format. Missing required fields.",
    };
  }

  // Check timestamp type
  if (typeof timestamp !== "number" || timestamp <= 0) {
    return {
      valid: false,
      reason: "Invalid timestamp in QR code.",
    };
  }

  // Check timestamp (within refresh interval)
  const timeDiff = Math.abs(currentTime - timestamp);
  if (timeDiff > refreshInterval) {
    return {
      valid: false,
      reason: "QR code has expired. Please scan the latest QR code.",
      timeDiff,
      allowedWindow: refreshInterval,
    };
  }

  // Verify signature
  const dataToSign = sessionId + ":" + timestamp;
  const expectedSignature = crypto
    .createHmac("sha256", qrSecret)
    .update(dataToSign)
    .digest("hex");

  if (signature !== expectedSignature) {
    return {
      valid: false,
      reason: "Invalid QR code signature. QR code may have been tampered with.",
    };
  }

  return {
    valid: true,
    sessionId,
    timestamp,
    verifiedAt: new Date(),
  };
};

/**
 * Create a signed QR token for embedding in URLs
 * @param {string} sessionId - Session ID
 * @param {string} qrSecret - QR secret
 * @returns {string} Signed token
 */
export const createSignedQRToken = (sessionId, qrSecret) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const data = sessionId + ":" + timestamp;
  const signature = crypto
    .createHmac("sha256", qrSecret)
    .update(data)
    .digest("hex");

  return Buffer.from(JSON.stringify({
    s: sessionId,
    t: timestamp,
    x: signature,
  })).toString("base64url");
};

/**
 * Parse and verify a signed QR token
 * @param {string} token - Signed token
 * @param {string} qrSecret - QR secret
 * @returns {Object} Verification result
 */
export const parseSignedQRToken = (token, qrSecret) => {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString());
    return verifyQRPayload({
      sessionId: decoded.s,
      timestamp: decoded.t,
      signature: decoded.x,
    }, qrSecret);
  } catch (error) {
    return {
      valid: false,
      reason: "Invalid token format",
    };
  }
};

/**
 * Calculate time until next QR refresh
 * @param {number} timestamp - Current QR timestamp
 * @returns {number} Milliseconds until next refresh
 */
export const getTimeUntilRefresh = (timestamp) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const nextRefresh = timestamp + QR_REFRESH_INTERVAL;
  const remaining = (nextRefresh - currentTime) * 1000;
  return Math.max(0, remaining);
};

export default {
  generateSessionToken,
  generateQRSecret,
  generateQRPayload,
  generateQRCode,
  generateQRCodeSequence,
  verifyQRPayload,
  createSignedQRToken,
  parseSignedQRToken,
  getTimeUntilRefresh,
};