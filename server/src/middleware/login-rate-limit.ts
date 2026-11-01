import type { RequestHandler } from "express";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

const attemptsByAddress = new Map<string, { count: number; resetAt: number }>();

export const loginRateLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  const address = req.ip ?? req.socket.remoteAddress ?? "unknown";
  let bucket = attemptsByAddress.get(address);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    attemptsByAddress.set(address, bucket);
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    res.setHeader(
      "Retry-After",
      String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))),
    );
    res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many sign-in attempts. Try again in 15 minutes.",
      },
    });
    return;
  }

  bucket.count += 1;
  next();
};
