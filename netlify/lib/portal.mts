// Shared helpers for the Peak 301 referral partner portal.
// Secrets live only in Netlify environment variables, never in this repo:
//   PORTAL_ACCOUNTS        JSON list of partner accounts: [{key,name,prefix,contact,code}]
//   PORTAL_ADMIN_CODE      Peak 301 Pros admin access code (sees every partner)
//   PORTAL_SESSION_SECRET  random string used to sign sign-in sessions
import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_HOURS = 12;

export type Account = { key: string; name: string; prefix: string; contact?: string; code: string; sources?: string[]; contactNames?: string[]; emailDomains?: string[]; contactId?: string; estimateTemplateId?: string; invoiceTemplateId?: string; service?: "peak" | "full" };
// v = fingerprint of the code used to sign in. Changing a partner's code in PORTAL_ACCOUNTS (or the admin code)
// ends every session made with the old code on the next request.
// j = set only on short-lived file links (one job, a few minutes), so those links can never act as a full sign-in.
export type Session = { role: "admin" | "partner"; key?: string; exp: number; v?: string; j?: string };

export function env(name: string): string {
  const v = Netlify.env.get(name);
  if (!v) throw new HttpError(500, `The portal is missing its ${name} setting.`);
  return v;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export function handleError(e: unknown): Response {
  if (e instanceof HttpError) return json({ error: e.message }, e.status);
  console.error(e);
  return json({ error: "Something went wrong loading the portal. Please try again in a minute." }, 500);
}

/* ---------- accounts & sessions ---------- */

export function accounts(): Account[] {
  try {
    const list = JSON.parse(env("PORTAL_ACCOUNTS"));
    if (!Array.isArray(list)) throw new Error("not a list");
    return list;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(500, "The portal's PORTAL_ACCOUNTS setting is not valid.");
  }
}

// Codes are compared on letters and digits only, so pasted codes still match when they carry spaces,
// long/curly dashes, no dashes, or invisible characters picked up from an email or chat.
const canon = (c: string) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(canon(a));
  const y = Buffer.from(canon(b));
  if (!x.length || !y.length) return false;
  return x.length === y.length && timingSafeEqual(x, y);
}

const codePrint = (code: string) => createHmac("sha256", env("PORTAL_SESSION_SECRET")).update("code:" + canon(code)).digest("base64url").slice(0, 12);

export function matchCode(code: string): Session | null {
  const exp = Date.now() + SESSION_HOURS * 3600_000;
  if (safeEqual(code, env("PORTAL_ADMIN_CODE"))) return { role: "admin", exp, v: codePrint(env("PORTAL_ADMIN_CODE")) };
  const acct = accounts().find((a) => safeEqual(code, a.code));
  return acct ? { role: "partner", key: acct.key, exp, v: codePrint(acct.code) } : null;
}

const b64u = (s: string | Buffer) => Buffer.from(s).toString("base64url");
const sign = (body: string) => createHmac("sha256", env("PORTAL_SESSION_SECRET")).update(body).digest("base64url");

export function makeToken(s: Session): string {
  const body = b64u(JSON.stringify(s));
  return `${body}.${sign(body)}`;
}

export function readSession(req: Request): Session {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const [body, sig] = token.split(".");
  if (!body || !sig) throw new HttpError(401, "Please sign in with your access code.");
  const good = sign(body);
  if (good.length !== sig.length || !timingSafeEqual(Buffer.from(good), Buffer.from(sig)))
    throw new HttpError(401, "Please sign in with your access code.");
  const s: Session = JSON.parse(Buffer.from(body, "base64url").toString());
  if (s.exp < Date.now()) throw new HttpError(401, "Your session ended. Please sign in again.");
  if (s.j) throw new HttpError(401, "Please sign in with your access code.");
  // The code behind this session must still be current, and the partner must still exist.
  const current = s.role === "admin" ? env("PORTAL_ADMIN_CODE") : accounts().find((a) => a.key === s.key)?.code;
  if (!current || s.v !== codePrint(current)) throw new HttpError(401, "Your access code has changed. Please sign in again.");
  return s;
}

/** A link for one job's file, good for 3 minutes. Used on iPhone, where Safari needs a real web address to open a PDF. */
export function makeFileTicket(s: Session, jnid: string): string {
  return makeToken({ ...s, j: jnid, exp: Math.min(s.exp, Date.now() + 3 * 60_000) });
}

/** Checks a file link from makeFileTicket and returns its session, or null if it's expired or for another job. */
export function readFileTicket(ticket: string, jnid: string): Session | null {
  const [body, sig] = String(ticket || "").split(".");
  if (!body || !sig) return null;
  const good = sign(body);
  if (good.length !== sig.length || !timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null;
  let s: Session;
  try { s = JSON.parse(Buffer.from(body, "base64url").toString()); } catch { return null; }
  if (!s.j || s.j !== jnid || s.exp < Date.now()) return null;
  const current = s.role === "admin" ? env("PORTAL_ADMIN_CODE") : accounts().find((a) => a.key === s.key)?.code;
  if (!current || s.v !== codePrint(current)) return null;
  return s;
}

/** Same checks as readSession, for a token passed some other way (e.g. inside a form submission). */
export function sessionFromToken(token: string): Session | null {
  try {
    return readSession(new Request("https://x/", { headers: { authorization: `Bearer ${token}` } }));
  } catch {
    return null;
  }
}

/** Accounts this session may see. Partners only ever get their own. */
export function allowedAccounts(s: Session, requested?: string | null): Account[] {
  const all = accounts();
  if (s.role === "partner") return all.filter((a) => a.key === s.key);
  if (!requested || requested === "all") return all;
  const one = all.filter((a) => a.key === requested);
  if (!one.length) throw new HttpError(404, "That contractor account was not found.");
  return one;
}

export function publicAccount(a: Account) {
  return { key: a.key, name: a.name, prefix: a.prefix, contact: a.contact || a.name };
}
