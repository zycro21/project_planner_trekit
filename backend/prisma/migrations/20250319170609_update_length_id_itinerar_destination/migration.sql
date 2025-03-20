/*
  Warnings:

  - The primary key for the `ItineraryDestination` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "ItineraryDestination" DROP CONSTRAINT "ItineraryDestination_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(200),
ADD CONSTRAINT "ItineraryDestination_pkey" PRIMARY KEY ("id");
