// Peak 301 Pros Arizona job tracker. Jobs live in Netlify Blobs (this site's own storage), not in any CRM.
// When the new operator CRM is ready, jobs can be exported from here and the dashboard pointed at it.
import { getStore } from "@netlify/blobs";
import { HttpError, type Account, type Session } from "./portal.mts";

export type Invoice = { number: string; total: number; paid: number; date: string | null; paidDate: string | null };
export type JobRecord = {
  id: string;
  account: string; // partner key, or "unassigned" when the form arrived without a valid partner sign-in
  number: string;
  owner: string;
  address: string;
  assigned: string; // YYYY-MM-DD
  fulfilled: string | null;
  invoice: Invoice | null;
  details: string; // everything the contractor typed on the form
  created: number;
};

const store = () => getStore({ name: "az-jobs", consistency: "strong" });
const ymd = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d);

export async function saveJob(rec: JobRecord) {
  await store().setJSON(`job-${rec.id}`, rec);
}

export async function allJobs(): Promise<JobRecord[]> {
  const s = store();
  const { blobs } = await s.list({ prefix: "job-" });
  const rows = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" }).catch(() => null)));
  return (rows.filter(Boolean) as JobRecord[]).sort((a, b) => b.created - a.created);
}

export async function getJob(id: string): Promise<JobRecord | null> {
  return ((await store().get(`job-${id}`, { type: "json" })) as JobRecord | null) || null;
}

export function newJob(partial: Pick<JobRecord, "account" | "owner" | "address" | "details">): JobRecord {
  const created = Date.now();
  const id = `${created.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const number = `AZ-${ymd().replace(/-/g, "").slice(2)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  return { id, number, assigned: ymd(), fulfilled: null, invoice: null, created, ...partial };
}

/** The shape the dashboard already understands. */
export function toPortalJob(r: JobRecord) {
  const inv = r.invoice;
  return {
    jnid: r.id,
    account: r.account,
    number: r.number,
    owner: r.owner,
    address: r.address,
    status: inv ? (inv.paid >= inv.total ? "Paid" : "Invoiced") : r.fulfilled ? "Completed" : "Assigned",
    assigned: r.assigned,
    fulfilled: r.fulfilled,
    details: r.details,
    files: { invoices: [], reports: [], photos: [] },
    invoice: inv
      ? {
          processing: false,
          clearsOn: null,
          numbers: inv.number ? [inv.number] : [],
          total: inv.total,
          paid: inv.paid,
          due: Math.max(0, Math.round((inv.total - inv.paid) * 100) / 100),
          date: inv.date,
          paidDate: inv.paidDate,
          isPaid: inv.total >= 0 && inv.paid >= inv.total,
        }
      : null,
  };
}

export function visibleJobs(rows: JobRecord[], s: Session, accts: Account[]) {
  if (s.role === "admin") return rows;
  const keys = new Set(accts.map((a) => a.key));
  return rows.filter((r) => keys.has(r.account));
}

export function validDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new HttpError(400, "Dates must look like 2026-10-31.");
  return v;
}
