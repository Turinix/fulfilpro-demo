/**
 * GET /api/warehouse/pick/[orderId]
 * Returns the pick list for an order, with all items including SKU and location details.
 * Used by the mobile pick list page to render item cards.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const pickList = await prisma.pickList.findUnique({
    where: { orderId },
    include: {
      order: { select: { orderNumber: true, status: true } },
      items: {
        include: {
          orderItem: {
            include: { sku: true },
          },
        },
      },
    },
  });

  if (!pickList) {
    return NextResponse.json({ error: "Pick list not found" }, { status: 404 });
  }

  return NextResponse.json({ data: pickList });
}
