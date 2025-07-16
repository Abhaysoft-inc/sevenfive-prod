-- CreateEnum
CREATE TYPE "Year" AS ENUM ('FIRST', 'SECOND', 'THIRD', 'FOURTH');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "year" "Year" NOT NULL DEFAULT 'FIRST';
