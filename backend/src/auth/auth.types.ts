/**
 * Roles understood by the auth module.
 *
 * ADMIN   — full access (writes + admin ops).
 * OPERATOR — operational writes (orders / approvals).
 * VIEWER  — read-only.
 */
export type Role = "ADMIN" | "OPERATOR" | "VIEWER";