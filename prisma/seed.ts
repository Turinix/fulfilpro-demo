import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(randomInt(8, 22), randomInt(0, 59), 0, 0)
  return d
}

function awbNumber(): string {
  return `AWB-${randomInt(100000000, 999999999)}`
}

function rmaNumber(n: number): string {
  return `RMA-${1000 + n}`
}

// ─── SKU Definitions ──────────────────────────────────────────────────────────

const products = [
  // Tops
  { name: 'Classic Crew Neck Tee', category: 'Tops', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'White', 'Heather Grey', 'Navy'], price: 699, cost: 220 },
  { name: 'Essential V-Neck Tee', category: 'Tops', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'White', 'Olive'], price: 749, cost: 240 },
  { name: 'Oversized Drop Shoulder Tee', category: 'Tops', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Heather Grey', 'Burgundy'], price: 899, cost: 290 },
  { name: 'Polo Pique Shirt', category: 'Tops', sizes: ['S', 'M', 'L', 'XL'], colors: ['Navy', 'White', 'Olive'], price: 1199, cost: 380 },
  { name: 'Henley Full Sleeve', category: 'Tops', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Heather Grey', 'Burgundy'], price: 999, cost: 320 },
  // Bottoms
  { name: 'Slim Fit Chinos', category: 'Bottoms', sizes: ['30', '32', '34', '36'], colors: ['Navy', 'Olive', 'Black'], price: 1499, cost: 480 },
  { name: 'Relaxed Joggers', category: 'Bottoms', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Heather Grey', 'Navy'], price: 1299, cost: 420 },
  { name: 'Cargo Shorts', category: 'Bottoms', sizes: ['S', 'M', 'L', 'XL'], colors: ['Olive', 'Black', 'Navy'], price: 1099, cost: 350 },
  { name: 'Athletic Track Pants', category: 'Bottoms', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Navy', 'Heather Grey'], price: 1199, cost: 380 },
  // Outerwear
  { name: 'Organic Cotton Hoodie', category: 'Outerwear', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Heather Grey', 'Navy'], price: 1999, cost: 640 },
  { name: 'Zip-Up Bomber Jacket', category: 'Outerwear', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Olive', 'Navy'], price: 2999, cost: 960 },
  { name: 'Lightweight Windbreaker', category: 'Outerwear', sizes: ['S', 'M', 'L', 'XL'], colors: ['Navy', 'Olive', 'Black'], price: 2499, cost: 800 },
  // Accessories
  { name: 'Canvas Tote Bag', category: 'Accessories', sizes: ['One Size'], colors: ['Black', 'Navy', 'Olive'], price: 599, cost: 180 },
  { name: 'Leather Card Holder', category: 'Accessories', sizes: ['One Size'], colors: ['Black', 'Burgundy'], price: 799, cost: 250 },
  { name: 'Woven Belt', category: 'Accessories', sizes: ['S/M', 'L/XL'], colors: ['Black', 'Navy', 'Olive'], price: 699, cost: 220 },
  { name: 'Cotton Crew Socks (3-pack)', category: 'Accessories', sizes: ['S/M', 'L/XL'], colors: ['White', 'Black', 'Heather Grey'], price: 499, cost: 150 },
]

// ─── Indian Customer Data ─────────────────────────────────────────────────────

const customerNames = [
  'Rahul Sharma', 'Priya Patel', 'Amit Gupta', 'Sneha Reddy', 'Vikram Singh',
  'Ananya Iyer', 'Rohan Mehta', 'Kavita Nair', 'Deepak Joshi', 'Pooja Verma',
  'Suresh Kumar', 'Divya Pillai', 'Arjun Rao', 'Meera Krishnan', 'Sanjay Tiwari',
  'Anjali Desai', 'Kiran Shah', 'Nisha Agarwal', 'Manish Pandey', 'Ritu Saxena',
  'Aditya Bose', 'Swati Mishra', 'Rajesh Nayak', 'Pallavi Garg', 'Vivek Malhotra',
  'Smita Jain', 'Abhishek Thakur', 'Nandini Shetty', 'Gaurav Chauhan', 'Isha Kapoor',
  'Mohit Dubey', 'Tara Menon', 'Siddharth Kulkarni', 'Preeti Bajaj', 'Nitin Hegde',
]

const customerAddresses = [
  '42 MG Road, Indiranagar, Bangalore 560038',
  '15 Linking Road, Bandra West, Mumbai 400050',
  '7 Park Street, Kolkata 700016',
  '23 Anna Salai, Teynampet, Chennai 600006',
  '88 Connaught Place, New Delhi 110001',
  '34 Jubilee Hills, Hyderabad 500033',
  '12 FC Road, Shivajinagar, Pune 411005',
  '56 CG Road, Navrangpura, Ahmedabad 380009',
  '9 MG Marg, Hazratganj, Lucknow 226001',
  '71 Residency Road, Indore 452001',
  '3 Koregaon Park, Pune 411001',
  '108 Whitefield Main Road, Bangalore 560066',
  '25 Karol Bagh, New Delhi 110005',
  '19 Salt Lake Sector V, Kolkata 700091',
  '44 Guindy, Chennai 600032',
  '67 Baner Road, Pune 411045',
  '31 HSR Layout, Bangalore 560102',
  '5 Malviya Nagar, Jaipur 302017',
  '88 Boring Road, Patna 800001',
  '14 VIP Road, Zirakpur, Chandigarh 140603',
]

const phones = [
  '9876543210', '8765432109', '7654321098', '9988776655', '8877665544',
  '9123456780', '8012345678', '7890123456', '9000012345', '8111223344',
]

// 60% shopify, 20% amazon, 15% website, 5% instagram
const channels = [
  'shopify', 'shopify', 'shopify', 'shopify', 'shopify', 'shopify',
  'amazon', 'amazon', 'amazon', 'amazon',
  'website', 'website', 'website',
  'instagram',
]

const couriers = ['Delhivery', 'Shiprocket', 'BlueDart', 'DTDC']

// ─── Status distribution across 220 orders ───────────────────────────────────
// new=20%, picking=15%, packing=10%, dispatched=10%, shipped=30%, routed=5%, return_requested=5%, in_production=5%

type OrderStatus = 'new' | 'routed' | 'picking' | 'packing' | 'dispatched' | 'shipped' | 'return_requested'

interface OrderMeta {
  status: OrderStatus
  routingDecision: string | null
  isProductionRouted: boolean
}

function assignOrderMeta(index: number, total: number): OrderMeta {
  const pct = index / total
  if (pct < 0.20) return { status: 'new', routingDecision: null, isProductionRouted: false }
  if (pct < 0.25) return { status: 'routed', routingDecision: 'stock', isProductionRouted: false }
  if (pct < 0.30) return { status: 'routed', routingDecision: 'production', isProductionRouted: true }
  if (pct < 0.45) return { status: 'picking', routingDecision: 'stock', isProductionRouted: false }
  if (pct < 0.55) return { status: 'packing', routingDecision: 'stock', isProductionRouted: false }
  if (pct < 0.65) return { status: 'dispatched', routingDecision: 'stock', isProductionRouted: false }
  if (pct < 0.95) return { status: 'shipped', routingDecision: 'stock', isProductionRouted: false }
  return { status: 'return_requested', routingDecision: 'stock', isProductionRouted: false }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Clearing existing data...')
  await prisma.demandForecast.deleteMany()
  await prisma.return.deleteMany()
  await prisma.shipment.deleteMany()
  await prisma.pickListItem.deleteMany()
  await prisma.pickList.deleteMany()
  await prisma.productionJob.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.sKU.deleteMany()

  // ─── SKUs ────────────────────────────────────────────────────────────────

  console.log('Seeding SKUs...')
  const skuRecords: Array<{
    id: string; name: string; skuCode: string; category: string
    size: string; color: string; price: Prisma.Decimal; cost: Prisma.Decimal
  }> = []

  for (const product of products) {
    for (const size of product.sizes) {
      for (const color of product.colors) {
        const nameSlug = product.name.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase()
        const colorSlug = color.replace(/[\s/]/g, '').slice(0, 3).toUpperCase()
        const sizeSlug = size.replace(/[\s/]/g, '').toUpperCase()
        const skuCode = `SKU-${nameSlug}-${colorSlug}-${sizeSlug}`
        skuRecords.push({
          id: `sku-${skuCode.toLowerCase()}`,
          name: `${product.name} - ${color} - ${size}`,
          skuCode,
          category: product.category,
          size,
          color,
          price: new Prisma.Decimal(product.price),
          cost: new Prisma.Decimal(product.cost),
        })
      }
    }
  }

  // Deduplicate by skuCode
  const seenCodes = new Set<string>()
  const uniqueSkus = skuRecords.filter(s => {
    if (seenCodes.has(s.skuCode)) return false
    seenCodes.add(s.skuCode)
    return true
  })
  const finalSkus = uniqueSkus.slice(0, 50)

  await prisma.sKU.createMany({ data: finalSkus })

  // ─── Inventory ───────────────────────────────────────────────────────────

  console.log('Seeding Inventory...')
  const outOfStockIdx = new Set([2, 11, 24])
  const lowStockIdx = new Set([5, 9, 16, 21, 33, 41, 47])
  const aisles = ['A', 'B', 'C', 'D']

  const inventoryRows = finalSkus.map((sku, i) => ({
    skuId: sku.id,
    inStock: outOfStockIdx.has(i) ? 0 : lowStockIdx.has(i) ? randomInt(3, 15) : randomInt(50, 200),
    reserved: 0,
    reorderPoint: randomInt(20, 40),
    aisle: randomFrom(aisles),
    shelf: randomInt(1, 5),
    bin: randomInt(1, 20),
  }))
  await prisma.inventory.createMany({ data: inventoryRows })
  console.log(`Seeded ${finalSkus.length} SKUs with inventory`)

  // ─── Orders ──────────────────────────────────────────────────────────────

  console.log('Seeding Orders...')
  const TOTAL_ORDERS = 220

  interface OrderRecord {
    id: string; orderNumber: string; channel: string; customerName: string
    customerAddress: string; customerPhone: string; status: string
    routingDecision: string | null; totalAmount: Prisma.Decimal
    createdAt: Date; updatedAt: Date
  }

  const orderRows: OrderRecord[] = []
  const productionOrderIds: string[] = []
  const pickingOrderIds: string[] = []
  const packingOrderIds: string[] = []
  const dispatchedOrderIds: string[] = []
  const shippedOrderIds: string[] = []
  const returnOrderIds: string[] = []

  for (let i = 0; i < TOTAL_ORDERS; i++) {
    const orderId = `order-${1001 + i}`
    const meta = assignOrderMeta(i, TOTAL_ORDERS)
    orderRows.push({
      id: orderId,
      orderNumber: `ORD-${1001 + i}`,
      channel: randomFrom(channels),
      customerName: randomFrom(customerNames),
      customerAddress: randomFrom(customerAddresses),
      customerPhone: randomFrom(phones),
      status: meta.status,
      routingDecision: meta.routingDecision,
      totalAmount: new Prisma.Decimal(randomInt(699, 5999)),
      createdAt: daysAgo(randomInt(0, 30)),
      updatedAt: new Date(),
    })

    if (meta.isProductionRouted) productionOrderIds.push(orderId)
    else if (meta.status === 'picking') pickingOrderIds.push(orderId)
    else if (meta.status === 'packing') packingOrderIds.push(orderId)
    else if (meta.status === 'dispatched') dispatchedOrderIds.push(orderId)
    else if (meta.status === 'shipped') shippedOrderIds.push(orderId)
    else if (meta.status === 'return_requested') returnOrderIds.push(orderId)
  }

  await prisma.order.createMany({ data: orderRows })

  // ─── Order Items ─────────────────────────────────────────────────────────

  console.log('Seeding Order Items...')
  interface OrderItemRecord {
    id: string; orderId: string; skuId: string; quantity: number; unitPrice: Prisma.Decimal
  }
  const orderItemRows: OrderItemRecord[] = []
  const orderItemsByOrder: Record<string, string[]> = {}

  for (const o of orderRows) {
    const itemCount = randomInt(1, 4)
    orderItemsByOrder[o.id] = []
    for (let j = 0; j < itemCount; j++) {
      const sku = randomFrom(finalSkus)
      const itemId = `oi-${o.id}-${j}`
      orderItemsByOrder[o.id].push(itemId)
      orderItemRows.push({ id: itemId, orderId: o.id, skuId: sku.id, quantity: randomInt(1, 3), unitPrice: sku.price })
    }
  }
  await prisma.orderItem.createMany({ data: orderItemRows })
  console.log(`Seeded ${TOTAL_ORDERS} orders with ${orderItemRows.length} items`)

  // ─── Pick Lists ───────────────────────────────────────────────────────────

  console.log('Seeding PickLists...')
  const pickListEntries = [
    ...pickingOrderIds.map(id => ({ id, status: 'in_progress' })),
    ...packingOrderIds.map(id => ({ id, status: 'completed' })),
    ...dispatchedOrderIds.map(id => ({ id, status: 'completed' })),
    ...shippedOrderIds.map(id => ({ id, status: 'completed' })),
  ]

  if (pickListEntries.length > 0) {
    await prisma.pickList.createMany({
      data: pickListEntries.map(e => ({ id: `pl-${e.id}`, orderId: e.id, status: e.status })),
    })

    const pickListItemRows: Array<{
      id: string; pickListId: string; orderItemId: string; location: string; picked: boolean; pickedAt: Date | null
    }> = []

    for (const e of pickListEntries) {
      const isComplete = e.status === 'completed'
      const items = orderItemsByOrder[e.id] || []
      const orderRec = orderRows.find(o => o.id === e.id)
      for (const itemId of items) {
        const inv = randomFrom(inventoryRows)
        pickListItemRows.push({
          id: `pli-pl-${e.id}-${itemId}`,
          pickListId: `pl-${e.id}`,
          orderItemId: itemId,
          location: `Aisle ${inv.aisle}, Shelf ${inv.shelf}, Bin ${inv.bin}`,
          picked: isComplete,
          pickedAt: isComplete && orderRec ? orderRec.createdAt : null,
        })
      }
    }
    await prisma.pickListItem.createMany({ data: pickListItemRows })
  }

  // ─── Production Jobs ─────────────────────────────────────────────────────

  console.log('Seeding Production Jobs...')
  const prodStatuses = ['queued', 'queued', 'in_production', 'in_production', 'ready', 'queued', 'in_production']
  const prodPriorities = ['normal', 'high', 'urgent', 'normal', 'high', 'low', 'urgent']

  const prodJobs = productionOrderIds.slice(0, 7).map((orderId, i) => {
    const status = prodStatuses[i % prodStatuses.length]
    return {
      id: `pj-${orderId}`,
      orderId,
      status,
      priority: prodPriorities[i % prodPriorities.length],
      startedAt: status !== 'queued' ? daysAgo(randomInt(1, 3)) : null,
      completedAt: status === 'ready' ? daysAgo(0) : null,
    }
  })
  if (prodJobs.length > 0) await prisma.productionJob.createMany({ data: prodJobs })
  console.log(`Seeded ${prodJobs.length} production jobs`)

  // ─── Shipments ────────────────────────────────────────────────────────────

  console.log('Seeding Shipments...')
  const packageSizes = ['small', 'medium', 'large']

  const shipmentRows = [
    ...dispatchedOrderIds.map(id => ({ orderId: id, shipStatus: 'dispatched' })),
    ...shippedOrderIds.map(id => ({ orderId: id, shipStatus: 'delivered' })),
  ].map(s => ({
    id: `ship-${s.orderId}`,
    orderId: s.orderId,
    courier: randomFrom(couriers),
    awbNumber: awbNumber(),
    packageSize: randomFrom(packageSizes),
    weight: new Prisma.Decimal((randomInt(2, 20) / 10).toFixed(1)),
    status: s.shipStatus,
  }))

  if (shipmentRows.length > 0) await prisma.shipment.createMany({ data: shipmentRows })
  console.log(`Seeded ${shipmentRows.length} shipments`)

  // ─── Returns ──────────────────────────────────────────────────────────────

  console.log('Seeding Returns...')
  const returnReasons = ['Wrong size', 'Defective product', 'Changed mind', 'Not as described', 'Damaged in transit']
  const returnStatuses = ['requested', 'approved', 'received', 'refunded', 'rejected', 'requested', 'approved']
  const returnConditions = ['good', 'damaged', 'defective']

  // Use shipped orders for returns (they have shipments attached)
  const returnSourceOrders = shippedOrderIds.slice(0, 7)

  const returnRows = returnSourceOrders.map((orderId, i) => {
    const ord = orderRows.find(o => o.id === orderId)
    const status = returnStatuses[i % returnStatuses.length]
    return {
      id: `ret-${orderId}`,
      orderId,
      rmaNumber: rmaNumber(i),
      customerName: ord?.customerName ?? 'Customer',
      reason: randomFrom(returnReasons),
      itemCondition: ['received', 'refunded'].includes(status) ? randomFrom(returnConditions) : null,
      status,
    }
  })
  if (returnRows.length > 0) await prisma.return.createMany({ data: returnRows })
  console.log(`Seeded ${returnRows.length} returns`)

  // ─── Demand Forecasts ────────────────────────────────────────────────────

  console.log('Seeding Demand Forecasts...')
  const trendingUpSkus = finalSkus.slice(0, 3)
  const trendingDownSkus = finalSkus.slice(3, 6)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const forecastRows: Array<{
    skuId: string; date: Date; predictedUnits: number; actualUnits: number | null; confidence: string
  }> = []

  for (const sku of finalSkus) {
    const isTrendingUp = trendingUpSkus.some(s => s.id === sku.id)
    const isTrendingDown = trendingDownSkus.some(s => s.id === sku.id)

    for (let dayOffset = -30; dayOffset <= 30; dayOffset++) {
      const date = new Date(today)
      date.setDate(date.getDate() + dayOffset)
      date.setHours(0, 0, 0, 0)

      const isPast = dayOffset < 0
      const weeksOut = Math.abs(dayOffset) / 7

      let base = randomInt(15, 45)
      if (isTrendingUp) {
        base = Math.round(base * (1 + (dayOffset + 30) * 0.013))
      } else if (isTrendingDown) {
        base = Math.max(2, Math.round(base * (1 - (dayOffset + 30) * 0.009)))
      } else {
        base = base + randomInt(-4, 4)
      }
      base = Math.max(1, base)

      let confidence: string
      if (isPast || weeksOut < 1) confidence = 'high'
      else if (weeksOut < 3) confidence = 'medium'
      else confidence = 'low'

      forecastRows.push({
        skuId: sku.id,
        date,
        predictedUnits: base,
        actualUnits: isPast ? Math.max(0, base + randomInt(-5, 5)) : null,
        confidence,
      })
    }
  }

  const BATCH = 500
  for (let i = 0; i < forecastRows.length; i += BATCH) {
    await prisma.demandForecast.createMany({ data: forecastRows.slice(i, i + BATCH) })
  }
  console.log(`Seeded ${forecastRows.length} forecast records`)

  // ─── Summary ─────────────────────────────────────────────────────────────

  const [skuCount, orderCount, forecastCount, returnCount, prodCount, shipCount] = await Promise.all([
    prisma.sKU.count(),
    prisma.order.count(),
    prisma.demandForecast.count(),
    prisma.return.count(),
    prisma.productionJob.count(),
    prisma.shipment.count(),
  ])

  console.log('\n--- Seed Summary ---')
  console.log(`SKUs:            ${skuCount}`)
  console.log(`Orders:          ${orderCount}`)
  console.log(`Forecasts:       ${forecastCount}`)
  console.log(`Production Jobs: ${prodCount}`)
  console.log(`Shipments:       ${shipCount}`)
  console.log(`Returns:         ${returnCount}`)
  console.log('Seed complete.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
