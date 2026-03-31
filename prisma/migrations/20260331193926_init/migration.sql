-- CreateTable
CREATE TABLE "SKU" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skuCode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "imageUrl" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "cost" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SKU_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "inStock" INTEGER NOT NULL,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL,
    "aisle" TEXT NOT NULL,
    "shelf" INTEGER NOT NULL,
    "bin" INTEGER NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "routingDecision" TEXT,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickList" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PickList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickListItem" (
    "id" TEXT NOT NULL,
    "pickListId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "picked" BOOLEAN NOT NULL DEFAULT false,
    "pickedAt" TIMESTAMP(3),

    CONSTRAINT "PickListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionJob" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "courier" TEXT NOT NULL,
    "awbNumber" TEXT NOT NULL,
    "packageSize" TEXT NOT NULL,
    "weight" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'packed',
    "labelUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Return" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "rmaNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "itemCondition" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandForecast" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "predictedUnits" INTEGER NOT NULL,
    "actualUnits" INTEGER,
    "confidence" TEXT NOT NULL,

    CONSTRAINT "DemandForecast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SKU_skuCode_key" ON "SKU"("skuCode");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_skuId_key" ON "Inventory"("skuId");

-- CreateIndex
CREATE INDEX "Inventory_inStock_idx" ON "Inventory"("inStock");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PickList_orderId_key" ON "PickList"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionJob_orderId_key" ON "ProductionJob"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_orderId_key" ON "Shipment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Return_rmaNumber_key" ON "Return"("rmaNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DemandForecast_skuId_date_key" ON "DemandForecast"("skuId", "date");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickList" ADD CONSTRAINT "PickList_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickListItem" ADD CONSTRAINT "PickListItem_pickListId_fkey" FOREIGN KEY ("pickListId") REFERENCES "PickList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickListItem" ADD CONSTRAINT "PickListItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJob" ADD CONSTRAINT "ProductionJob_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandForecast" ADD CONSTRAINT "DemandForecast_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
