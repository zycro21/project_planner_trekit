/*
  Warnings:

  - You are about to drop the column `destination_id` on the `Wishlist` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_destination_id_fkey";

-- AlterTable
ALTER TABLE "Wishlist" DROP COLUMN "destination_id";

-- CreateTable
CREATE TABLE "WishlistDestination" (
    "id" TEXT NOT NULL,
    "wishlist_id" TEXT NOT NULL,
    "destination_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistDestination_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WishlistDestination" ADD CONSTRAINT "WishlistDestination_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "Wishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistDestination" ADD CONSTRAINT "WishlistDestination_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "Destination"("destination_id") ON DELETE CASCADE ON UPDATE CASCADE;
