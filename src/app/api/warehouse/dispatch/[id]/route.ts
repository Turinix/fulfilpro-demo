/**
 * POST /api/warehouse/dispatch/[id]
 * Marks a single shipment as dispatched and updates the related order to 'shipped'.
 * [id] is the Shipment ID.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const shipment = await prisma.shipment.findUnique({ where: { id } });
  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.shipment.update({
      where: { id },
      data: { status: "dispatched" },
    }),
    prisma.order.update({
      where: { id: shipment.orderId },
      data: { status: "shipped" },
    }),
  ]);

  return NextResponse.json({ success: true });
}
