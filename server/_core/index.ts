import express from "express";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import { createContext } from "./context";
import { appRouter } from "../routers/index";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for frontend
app.use(cors({
  origin: true, // In production, set this to your app's origin
  credentials: true,
}));

// Increase body size limit for large base64 uploads (like logos)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// TRPC middleware
app.use(
  "/api/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`[Server] TRPC API server running at http://localhost:${port}/api/trpc`);
  console.log(`[Server] Registered procedures: ${Object.keys(appRouter._def.procedures).join(", ")}`);
});

