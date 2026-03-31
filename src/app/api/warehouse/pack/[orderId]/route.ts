/**
 * POST /api/warehouse/pack/[orderId]
 * Creates a Shipment for the order with the selected package size and weight.
 * Assigns a random courier and generates a random AWB number.
 * Body: { packageSize: string, weight?: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COURIERS = ["Delhivery", "Shiprocket", "BlueDart", "DTDC"];

function randomCourier(): string {
  return COURIERS[Math.floor(Math.random() * COURIERS.length)];
}

function randomAwb(): string {
  const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("");
  return `AWB-${digits}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const body = await req.json();
  const { packageSize, weight } = body as { packageSize: string; weight?: number };

  if (!packageSize) {
    return NextResponse.json({ error: "packageSize is required" }, { status: 400 });
  }

  // Check if a shipment already exists for this order
  const existing = await prisma.shipment.findUnique({ where: { orderId } });
  if (existing) {
    return NextResponse.json({ data: existing });
  }

  const shipment = await prisma.shipment.create({
    data: {
      orderId,
      courier: randomCourier(),
      awbNumber: randomAwb(),
      packageSize,
      weight: weight ?? null,
      status: "packed",
    },
  });

  return NextResponse.json({ data: shipment });
}
