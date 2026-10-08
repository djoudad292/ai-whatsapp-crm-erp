/**
 * Seeded in-memory users. In a real system these would live in the DB; this
 * is the minimal auth module for Phase 9 and is replaced by a real user store
 * before production.
 */
import { Role } from "./auth.types";

export interface UserRecord {
  sub: string;
  username: string;
  password: string;
  role: Role;
}

export const USERS: UserRecord[] = [
  { sub: "user-admin", username: "admin", password: "admin", role: "ADMIN" },
  { sub: "user-operator", username: "operator", password: "operator", role: "OPERATOR" },
  { sub: "user-viewer", username: "viewer", password: "viewer", role: "VIEWER" },
];

export function findUser(username: string, password: string): UserRecord | undefined {
  return USERS.find((u) => u.username === username && u.password === password);
}