import { PrismaClient, Itinerary } from "@prisma/client";

const prisma = new PrismaClient();

export class ItineraryModel {
  // ✅ Ambil semua itinerary (dengan opsi include destinasi)
  static async findAll(includeDestinations: boolean = false) {
    return await prisma.itinerary.findMany({
      include: includeDestinations
        ? { itinerary_destinations: true }
        : undefined,
    });
  }

  // ✅ Ambil itinerary berdasarkan ID
  static async findById(
    itinerary_id: string,
    includeDestinations: boolean = false
  ) {
    return await prisma.itinerary.findUnique({
      where: { itinerary_id },
      include: includeDestinations
        ? { itinerary_destinations: true }
        : undefined,
    });
  }

  // ✅ Buat itinerary baru
  static async create(data: Omit<Itinerary, "itinerary_id" | "created_at">) {
    return await prisma.itinerary.create({
      data: {
        ...data,
        itinerary_id: `ITIN-${Date.now()}`, // Format ID otomatis
      },
    });
  }

  // ✅ Update itinerary berdasarkan ID
  static async update(itinerary_id: string, data: Partial<Itinerary>) {
    return await prisma.itinerary.update({
      where: { itinerary_id },
      data,
    });
  }

  // ✅ Hapus itinerary berdasarkan ID
  static async delete(itinerary_id: string) {
    return await prisma.itinerary.delete({
      where: { itinerary_id },
    });
  }
}
