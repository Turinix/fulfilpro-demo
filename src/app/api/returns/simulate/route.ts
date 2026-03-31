/**
 * POST /api/returns/simulate
 * Picks a random shipped order and creates a Return record with status 'requested'.
 * rmaNumber: "RMA-" + 4 random digits, reason picked randomly from a preset list.
 * Returns the created Return as JSON.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const REASONS = [
  "Wrong size",
  "Defective item",
  "Changed mind",
  "Not as described",
  "Received wrong item",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRmaNumber(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `RMA-${num}`;
}

export async function POST() {
  try {
    const shippedOrders = await prisma.order.findMany({
      where: { status: "shipped" },
      select: { id: true, customerName: true },
    });

    if (shippedOrders.length === 0) {
      return NextResponse.json(
        { error: "No shipped orders available to create a return" },
        { status: 400 }
      );
    }

    const order = pickRandom(shippedOrders);
    const reason = pickRandom(REASONS);

    let rmaNumber = generateRmaNumber();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.return.findUnique({ where: { rmaNumber } });
      if (!existing) break;
      rmaNumber = generateRmaNumber();
      attempts++;
    }

    const createdReturn = await prisma.return.create({
      data: {
        orderId: order.id,
        rmaNumber,
        customerName: order.customerName,
        reason,
        status: "requested",
      },
    });

    return NextResponse.json(createdReturn);
  } catch (error) {
    console.error("Simulate return error:", error);
    return NextResponse.json({ error: "Failed to create return" }, { status: 500 });
  }
}
