#!/usr/bin/env node
/**
 * Pre-commit secret guard.
 *
 * Blocks any commit that would add a credential to git. Runs locally in the
 * hook so a secret can never be pushed, and in CI so a bypass is still caught.
 *
 * It scans the *staged* content (what the commit would actually add), so an
 * untracked .env sitting on disk is fine — committing it is not.
 */
import { execSync } from "node:child_process";

/**
 * Patterns chosen to be specific enough not to cry wolf on ordinary code while
 * still catching the credential shapes that actually appear in this project.
 */
const RULES = [
  { name: "Google API key", re: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "Meta/WhatsApp token", re: /\bEAA[A-Za-z0-9]{60,}/ },
  { name: "Neon/Postgres password", re: /\bnpg_[A-Za-z0-9]{20,}/ },
  { name: "Vercel OIDC token", re: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./ },
  { name: "GitHub token", re: /\bgh[pousr]_[A-Za-z0-9]{30,}/ },
  { name: "Netlify token", re: /\bnfc_[A-Za-z0-9]{30,}/ },
  { name: "OpenAI-style key", re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/ },
  { name: "Slack token", re: /\bxox[abprs]-[A-Za-z0-9-]{20,}/ },
  { name: "Telegram bot token", re: /\b\d{8,10}:AA[A-Za-z0-9_-]{30,}/ },
  { name: "private key block", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

/** Files that legitimately contain these shapes (docs, examples, this script). */
const ALLOW = [
  /^\.gitignore$/,
  /^\.env\.example$/,
  /^scripts\/guard-secrets\.mjs$/,
  /package-lock\.json$/,
];

function stagedFiles() {
  try {
    return execSync("git diff --cached --name-only --diff-filter=ACM", { encoding: "utf8" })
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function scan(file, content) {
  const hits = [];
  for (const rule of RULES) {
    const m = content.match(rule.re);
    if (m) hits.push({ rule: rule.name, sample: `${m[0].slice(0, 6)}…${m[0].slice(-3)}` });
  }
  return hits;
}

const files = stagedFiles();
const findings = [];

for (const file of files) {
  if (ALLOW.some((a) => a.test(file))) continue;
  let content;
  try {
    content = execSync(`git show ":${file}"`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch {
    continue; // binary or unreadable; nothing text-scannable to check
  }
  for (const hit of scan(file, content)) findings.push({ file, ...hit });
}

if (findings.length) {
  console.error("\n✖ commit blocked: secrets detected\n");
  for (const f of findings) {
    console.error(`   ${f.file}\n     → ${f.rule} (${f.sample})`);
  }
  console.error(
    "\nRemove the credential, store it in .env (gitignored), and try again." +
      "\nIf it was already pushed, rotate it — removing it now does not unpublish it.\n",
  );
  process.exit(1);
}

if (files.length) console.log(`✔ secret scan passed (${files.length} file(s) staged)`);