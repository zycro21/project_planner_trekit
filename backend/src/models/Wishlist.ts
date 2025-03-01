import { PrismaClient, Prisma } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export class WishlistModel {
  // 📌 Membuat Wishlist baru dengan minimal 1 destinasi
  static async createWishlist(
    user_id: string,
    wishlist_name: string,
    destination_ids: string[]
  ) {
    // Generate ID dengan format "wishlist-user_id-random"
    const wishlist_id = `wishlist-${user_id}-${crypto
      .randomBytes(4)
      .toString("hex")}`;

    // Buat wishlist baru
    const newWishlist = await prisma.wishlist.create({
      data: {
        id: wishlist_id,
        user_id,
        wishlist_name,
        wishlist_destinations: {
          create: destination_ids.map((destination_id) => ({ destination_id })),
        },
      },
      include: {
        wishlist_destinations: { include: { destination: true } },
      },
    });

    return newWishlist;
  }

  // 📌 Menambahkan satu atau lebih destinasi ke wishlist yang sudah ada
  static async addDestinationsToWishlist(
    wishlist_id: string,
    destination_ids: string[]
  ) {
    // Cek apakah wishlist dengan ID tersebut ada
    const existingWishlist = await prisma.wishlist.findUnique({
      where: { id: wishlist_id },
    });

    if (!existingWishlist) {
      throw new Error("Wishlist tidak ditemukan.");
    }

    // Tambahkan semua destinasi baru ke wishlist melalui tabel pivot
    return await prisma.wishlistDestination.createMany({
      data: destination_ids.map((destination_id) => ({
        wishlist_id,
        destination_id,
      })),
      skipDuplicates: true, // Hindari duplikasi
    });
  }

  // 📌 Mengambil semua wishlist
  static async findAll() {
    return await prisma.wishlist.findMany({
      include: {
        wishlist_destinations: { include: { destination: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { added_at: "desc" },
    });
  }

  // 📌 Mengambil semua wishlist berdasarkan user_id
  static async findAllByUser(user_id: string) {
    return await prisma.wishlist.findMany({
      where: { user_id },
      include: {
        wishlist_destinations: { include: { destination: true } },
      },
      orderBy: { added_at: "desc" },
    });
  }

  // 📌 Mengambil wishlist berdasarkan ID
  static async findById(id: string) {
    return await prisma.wishlist.findUnique({
      where: { id },
      include: {
        wishlist_destinations: { include: { destination: true } },
        user: { select: { name: true, email: true } },
      },
    });
  }

  // 📌 Menghapus satu atau lebih destinasi dari wishlist
  static async removeDestinationsFromWishlist(
    wishlist_id: string,
    destination_ids: string[]
  ) {
    // Hapus hanya destinasi yang ada di dalam array
    return await prisma.wishlistDestination.deleteMany({
      where: {
        wishlist_id,
        destination_id: { in: destination_ids },
      },
    });
  }

  // 📌 Menghapus wishlist berdasarkan ID (termasuk semua relasinya)
  static async delete(id: string) {
    // Hapus semua relasi di tabel pivot terlebih dahulu
    await prisma.wishlistDestination.deleteMany({
      where: { wishlist_id: id },
    });

    // Hapus wishlist utama
    return await prisma.wishlist.delete({ where: { id } });
  }

  // 📌 Update nama wishlist
  static async updateWishlistName(wishlist_id: string, wishlist_name: string) {
    return await prisma.wishlist.update({
      where: { id: wishlist_id },
      data: { wishlist_name },
    });
  }

  // 📌 Cek apakah destinasi ada di wishlist
  static async checkDestinationInWishlist(
    wishlist_id: string,
    destination_id: string
  ) {
    const destination = await prisma.wishlistDestination.findFirst({
      where: { wishlist_id, destination_id },
    });

    return !!destination; // Return true jika ada, false jika tidak
  }

  // 📌 GET Semua Destinasi dalam Wishlist
  static async getWishlistDestinations(wishlist_id: string) {
    return await prisma.wishlistDestination.findMany({
      where: { wishlist_id },
      include: { destination: true },
    });
  }

  // 📌 Hapus semua wishlist milik user
  static async deleteAllWishlistsByUser(user_id: string) {
    return await prisma.wishlist.deleteMany({
      where: { user_id },
    });
  }
}
