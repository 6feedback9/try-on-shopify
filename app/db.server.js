import { PrismaClient } from "@prisma/client";

// This is this app's OWN Prisma client, pointed at its OWN database
// (DATABASE_URL). It has nothing to do with Lumi Frame's own database —
// see app/lumiframe.server.js for the only place this app talks to Lumi
// Frame, and that's a plain HTTP call, not a shared connection.
const global_ = globalThis;

if (!global_.prismaGlobal) {
  global_.prismaGlobal = new PrismaClient();
}

const prisma = global_.prismaGlobal;

export default prisma;
