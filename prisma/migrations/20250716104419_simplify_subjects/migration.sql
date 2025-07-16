/*
  Warnings:

  - You are about to drop the column `batch` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `batchId` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `Subject` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code,branch,year]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Subject` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_batchId_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_branchId_fkey";

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "batch",
DROP COLUMN "batchId",
DROP COLUMN "branchId",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "year" "Year" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_branch_year_key" ON "Subject"("code", "branch", "year");
