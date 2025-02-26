/*
  Warnings:

  - You are about to drop the column `image_url` on the `destinations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "destinations" DROP COLUMN "image_url";

-- CreateTable
CREATE TABLE "destination_images" (
    "image_id" VARCHAR(50) NOT NULL,
    "destination_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "destination_images_pkey" PRIMARY KEY ("image_id")
);

-- AddForeignKey
ALTER TABLE "destination_images" ADD CONSTRAINT "destination_images_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("destination_id") ON DELETE CASCADE ON UPDATE CASCADE;
