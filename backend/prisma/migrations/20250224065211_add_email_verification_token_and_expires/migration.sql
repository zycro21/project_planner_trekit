-- AlterTable
ALTER TABLE "users" ADD COLUMN     "verification_expires" TIMESTAMP(3),
ADD COLUMN     "verification_token" VARCHAR(255);
