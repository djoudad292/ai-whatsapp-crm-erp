/**
 * Vercel serverless entry for the NestJS backend.
 *
 * Vercel's Node runtime invokes this default export per request. Nest is booted
 * once and the Express instance is reused across warm invocations, so cold
 * starts cost a single app bootstrap rather than one per request.
 */
import { NestFactory } from "@nestjs/core";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "../apps/backend/dist/app.module";

type ExpressApp = (req: Request, res: Response, next?: NextFunction) => void;

let bootstrapPromise: Promise<ExpressApp> | null = null;

function bootstrap(): Promise<ExpressApp> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const app = await NestFactory.create(AppModule, { logger: ["log", "error", "warn"] });
      app.enableCors({ origin: true });
      await app.init();
      return app.getHttpAdapter().getInstance() as ExpressApp;
    })();
  }
  return bootstrapPromise;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const express = await bootstrap();
    express(req, res);
  } catch (error) {
    console.error("[api] bootstrap failed", error);
    if (!res.headersSent) {
      res.status(500).json({ status: "error", message: "Backend failed to start" });
    }
  }
}