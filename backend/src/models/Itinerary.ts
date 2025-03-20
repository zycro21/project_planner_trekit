import { PrismaClient, Itinerary } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export class ItineraryModel {
  // Ambil semua itinerary dengan filter, sorting, dan pagination
  static async findAll({
    search,
    sortBy,
    sortOrder,
    limit = 10,
    page = 1,
    includeDestinations = false,
  }: {
    search?: string;
    sortBy?: "start_date" | "end_date";
    sortOrder?: "asc" | "desc";
    limit?: number;
    page?: number;
    includeDestinations?: boolean;
  }) {
    const safeLimit = Math.max(limit, 1); // Pastikan limit minimal 1
    const safePage = Math.max(page, 1); // Pastikan page minimal 1
    const skip = (safePage - 1) * safeLimit; // Hitung offset untuk pagination

    try {
      // Hitung total itinerary tanpa pagination (untuk totalPages)
      const totalCount = await prisma.itinerary.count({
        where: search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      });

      // Ambil itinerary sesuai pagination
      const result = await prisma.itinerary.findMany({
        where: search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},

        orderBy: sortBy
          ? { [sortBy]: sortOrder === "desc" ? "desc" : "asc" }
          : { created_at: "desc" },

        take: safeLimit,
        skip: skip,

        include: includeDestinations
          ? { itinerary_destinations: { include: { destination: true } } }
          : undefined,
      });

      // Hitung total halaman
      const totalPages = Math.ceil(totalCount / safeLimit);

      return { data: result, totalPages }; // Kembalikan data & total halaman
    } catch (error) {
      console.error("ERROR in Prisma Query:", error);
      throw error;
    }
  }

  // Ambil itinerary berdasarkan ID dengan data lengkap
  static async findById(itinerary_id: string) {
    return await prisma.itinerary.findUnique({
      where: { itinerary_id },
      include: {
        user: {
          select: {
            user_id: true,
            name: true,
            email: true,
          },
        },
        itinerary_destinations: {
          include: {
            destination: {
              select: {
                destination_id: true,
                name: true,
                country: true,
                city: true,
                latitude: true,
                longitude: true,
                description: true,
              },
            },
          },
          orderBy: { day: "asc" }, // Urutkan berdasarkan hari perjalanan
        },
      },
    });
  }

  // Get all itineraries by user_id with destinations
  static async findByUserId(user_id: string) {
    return await prisma.itinerary.findMany({
      where: { user_id },
      include: {
        itinerary_destinations: {
          include: {
            destination: true, // Menyertakan data destinasi
          },
        },
      },
    });
  }

  // Buat itinerary baru
  static async create(
    user_id: string,
    data: Omit<Itinerary, "itinerary_id" | "created_at" | "user_id">,
    destinations?: {
      destination_id: string;
      day?: number;
      order_index?: number;
    }[]
  ) {
    console.log("📌 [MODEL] Memulai proses create itinerary...");
    console.log("📥 Data yang diterima di model:", {
      user_id,
      data,
      destinations,
    });

    // Validasi input
    if (!data.title || !data.start_date || !data.end_date) {
      console.log("❌ [MODEL] Validasi gagal: data tidak lengkap");
      throw new Error("Title, start_date, dan end_date wajib diisi.");
    }

    if (data.title.length > 255) {
      console.log("❌ [MODEL] Error: Judul terlalu panjang");
      throw new Error("Judul itinerary tidak boleh lebih dari 255 karakter.");
    }

    // Konversi start_date & end_date ke format Date
    const startDate = data.start_date ? new Date(data.start_date) : null;
    const endDate = data.end_date ? new Date(data.end_date) : null;

    if (!startDate || isNaN(startDate.getTime())) {
      console.log("❌ [MODEL] Error: Format start_date tidak valid");
      throw new Error("Format start_date tidak valid.");
    }
    if (!endDate || isNaN(endDate.getTime())) {
      console.log("❌ [MODEL] Error: Format end_date tidak valid");
      throw new Error("Format end_date tidak valid.");
    }
    if (endDate < startDate) {
      console.log("❌ [MODEL] Error: end_date lebih kecil dari start_date");
      throw new Error("end_date tidak boleh lebih kecil dari start_date.");
    }

    console.log("✅ [MODEL] Validasi sukses. Membuat itinerary...");

    // Buat ID itinerary
    const itinerary_id = `ITIN-${user_id}-${uuidv4().slice(0, 8)}`;
    console.log("🆔 ID itinerary yang dibuat:", itinerary_id);

    try {
      return await prisma.$transaction(async (prisma) => {
        // Simpan itinerary di database
        console.log("🚀 [DATABASE] Menyimpan itinerary ke database...");
        const newItinerary = await prisma.itinerary.create({
          data: {
            itinerary_id,
            user_id,
            title: data.title,
            description: data.description || "",
            start_date: startDate,
            end_date: endDate,
            is_public: true,
          },
        });

        console.log("✅ [DATABASE] Itinerary berhasil disimpan");

        // Jika ada destinasi, tambahkan ke itinerary_destinations
        if (destinations && destinations.length > 0) {
          console.log("🚀 [DATABASE] Menambahkan destinasi ke itinerary...");
          const itineraryDestinations = destinations.map((dest) => ({
            id: `${itinerary_id}-${dest.destination_id}-${uuidv4().slice(
              0,
              5
            )}`,
            itinerary_id,
            destination_id: dest.destination_id,
            day: dest.day || null,
            order_index: dest.order_index || null,
          }));

          await prisma.itineraryDestination.createMany({
            data: itineraryDestinations,
          });

          console.log("✅ [DATABASE] Destinasi berhasil ditambahkan");
        }

        return newItinerary;
      });
    } catch (error) {
      console.log("❌ [ERROR] Gagal menyimpan itinerary:", (error as Error).message);
      throw error;
    }
  }

  // Update itinerary (tanpa mengubah destinasi)
  static async update(itinerary_id: string, data: Partial<Itinerary>) {
    return await prisma.itinerary.update({
      where: { itinerary_id },
      data,
    });
  }

  // Tambah destinasi ke itinerary
  static async addDestination(
    itinerary_id: string,
    destinationData: {
      destination_id: string;
      day: number;
      order_index: number;
    }
  ) {
    return await prisma.itineraryDestination.create({
      data: {
        id: `${itinerary_id}-${destinationData.destination_id}-${uuidv4().slice(
          0,
          5
        )}`,
        itinerary_id,
        destination_id: destinationData.destination_id,
        day: destinationData.day,
        order_index: destinationData.order_index,
      },
    });
  }

  // Hapus destinasi dari itinerary
  static async removeDestination(itinerary_id: string, destination_id: string) {
    return await prisma.itineraryDestination.deleteMany({
      where: { itinerary_id, destination_id },
    });
  }

  // Update urutan destinasi dalam itinerary
  static async updateOrderIndexAndDay(
    itinerary_id: string,
    destination_id: string,
    order_index: number,
    day: number
  ) {
    return await prisma.itineraryDestination.updateMany({
      where: { itinerary_id, destination_id },
      data: { order_index, day },
    });
  }

  // Hapus itinerary berdasarkan ID (dengan validasi)
  static async delete(itinerary_id: string) {
    // Cek apakah itinerary ada
    const itinerary = await prisma.itinerary.findUnique({
      where: { itinerary_id },
    });

    if (!itinerary) {
      throw new Error("Itinerary tidak ditemukan");
    }

    // Hapus itinerary (destinasi akan ikut terhapus karena onDelete: Cascade)
    return await prisma.itinerary.delete({
      where: { itinerary_id },
    });
  }
}
