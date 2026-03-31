/**
 * POST /api/production/[id]/complete
 * Marks a ProductionJob as 'ready'. Transitions order to 'picking'.
 * Creates PickList + PickListItems for the order.
 * Restocks inventory: increments inStock by the produced quantities.
 * Validates current status before updating.
 * Returns updated ProductionJob as JSON.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await prisma.productionJob.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          items: {
            include: {
              sku: { include: { inventory: true } },
            },
          },
          pickList: true,
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Production job not found" }, { status: 404 });
  }

  if (job.status !== "in_production") {
    return NextResponse.json(
      { error: `Cannot complete job in status '${job.status}'` },
      { status: 409 }
    );
  }

  const { order } = job;

  // Restock inventory with produced quantities
  await Promise.all(
    order.items.map((item) => {
      const inventory = item.sku.inventory;
      if (!inventory) return Promise.resolve();
      return prisma.inventory.update({
        where: { id: inventory.id },
        data: { inStock: { increment: item.quantity } },
      });
    })
  );

  // Create PickList if not already present
  if (!order.pickList) {
    await prisma.pickList.create({
      data: {
        orderId: order.id,
        status: "pending",
        items: {
          create: order.items.map((item) => {
            const inv = item.sku.inventory;
            return {
              orderItemId: item.id,
              location: `Aisle ${inv?.aisle ?? "A"}, Shelf ${inv?.shelf ?? 1}, Bin ${inv?.bin ?? 1}`,
              picked: false,
            };
          }),
        },
      },
    });
  }

  // Update order status to picking
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "picking" },
  });

  // Mark job as ready
  const updated = await prisma.productionJob.update({
    where: { id },
    data: { status: "ready", completedAt: new Date() },
  });

  return NextResponse.json(updated);
}
