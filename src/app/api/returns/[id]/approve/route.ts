/**
 * POST /api/returns/[id]/approve
 * Validates current status is 'requested', then advances to 'approved'.
 * Returns updated Return as JSON, or 409 if status transition is invalid.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.return.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Return not found" }, { status: 404 });
  }

  if (existing.status !== "requested") {
    return NextResponse.json(
      { error: `Cannot approve return in status '${existing.status}'` },
      { status: 409 }
    );
  }

  const updated = await prisma.return.update({
    where: { id },
    data: { status: "approved" },
  });

  return NextResponse.json(updated);
}
