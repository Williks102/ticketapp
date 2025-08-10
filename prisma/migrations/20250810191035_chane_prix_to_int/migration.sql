/*
  Warnings:

  - You are about to alter the column `revenue` on the `event_stats` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Integer`.
  - You are about to alter the column `averagePrice` on the `event_stats` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `prix` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `prix` on the `tickets` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "public"."event_stats" ALTER COLUMN "revenue" SET DEFAULT 0,
ALTER COLUMN "revenue" SET DATA TYPE INTEGER,
ALTER COLUMN "averagePrice" SET DEFAULT 0,
ALTER COLUMN "averagePrice" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."events" ALTER COLUMN "prix" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."payments" ALTER COLUMN "amount" SET DATA TYPE INTEGER,
ALTER COLUMN "currency" SET DEFAULT 'XOF';

-- AlterTable
ALTER TABLE "public"."tickets" ALTER COLUMN "prix" SET DATA TYPE INTEGER;
