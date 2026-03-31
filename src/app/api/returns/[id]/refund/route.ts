/**
 * POST /api/returns/[id]/refund
 * Validates current status is 'received', then advances to 'refunded'.
 * Also updates the associated order status to 'return_requested' to reflect the closed return loop.
 * Returns updated Return as JSON.
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

  if (existing.status !== "received") {
    return NextResponse.json(
      { error: `Cannot refund return in status '${existing.status}'` },
      { status: 409 }
    );
  }

  const [updated] = await Promise.all([
    prisma.return.update({
      where: { id },
      data: { status: "refunded" },
    }),
    prisma.order.update({
      where: { id: existing.orderId },
      data: { status: "return_requested" },
    }),
  ]);

  return NextResponse.json(updated);
}
