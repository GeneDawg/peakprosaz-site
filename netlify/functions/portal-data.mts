import type { Config } from "@netlify/functions";
import { allowedAccounts, handleError, json, readSession } from "../lib/portal.mts";
import { allJobs, toPortalJob, visibleJobs } from "../lib/jobs.mts";

// GET -> the jobs this session may see. Contractors see only their own; admin sees everything.
export default async (req: Request) => {
  try {
    const session = readSession(req);
    const accts = allowedAccounts(session, "all");
    const jobs = visibleJobs(await allJobs(), session, accts).map(toPortalJob);
    return json({ updated: new Date().toISOString(), jobs });
  } catch (e) {
    return handleError(e);
  }
};

export const config: Config = { path: "/api/portal/jobs", method: "GET" };
