/**
 * POST /api/warehouse/dispatch/bulk
 * Dispatches all shipments currently in 'packed' status.
 * Updates each shipment to 'dispatched' and its related order to 'shipped'.
 * Returns the count of dispatched shipments.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const packedShipments = await prisma.shipment.findMany({
    where: { status: "packed" },
    select: { id: true, orderId: true },
  });

  if (packedShipments.length === 0) {
    return NextResponse.json({ success: true, dispatched: 0 });
  }

  const shipmentIds = packedShipments.map((s) => s.id);
  const orderIds = packedShipments.map((s) => s.orderId);

  await prisma.$transaction([
    prisma.shipment.updateMany({
      where: { id: { in: shipmentIds } },
      data: { status: "dispatched" },
    }),
    prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status: "shipped" },
    }),
  ]);

  return NextResponse.json({ success: true, dispatched: packedShipments.length });
}
