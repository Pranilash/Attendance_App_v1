import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";

// Rate limiting configuration
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    statusCode: 429,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests from this IP, please try again later.",
      statusCode: 429,
    });
  },
});

// Stricter rate limit for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes.",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limit for attendance marking (prevent spam)
export const attendanceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 attendance attempts per minute
  message: {
    success: false,
    message: "Too many attendance attempts, please wait before trying again.",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for QR verification
export const qrVerificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 QR verification attempts per minute
  message: {
    success: false,
    message: "Too many QR verification attempts, please wait before trying again.",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helmet security configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

// CORS configuration
export const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:3000",
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-Refresh-Token",
  ],
  exposedHeaders: ["X-Total-Count", "X-Page", "X-Per-Page"],
  maxAge: 86400, // 24 hours
};

// Data sanitization against NoSQL query injection
export const sanitizeData = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (key.startsWith("$") || key.includes(".")) {
          delete obj[key];
        } else if (typeof obj[key] === "object") {
          sanitize(obj[key]);
        }
      }
    }
  };

  sanitize(req.body);
  sanitize(req.params);
  sanitize(req.query);
  next();
};

// Prevent parameter pollution
export const preventParameterPollution = (req, res, next) => {
  const allowedDuplicates = ["sort", "select", "page", "limit"];

  for (const key in req.query) {
    if (Array.isArray(req.query[key]) && !allowedDuplicates.includes(key)) {
      req.query[key] = req.query[key][0];
    }
  }
  next();
};

// Request logger middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    };

    // Log to console (in production, use a proper logging service)
    if (process.env.NODE_ENV === "development") {
      console.log(`[${logData.timestamp}] ${logData.method} ${logData.url} - ${logData.status} (${logData.duration})`);
    }
  });

  next();
};

// IP whitelist middleware (optional)
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) return next();

    const clientIP = req.ip || req.connection.remoteAddress;

    if (allowedIPs.includes(clientIP)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: "Access denied. IP not whitelisted.",
        statusCode: 403,
      });
    }
  };
};

// XSS protection middleware
export const xssProtection = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== "string") return str;
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
    };
    return str.replace(/[&<>"']/g, (char) => map[char]);
  };

  const sanitizeObject = (obj) => {
    if (typeof obj === "string") {
      return sanitizeString(obj);
    }
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (typeof obj[key] === "string") {
          obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === "object") {
          sanitizeObject(obj[key]);
        }
      }
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.params = sanitizeObject(req.params);
  req.query = sanitizeObject(req.query);

  next();
};

export default {
  apiLimiter,
  authLimiter,
  attendanceLimiter,
  qrVerificationLimiter,
  securityHeaders,
  corsOptions,
  sanitizeData,
  preventParameterPollution,
  requestLogger,
  ipWhitelist,
  xssProtection,
};