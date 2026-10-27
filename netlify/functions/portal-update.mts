import type { Config } from "@netlify/functions";
import { accounts, handleError, HttpError, json, readSession } from "../lib/portal.mts";
import { getJob, saveJob, toPortalJob, validDate } from "../lib/jobs.mts";

// Admin only. POST { id, account?, fulfilled?, invoice? } updates one job.
//   fulfilled: "YYYY-MM-DD" or null     invoice: { number, total, paid, date, paidDate } or null
export default async (req: Request) => {
  try {
    const s = readSession(req);
    if (s.role !== "admin") throw new HttpError(403, "Admins only.");
    const b = await req.json();
    const job = await getJob(String(b.id || ""));
    if (!job) throw new HttpError(404, "Job not found.");
    if (b.account !== undefined) {
      if (b.account !== "unassigned" && !accounts().some((a) => a.key === b.account)) throw new HttpError(400, "Unknown contractor.");
      job.account = b.account;
    }
    if (b.fulfilled !== undefined) job.fulfilled = validDate(b.fulfilled);
    if (b.invoice !== undefined) {
      if (b.invoice === null) job.invoice = null;
      else {
        const total = Number(b.invoice.total), paid = Number(b.invoice.paid || 0);
        if (!Number.isFinite(total) || total < 0 || !Number.isFinite(paid) || paid < 0) throw new HttpError(400, "Enter the invoice amounts as numbers.");
        job.invoice = {
          number: String(b.invoice.number || "").slice(0, 40),
          total, paid,
          date: validDate(b.invoice.date),
          paidDate: paid >= total ? validDate(b.invoice.paidDate) : null,
        };
      }
    }
    await saveJob(job);
    return json({ job: toPortalJob(job) });
  } catch (e) {
    return handleError(e);
  }
};

export const config: Config = { path: "/api/portal/update", method: "POST" };
