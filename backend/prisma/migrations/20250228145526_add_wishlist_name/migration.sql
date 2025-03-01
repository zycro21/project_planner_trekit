/*
  Warnings:

  - Added the required column `wishlist_name` to the `Wishlist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Wishlist" ADD COLUMN     "wishlist_name" VARCHAR(255) NOT NULL;
