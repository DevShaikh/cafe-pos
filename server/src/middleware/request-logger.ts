import type { RequestHandler } from "express";

const requestLogger: RequestHandler = (request, response, next) => {
  const requestPath = request.path;
  const startedAt = process.hrtime.bigint();

  response.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    console.info(
      `${request.method} ${requestPath} ${response.statusCode} ${durationMs.toFixed(1)}ms`,
    );
  });

  next();
};

export default requestLogger;
