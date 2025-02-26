/*
  Warnings:

  - You are about to drop the `destination_images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `destinations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `itineraries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `itinerary_destinations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wishlist` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "destination_images" DROP CONSTRAINT "destination_images_destination_id_fkey";

-- DropForeignKey
ALTER TABLE "itineraries" DROP CONSTRAINT "itineraries_user_id_fkey";

-- DropForeignKey
ALTER TABLE "itinerary_destinations" DROP CONSTRAINT "itinerary_destinations_destination_id_fkey";

-- DropForeignKey
ALTER TABLE "itinerary_destinations" DROP CONSTRAINT "itinerary_destinations_itinerary_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_destination_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_user_id_fkey";

-- DropForeignKey
ALTER TABLE "wishlist" DROP CONSTRAINT "wishlist_destination_id_fkey";

-- DropForeignKey
ALTER TABLE "wishlist" DROP CONSTRAINT "wishlist_user_id_fkey";

-- DropTable
DROP TABLE "destination_images";

-- DropTable
DROP TABLE "destinations";

-- DropTable
DROP TABLE "itineraries";

-- DropTable
DROP TABLE "itinerary_destinations";

-- DropTable
DROP TABLE "reviews";

-- DropTable
DROP TABLE "settings";

-- DropTable
DROP TABLE "users";

-- DropTable
DROP TABLE "wishlist";

-- CreateTable
CREATE TABLE "ItineraryDestination" (
    "id" VARCHAR(50) NOT NULL,
    "itinerary_id" VARCHAR(50),
    "destination_id" VARCHAR(50),
    "day" INTEGER,
    "order_index" INTEGER,

    CONSTRAINT "ItineraryDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "review_id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50),
    "destination_id" VARCHAR(50),
    "rating" INTEGER,
    "comment" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "User" (
    "user_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" VARCHAR(255),
    "verification_expires" TIMESTAMP(3),
    "reset_password_token" VARCHAR(255),
    "reset_password_expires" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Destination" (
    "destination_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255),
    "country" VARCHAR(255),
    "city" VARCHAR(255),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "description" TEXT,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("destination_id")
);

-- CreateTable
CREATE TABLE "DestinationImage" (
    "image_id" VARCHAR(50) NOT NULL,
    "destination_id" VARCHAR(50) NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "DestinationImage_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "Itinerary" (
    "itinerary_id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50),
    "title" VARCHAR(255),
    "description" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "is_public" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("itinerary_id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "setting_id" VARCHAR(50) NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "value" TEXT,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("setting_id")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50),
    "destination_id" VARCHAR(50),
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- AddForeignKey
ALTER TABLE "ItineraryDestination" ADD CONSTRAINT "ItineraryDestination_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "Destination"("destination_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ItineraryDestination" ADD CONSTRAINT "ItineraryDestination_itinerary_id_fkey" FOREIGN KEY ("itinerary_id") REFERENCES "Itinerary"("itinerary_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "Destination"("destination_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DestinationImage" ADD CONSTRAINT "DestinationImage_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "Destination"("destination_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "Destination"("destination_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
