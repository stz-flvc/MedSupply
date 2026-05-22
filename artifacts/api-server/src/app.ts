import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import router from "./routes";
import uploadsRouter from "./routes/uploads";
import { logger } from "./lib/logger";
import { createPool } from "@workspace/db";

// Create a DEDICATED pool for the session store so it can never exhaust
// the main application pool and cause all API requests to hang.
const sessionPool = createPool({
  max: 3,                    // tiny: sessions need very few connections
  idleTimeoutMillis: 30000,  // release idle connections after 30s
  connectionTimeoutMillis: 5000, // fail fast instead of hanging forever
});

// Ensure the session table exists for connect-pg-simple
sessionPool.query(`
  CREATE TABLE IF NOT EXISTS "session" (
    "sid" varchar NOT NULL,
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
  );
  CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
`).catch(err => {
  logger.error("Failed to ensure session table exists:", err);
});

const PgSession = ConnectPgSimple(session);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use((req, res, next) => { res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate"); next(); });
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

const sessionSecret = process.env.SESSION_SECRET || "medi-supply-dev-secret-change-in-prod";

// Trust proxy headers from Vercel/reverse proxies so secure cookies work
app.set("trust proxy", 1);

app.use(
  session({
    store: new PgSession({
      pool: sessionPool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

app.use("/api/uploads", express.static("uploads"));
app.use("/api", router);
app.use("/api", uploadsRouter);

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Not Found: ${req.method} ${req.url}` });
});

export default app;
