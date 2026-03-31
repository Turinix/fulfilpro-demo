/**
 * POST /api/warehouse/pick/[orderId]/item/[itemId]
 * Marks a PickListItem as picked. Sets picked = true, pickedAt = now.
 * Returns the updated pick list item.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  const { itemId } = await params;

  const updated = await prisma.pickListItem.update({
    where: { id: itemId },
    data: { picked: true, pickedAt: new Date() },
  });

  return NextResponse.json({ data: updated });
}
