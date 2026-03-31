/**
 * POST /api/production/[id]/start
 * Transitions a ProductionJob from 'queued' to 'in_production'.
 * Sets startedAt to now. Validates current status before updating.
 * Returns updated ProductionJob as JSON.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await prisma.productionJob.findUnique({ where: { id } });

  if (!job) {
    return NextResponse.json({ error: "Production job not found" }, { status: 404 });
  }

  if (job.status !== "queued") {
    return NextResponse.json(
      { error: `Cannot start job in status '${job.status}'` },
      { status: 409 }
    );
  }

  const updated = await prisma.productionJob.update({
    where: { id },
    data: { status: "in_production", startedAt: new Date() },
  });

  return NextResponse.json(updated);
}
