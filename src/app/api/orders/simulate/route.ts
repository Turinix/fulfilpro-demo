/**
 * POST /api/orders/simulate
 * Creates a randomised realistic order using seeded SKUs and Indian customer data.
 * Channel is weighted: 60% shopify, 20% amazon, 15% website, 5% instagram.
 * Returns the created Order as JSON.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CHANNELS = [
  ...Array(60).fill("shopify"),
  ...Array(20).fill("amazon"),
  ...Array(15).fill("website"),
  ...Array(5).fill("instagram"),
];

const CUSTOMER_NAMES = [
  "Aarav Sharma", "Priya Patel", "Vikram Mehta", "Ananya Singh", "Rohan Gupta",
  "Deepa Nair", "Arjun Reddy", "Kavya Iyer", "Siddharth Joshi", "Pooja Desai",
  "Rahul Verma", "Neha Agarwal", "Amit Kumar", "Sunita Rao", "Rajesh Bhatia",
  "Meera Krishnan", "Nikhil Malhotra", "Shreya Saxena", "Aditya Pandey", "Divya Nambiar",
];

const CUSTOMER_ADDRESSES = [
  "14 MG Road, Indiranagar, Bengaluru, Karnataka 560038",
  "7/B Andheri West, Mumbai, Maharashtra 400058",
  "23 Connaught Place, New Delhi 110001",
  "45 Salt Lake City, Sector V, Kolkata, West Bengal 700091",
  "8 Anna Nagar, Chennai, Tamil Nadu 600040",
  "3 Banjara Hills, Road No 12, Hyderabad, Telangana 500034",
  "56 Aundh, Pune, Maharashtra 411007",
  "19 Vastrapur, Ahmedabad, Gujarat 380015",
  "11 Gomti Nagar, Lucknow, Uttar Pradesh 226010",
  "2 Koramangala, 5th Block, Bengaluru, Karnataka 560095",
];

const CUSTOMER_PHONES = [
  "9876543210", "9123456789", "8765432109", "7654321098", "9988776655",
  "9765432108", "8899001122", "9001234567", "7788990011", "9654321087",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateOrderNumber(): string {
  const num = Math.floor(5000 + Math.random() * 5000);
  return `ORD-${num}`;
}

export async function POST() {
  try {
    const skus = await prisma.sKU.findMany({
      include: { inventory: true },
      take: 50,
    });

    if (skus.length === 0) {
      return NextResponse.json({ error: "No SKUs found in database" }, { status: 500 });
    }

    const channel = pickRandom(CHANNELS);
    const customerName = pickRandom(CUSTOMER_NAMES);
    const customerAddress = pickRandom(CUSTOMER_ADDRESSES);
    const customerPhone = pickRandom(CUSTOMER_PHONES);

    const itemCount = Math.floor(1 + Math.random() * 3);
    const selectedSkus = skus
      .sort(() => Math.random() - 0.5)
      .slice(0, itemCount);

    const items = selectedSkus.map((sku) => ({
      skuId: sku.id,
      quantity: Math.floor(1 + Math.random() * 3),
      unitPrice: sku.price,
    }));

    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0
    );

    let orderNumber = generateOrderNumber();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.order.findUnique({ where: { orderNumber } });
      if (!existing) break;
      orderNumber = generateOrderNumber();
      attempts++;
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        channel,
        customerName,
        customerAddress,
        customerPhone,
        status: "new",
        totalAmount,
        items: {
          create: items,
        },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Simulate order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
