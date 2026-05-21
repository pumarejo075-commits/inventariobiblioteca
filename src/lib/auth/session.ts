import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AppRole } from "@/types/database";
import { SESSION_COOKIE } from "./constants";

export { SESSION_COOKIE };

export interface SessionPayload {
  sub: string;
  email: string;
  role: AppRole;
  full_name: string | null;
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    full_name: payload.full_name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as AppRole,
      full_name: (payload.full_name as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function canWrite(role: AppRole) {
  return role === "admin" || role === "operator";
}

export function isAdmin(role: AppRole) {
  return role === "admin";
}
