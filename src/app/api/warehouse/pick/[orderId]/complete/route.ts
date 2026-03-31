/**
 * POST /api/warehouse/pick/[orderId]/complete
 * Completes the pick process for an order.
 * Verifies all items are picked, marks pick list complete,
 * advances order to 'packing', and deducts inventory (reserved → actual).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const pickList = await prisma.pickList.findUnique({
    where: { orderId },
    include: {
      items: {
        include: {
          orderItem: true,
        },
      },
    },
  });

  if (!pickList) {
    return NextResponse.json({ error: "Pick list not found" }, { status: 404 });
  }

  const allPicked = pickList.items.every((item) => item.picked);
  if (!allPicked) {
    return NextResponse.json({ error: "Not all items have been picked" }, { status: 400 });
  }

  // Update pick list status, order status, and inventory in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.pickList.update({
      where: { id: pickList.id },
      data: { status: "completed" },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: "packing" },
    });

    // For each picked item, convert reserved stock to actual deduction
    for (const item of pickList.items) {
      const sku = await tx.inventory.findFirst({
        where: { sku: { orderItems: { some: { id: item.orderItemId } } } },
      });
      if (sku) {
        await tx.inventory.update({
          where: { id: sku.id },
          data: {
            inStock: { decrement: item.orderItem.quantity },
            reserved: { decrement: item.orderItem.quantity },
          },
        });
      }
    }
  });

  return NextResponse.json({ success: true });
}
