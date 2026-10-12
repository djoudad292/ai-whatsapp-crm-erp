/**
 * Netlify Function entry for the NestJS backend.
 *
 * The whole app is exported once (warm) and reused across invocations, so cold
 * starts cost one Nest bootstrap rather than one per request. serverless-http
 * adapts the Express instance Netlify exposes to the function signature.
 */
import type { Handler } from "@netlify/functions";
import { NestFactory } from "@nestjs/core";
import serverless from "serverless-http";
import { AppModule } from "../../apps/backend/dist/app.module";

let handlerPromise: Promise<Handler> | null = null;

async function createHandler(): Promise<Handler> {
  const app = await NestFactory.create(AppModule, { logger: ["error", "warn"] });
  app.enableCors({ origin: true });
  await app.init();
  const express = app.getHttpAdapter().getInstance();
  return serverless(express) as unknown as Handler;
}

export const handler: Handler = async (event, context) => {
  if (!handlerPromise) handlerPromise = createHandler();
  const fn = await handlerPromise;
  return fn(event, context);
};