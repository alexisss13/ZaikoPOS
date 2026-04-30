-- CreateEnum for HR module (skip if already exists)
DO $$ BEGIN
    CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ShiftType" AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT', 'FULL_DAY', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PayrollType" AS ENUM ('WEEKLY', 'MONTHLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BonusType" AS ENUM ('PUNCTUALITY', 'PERFORMANCE', 'SALES_TARGET', 'MANUAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdvanceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add HR fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "baseSalary" DECIMAL(12,2);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hourlyRate" DECIMAL(12,2);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workingHours" INTEGER DEFAULT 8;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "qrCode" TEXT UNIQUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "barcode" TEXT UNIQUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "position" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hireDate" TIMESTAMP(3);

-- Note: HR tables already exist, skipping creation
