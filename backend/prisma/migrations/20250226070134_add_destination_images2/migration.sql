/*
  Warnings:

  - You are about to alter the column `destination_id` on the `destination_images` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.

*/
-- DropForeignKey
ALTER TABLE "destination_images" DROP CONSTRAINT "destination_images_destination_id_fkey";

-- AlterTable
ALTER TABLE "destination_images" ALTER COLUMN "destination_id" SET DATA TYPE VARCHAR(50);

-- AddForeignKey
ALTER TABLE "destination_images" ADD CONSTRAINT "destination_images_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("destination_id") ON DELETE CASCADE ON UPDATE CASCADE;
