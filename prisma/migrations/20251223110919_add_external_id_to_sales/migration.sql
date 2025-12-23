/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Sale_externalId_key" ON "Sale"("externalId");
