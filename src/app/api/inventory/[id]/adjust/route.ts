/**
 * POST /api/inventory/[id]/adjust
 * Adjusts the inStock count for an Inventory record by a signed integer.
 * Body: { adjustment: number, reason: string }
 * Clamps result to minimum 0 (stock cannot go negative).
 * Returns the updated Inventory record with SKU as JSON.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await req.json();
  const adjustment = Number(body.adjustment);
  const reason = body.reason;

  if (isNaN(adjustment) || !Number.isInteger(adjustment)) {
    return NextResponse.json(
      { error: "adjustment must be an integer" },
      { status: 400 }
    );
  }

  if (!reason || typeof reason !== "string") {
    return NextResponse.json(
      { error: "reason is required" },
      { status: 400 }
    );
  }

  const inventory = await prisma.inventory.findUnique({
    where: { id },
  });

  if (!inventory) {
    return NextResponse.json(
      { error: "Inventory record not found" },
      { status: 404 }
    );
  }

  // Clamp new stock to minimum 0
  const newStock = Math.max(0, inventory.inStock + adjustment);

  const updated = await prisma.inventory.update({
    where: { id },
    data: { inStock: newStock },
    include: { sku: true },
  });

  return NextResponse.json(updated);
}
