/**
 * POST /api/returns/[id]/receive
 * Body: { itemCondition: "good" | "damaged" | "defective" }
 * Validates current status is 'approved', then advances to 'received'.
 * If itemCondition = 'good', increments inStock for each item in the associated order.
 * Returns updated Return as JSON.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { itemCondition?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { itemCondition } = body;
  if (!itemCondition || !["good", "damaged", "defective"].includes(itemCondition)) {
    return NextResponse.json(
      { error: "itemCondition must be 'good', 'damaged', or 'defective'" },
      { status: 400 }
    );
  }

  const existing = await prisma.return.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          items: {
            include: {
              sku: { include: { inventory: true } },
            },
          },
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Return not found" }, { status: 404 });
  }

  if (existing.status !== "approved") {
    return NextResponse.json(
      { error: `Cannot receive return in status '${existing.status}'` },
      { status: 409 }
    );
  }

  // Auto-restock when item condition is good
  if (itemCondition === "good") {
    await Promise.all(
      existing.order.items.map((item) => {
        if (!item.sku.inventory) return Promise.resolve();
        return prisma.inventory.update({
          where: { id: item.sku.inventory.id },
          data: { inStock: { increment: item.quantity } },
        });
      })
    );
  }

  const updated = await prisma.return.update({
    where: { id },
    data: { status: "received", itemCondition },
  });

  return NextResponse.json(updated);
}
