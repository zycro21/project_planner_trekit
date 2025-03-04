/*
  Warnings:

  - A unique constraint covering the columns `[name,country,city]` on the table `Destination` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Destination_name_country_city_key" ON "Destination"("name", "country", "city");
