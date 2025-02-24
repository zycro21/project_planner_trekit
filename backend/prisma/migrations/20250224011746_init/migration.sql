-- CreateTable
CREATE TABLE "itinerary_destinations" (
    "id" VARCHAR(50) NOT NULL,
    "itinerary_id" VARCHAR(50),
    "destination_id" VARCHAR(50),
    "day" INTEGER,
    "order_index" INTEGER,

    CONSTRAINT "itinerary_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "review_id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50),
    "destination_id" VARCHAR(50),
    "rating" INTEGER,
    "comment" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" VARCHAR(50) DEFAULT 'user',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "destination_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255),
    "country" VARCHAR(255),
    "city" VARCHAR(255),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "description" TEXT,
    "image_url" TEXT,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("destination_id")
);

-- CreateTable
CREATE TABLE "itineraries" (
    "itinerary_id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50),
    "title" VARCHAR(255),
    "description" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "is_public" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itineraries_pkey" PRIMARY KEY ("itinerary_id")
);

-- CreateTable
CREATE TABLE "settings" (
    "setting_id" VARCHAR(50) NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "value" TEXT,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("setting_id")
);

-- CreateTable
CREATE TABLE "wishlist" (
    "id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50),
    "destination_id" VARCHAR(50),
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- AddForeignKey
ALTER TABLE "itinerary_destinations" ADD CONSTRAINT "itinerary_destinations_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("destination_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "itinerary_destinations" ADD CONSTRAINT "itinerary_destinations_itinerary_id_fkey" FOREIGN KEY ("itinerary_id") REFERENCES "itineraries"("itinerary_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("destination_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("destination_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
