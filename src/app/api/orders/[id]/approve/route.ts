/**
 * POST /api/orders/[id]/approve
 * Approves routing for an order. Checks stock availability for all items.
 * - If hold=true in body: sets status to 'routed' with no routingDecision (placeholder hold).
 * - If all in stock: creates PickList + PickListItems, reserves inventory, status → 'picking'.
 * - If any out of stock: creates ProductionJob, status → 'routed', routingDecision → 'production'.
 * Returns updated order as JSON.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function calcPriority(createdAt: Date): string {
  const ageHours = (Date.now() - createdAt.getTime()) / 3600000;
  if (ageHours > 48) return "urgent";
  if (ageHours > 24) return "high";
  if (ageHours > 12) return "normal";
  return "low";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { hold?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // body is optional
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          sku: { include: { inventory: true } },
        },
      },
      pickList: true,
      productionJob: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!["new", "routed"].includes(order.status)) {
    return NextResponse.json(
      { error: `Cannot approve order in status '${order.status}'` },
      { status: 409 }
    );
  }

  // Hold path — just mark as routed without a routing decision
  if (body.hold) {
    const updated = await prisma.order.update({
      where: { id },
      data: { status: "routed", routingDecision: null },
    });
    return NextResponse.json(updated);
  }

  // Stock check
  const stockResults = order.items.map((item) => ({
    item,
    inStock: item.sku.inventory?.inStock ?? 0,
    isAvailable: (item.sku.inventory?.inStock ?? 0) >= item.quantity,
    inventory: item.sku.inventory,
  }));

  const allInStock = stockResults.every((r) => r.isAvailable);

  if (allInStock) {
    // Stock path: PickList + PickListItems + reserve inventory + status → picking
    const pickList = await prisma.pickList.create({
      data: {
        orderId: id,
        status: "pending",
        items: {
          create: stockResults.map(({ item, inventory }) => ({
            orderItemId: item.id,
            location: `Aisle ${inventory?.aisle ?? "A"}, Shelf ${inventory?.shelf ?? 1}, Bin ${inventory?.bin ?? 1}`,
            picked: false,
          })),
        },
      },
    });

    // Reserve inventory for each item
    await Promise.all(
      stockResults.map(({ item, inventory }) => {
        if (!inventory) return Promise.resolve();
        return prisma.inventory.update({
          where: { id: inventory.id },
          data: { reserved: { increment: item.quantity } },
        });
      })
    );

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: "picking", routingDecision: "stock" },
    });

    return NextResponse.json({ ...updatedOrder, pickListId: pickList.id });
  }

  // Production path: ProductionJob + status → routed
  if (order.productionJob) {
    // Already has a production job, just update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: "routed", routingDecision: "production" },
    });
    return NextResponse.json(updatedOrder);
  }

  await prisma.productionJob.create({
    data: {
      orderId: id,
      status: "queued",
      priority: calcPriority(order.createdAt),
    },
  });

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status: "routed", routingDecision: "production" },
  });

  return NextResponse.json(updatedOrder);
}
