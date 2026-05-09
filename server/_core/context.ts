import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createClient } from "@supabase/supabase-js";
import * as jose from "jose";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_nkw_care");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function createContext({ req, res }: CreateExpressContextOptions) {
  // Extract user from token if available
  const authHeader = req.headers.authorization;
  let user = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      user = payload as any;
    } catch (e) {
      // console.error("JWT verification failed:", e);
    }
  }

  return {
    req,
    res,
    supabase,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
