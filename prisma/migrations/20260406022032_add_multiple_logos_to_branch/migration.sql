/*
  Warnings:

  - The `details` column on the `AuditLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `code` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `cost` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `minStock` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `Stock` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ecommerceCode]` on the table `Branch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[branchId,variantId]` on the table `Stock` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `categoryId` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `productName` to the `SaleItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantId` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('STANDARD', 'COMBO');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "BannerPosition" AS ENUM ('TOP_BAR', 'MAIN_HERO', 'MIDDLE_SECTION');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LayoutStyle" AS ENUM ('CAROUSEL', 'GRID_STANDARD', 'GRID_HIGHLIGHT', 'LIST_COMPACT');

-- CreateEnum
CREATE TYPE "PointTransactionType" AS ENUM ('EARN', 'REDEEM', 'MANUAL_ADJUSTMENT', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('PENDING', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('INPUT', 'OUTPUT', 'ADJUSTMENT', 'SALE_POS', 'SALE_ECOMMERCE', 'PURCHASE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TRANSFER_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'TRANSFER_UPDATE';

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'POINTS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'ADMIN';
ALTER TYPE "Role" ADD VALUE 'SELLER';
ALTER TYPE "Role" ADD VALUE 'USER';

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "SaleItem" DROP CONSTRAINT "SaleItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "Stock" DROP CONSTRAINT "Stock_productId_fkey";

-- DropIndex
DROP INDEX "Branch_businessId_idx";

-- DropIndex
DROP INDEX "Product_businessId_code_key";

-- DropIndex
DROP INDEX "Stock_branchId_productId_key";

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "details",
ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "brandColors" JSONB,
ADD COLUMN     "customAddress" TEXT,
ADD COLUMN     "customLegalName" TEXT,
ADD COLUMN     "customRuc" TEXT,
ADD COLUMN     "ecommerceCode" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "logos" JSONB;

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "loyaltyEarnRate" DECIMAL(10,2) NOT NULL DEFAULT 10,
ADD COLUMN     "loyaltyEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loyaltyRedeemRate" DECIMAL(10,2) NOT NULL DEFAULT 0.1;

-- AlterTable
ALTER TABLE "CashSession" ADD COLUMN     "incidents" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ecommerceCode" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "businessId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "lastPurchase" TIMESTAMP(3),
ADD COLUMN     "pointsBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalSpent" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "visits" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "businessId" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "code",
DROP COLUMN "cost",
DROP COLUMN "imageUrl",
DROP COLUMN "minStock",
DROP COLUMN "name",
DROP COLUMN "price",
ADD COLUMN     "averageRating" DECIMAL(3,2) NOT NULL DEFAULT 0,
ADD COLUMN     "basePrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "branchOwnerId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "discountPercentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "groupTag" TEXT,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "salesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "type" "ProductType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wholesaleMinCount" INTEGER,
ADD COLUMN     "wholesalePrice" DECIMAL(10,2),
ALTER COLUMN "businessId" DROP NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "categoryId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "pointsEarned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pointsRedeemed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SaleItem" DROP COLUMN "productId",
ADD COLUMN     "productName" TEXT NOT NULL,
ADD COLUMN     "variantId" TEXT,
ADD COLUMN     "variantName" TEXT;

-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "productId",
ADD COLUMN     "variantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "baseSalary" DECIMAL(12,2),
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "baseAmount" DECIMAL(12,2) NOT NULL,
    "bonus" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(12,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "UnitOfMeasure" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,

    CONSTRAINT "UnitOfMeasure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "representative" TEXT,
    "website" TEXT,
    "comments" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "attributes" JSONB,
    "sku" TEXT,
    "barcode" TEXT,
    "price" DECIMAL(10,2),
    "cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 5,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "images" TEXT[],
    "uomId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "currentStock" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "supplierId" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "uomId" TEXT,
    "quantity" INTEGER NOT NULL,
    "cost" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComboItem" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ComboItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerProduct" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "PartnerProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransfer" (
    "id" TEXT NOT NULL,
    "fromBranchId" TEXT NOT NULL,
    "toBranchId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransferItem" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "StockTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointTransaction" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" "PointTransactionType" NOT NULL,
    "description" TEXT,
    "saleId" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "dni" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Perú',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "productId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViewHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "query" TEXT NOT NULL,
    "searchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "mercadoPagoId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "deliveryMethod" TEXT NOT NULL DEFAULT 'PICKUP',
    "shippingAddress" TEXT,
    "shippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "termsAcceptedAt" TIMESTAMP(3),
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "pointsRedeemed" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT,
    "productName" TEXT NOT NULL,
    "variantName" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderTracking" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreConfig" (
    "id" TEXT NOT NULL,
    "whatsappPhone" TEXT NOT NULL DEFAULT '51999999999',
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Hola Festamas, quiero confirmar mi pedido...',
    "localDeliveryPrice" DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    "heroImage" TEXT,
    "heroTitle" TEXT NOT NULL DEFAULT 'Juguetes y Alegría',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Encuentra el regalo perfecto en Festamas',
    "heroButtonText" TEXT NOT NULL DEFAULT 'Ver Juguetes',
    "heroButtonLink" TEXT NOT NULL DEFAULT '#catalogo',
    "heroBtnColor" TEXT NOT NULL DEFAULT '#fb3099',
    "topBarActive" BOOLEAN NOT NULL DEFAULT true,
    "topBarText" TEXT NOT NULL DEFAULT '¡Envíos gratis por compras mayores a S/100!',
    "topBarLink" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PopupConfig" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "link" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "showOnce" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PopupConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "code" TEXT NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL,
    "type" "CouponType" NOT NULL DEFAULT 'FIXED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expirationDate" TIMESTAMP(3),
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "mobileUrl" TEXT,
    "link" TEXT,
    "position" "BannerPosition" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeSection" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "tag" TEXT NOT NULL,
    "layoutStyle" "LayoutStyle" NOT NULL DEFAULT 'CAROUSEL',
    "icon" TEXT NOT NULL DEFAULT 'star',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Catalog" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "title" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "iframeUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Catalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_barcode_key" ON "ProductVariant"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_name_key" ON "ProductVariant"("productId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ComboItem_comboId_variantId_key" ON "ComboItem"("comboId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_productId_userId_key" ON "Review"("productId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerProduct_partnerId_productId_key" ON "PartnerProduct"("partnerId", "productId");

-- CreateIndex
CREATE INDEX "PointTransaction_customerId_idx" ON "PointTransaction"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_productId_key" ON "Favorite"("userId", "productId");

-- CreateIndex
CREATE INDEX "ViewHistory_userId_idx" ON "ViewHistory"("userId");

-- CreateIndex
CREATE INDEX "ViewHistory_sessionId_idx" ON "ViewHistory"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_receiptNumber_key" ON "Order"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_mercadoPagoId_key" ON "Order"("mercadoPagoId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_ecommerceCode_key" ON "Branch"("ecommerceCode");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_branchOwnerId_idx" ON "Product"("branchOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_branchId_variantId_key" ON "Stock"("branchId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_customerId_key" ON "User"("customerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_branchOwnerId_fkey" FOREIGN KEY ("branchOwnerId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "UnitOfMeasure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "UnitOfMeasure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerProduct" ADD CONSTRAINT "PartnerProduct_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerProduct" ADD CONSTRAINT "PartnerProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_fromBranchId_fkey" FOREIGN KEY ("fromBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_toBranchId_fkey" FOREIGN KEY ("toBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewHistory" ADD CONSTRAINT "ViewHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewHistory" ADD CONSTRAINT "ViewHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTracking" ADD CONSTRAINT "OrderTracking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PopupConfig" ADD CONSTRAINT "PopupConfig_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeSection" ADD CONSTRAINT "HomeSection_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catalog" ADD CONSTRAINT "Catalog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
