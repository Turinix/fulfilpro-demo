/**
 * POST /api/warehouse/pack/[orderId]/confirm
 * Confirms that the order has been packed and is ready for dispatch.
 * Updates shipment status to 'packed', order status to 'dispatched'.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shipment: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!order.shipment) {
    return NextResponse.json({ error: "Generate a shipping label first" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.shipment.update({
      where: { orderId },
      data: { status: "packed" },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: "dispatched" },
    }),
  ]);

  return NextResponse.json({ success: true });
}
