import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import path from "path";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

// ========== ENV VALIDATION ==========
if (!process.env.SESSION_SECRET) {
  console.warn("⚠️  WARNING: SESSION_SECRET is not set. Using insecure default — set this in production!");
}
if (!process.env.ADMIN_SECRET) {
  console.warn("⚠️  WARNING: ADMIN_SECRET is not set. The /api/auth/promote-admin endpoint will be non-functional.");
}
if (!process.env.DATABASE_URL) {
  console.error("❌ FATAL: DATABASE_URL is not set.");
  process.exit(1);
}
if (!process.env.DATABASE_URL.startsWith("postgres://") && !process.env.DATABASE_URL.startsWith("postgresql://")) {
  console.error("❌ FATAL: DATABASE_URL does not appear to be a valid PostgreSQL connection string.");
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Apply helmet security headers. In development, disable CSP so Vite HMR works.
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
  })
);

app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use(express.text({ type: "text/plain", limit: "10kb" }));

// ========== SITE PASSWORD GATE ==========
const SITE_PASSWORD = process.env.SITE_PASSWORD || "minime";
const GATE_COOKIE = "site_access";

app.use((req, res, next) => {
  // Skip for API routes and the password endpoint itself
  if (req.path.startsWith("/api") || req.path === "/__gate") return next();

  const cookies = req.headers.cookie || "";
  const hasAccess = cookies.split(";").some(c => c.trim() === `${GATE_COOKIE}=1`);
  if (hasAccess) return next();

  // Handle password form submission
  if (req.method === "POST" && req.body?.password === SITE_PASSWORD) {
    res.setHeader("Set-Cookie", `${GATE_COOKIE}=1; Path=/; HttpOnly; Max-Age=86400`);
    return res.redirect(req.body.returnTo || "/");
  }

  // Show password page
  const returnTo = req.path;
  res.status(401).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CourseMini by EQC Institute — Coming Soon</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f0f0f;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #fff;
    }
    .card {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 16px;
      padding: 48px 40px;
      width: 100%;
      max-width: 400px;
      text-align: center;
    }
    .logo {
      width: 56px; height: 56px;
      background: linear-gradient(135deg, #f97316, #ec4899);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
      font-size: 28px;
    }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    p { color: #888; font-size: 14px; margin-bottom: 32px; }
    input[type=password] {
      width: 100%;
      padding: 12px 16px;
      background: #111;
      border: 1px solid #333;
      border-radius: 8px;
      color: #fff;
      font-size: 16px;
      outline: none;
      margin-bottom: 12px;
      transition: border-color 0.2s;
    }
    input[type=password]:focus { border-color: #f97316; }
    button {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #f97316, #ec4899);
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.9; }
    .error { color: #ef4444; font-size: 13px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🎓</div>
    <h1>CourseMini</h1>
    <p style="font-size:11px;color:#555;margin-bottom:4px;margin-top:-16px;">by EQC Institute</p>
    <p>This site is in private beta. Enter the access code to continue.</p>
    <form method="POST">
      <input type="hidden" name="returnTo" value="${returnTo}" />
      <input type="password" name="password" placeholder="Enter access code" autofocus />
      <button type="submit">Enter</button>
    </form>
  </div>
</body>
</html>`);
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const { seedDatabase } = await import("./seed");
  await seedDatabase();
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // Serve uploaded files
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
