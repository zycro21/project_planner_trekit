import {
  PrismaClient,
  Prisma,
  Destination,
  DestinationImage,
} from "@prisma/client";

const prisma = new PrismaClient();

interface DestinationUpdateInput {
  name?: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  images?: string[]; // Array untuk multiple images
}

// Tipe yang dikembalikan oleh fungsi
type DestinationWithImages = Destination & { images?: DestinationImage[] };

export class DestinationModel {
  // Get all destinations with optional filters and pagination
  static async findAll({
    search,
    country,
    city,
    sort = "ASC",
    limit,
    offset,
  }: {
    search?: string;
    country?: string;
    city?: string;
    sort?: "ASC" | "DESC";
    limit?: number;
    offset?: number;
  }) {
    const whereCondition: Prisma.DestinationWhereInput = {
      ...(search
        ? { name: { contains: search, mode: Prisma.QueryMode.insensitive } }
        : {}),
      ...(country
        ? { country: { contains: country, mode: Prisma.QueryMode.insensitive } }
        : {}),
      ...(city
        ? { city: { contains: city, mode: Prisma.QueryMode.insensitive } }
        : {}),
    };

    const total = await prisma.destination.count({ where: whereCondition });

    const destinations = await prisma.destination.findMany({
      where: whereCondition,
      orderBy: {
        name: sort === "DESC" ? "desc" : "asc",
      },
      take: limit,
      skip: offset,
    });

    return { destinations, total };
  }

  // Get single destination by ID dengan opsi relasi
  static async findById(
    destination_id: string,
    includeImages: boolean = false
  ): Promise<DestinationWithImages | null> {
    if (!destination_id || typeof destination_id !== "string") return null; // Cek validitas ID

    return (await prisma.destination.findUnique({
      where: { destination_id },
      include: includeImages ? { images: true } : undefined, // Ambil images jika diminta
    })) as DestinationWithImages | null; // Paksa TypeScript mengenali `images`
  }

  // Generate destination_id secara otomatis
  static async generateDestinationId(
    country: string,
    city: string
  ): Promise<string> {
    // Format country & city agar tidak ada spasi (replace dengan "_")
    const countryFormatted = country.replace(/\s+/g, "_");
    const cityFormatted = city.replace(/\s+/g, "_");

    // Hitung jumlah destinasi yang sudah ada di negara & kota ini
    const count = await prisma.destination.count({
      where: {
        country,
        city,
      },
    });

    // Format angka menjadi 4 digit (misalnya: 0001, 0002, ...)
    const number = (count + 1).toString().padStart(4, "0");

    // Gabungkan format ID
    return `${countryFormatted}_${cityFormatted}_${number}`;
  }

  // Create New Destination + Multiple Images
  static async create(data: {
    name: string;
    country: string;
    city: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    images?: string[]; // Array untuk menyimpan banyak gambar
  }) {
    const destination_id = await this.generateDestinationId(
      data.country,
      data.city
    );

    // Buat destinasi baru beserta gambar-gambarnya
    await prisma.destination.create({
      data: {
        destination_id,
        name: data.name,
        country: data.country,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        images: {
          create:
            data.images?.map((image) => ({
              image_url: image,
              destination_id, // FK harus ada
            })) || [],
        },
      },
    });

    // Fetch destination lengkap dengan images setelah dibuat
    return await prisma.destination.findUnique({
      where: { destination_id },
      include: { images: true },
    });
  }

  // Cek apakah destinasi dengan nama yang sama sudah ada
  static async findByName(name: string, country: string, city: string) {
    if (!name || !country || !city) return null; // Pastikan parameter tidak kosong

    return await prisma.destination.findFirst({
      where: {
        name: { equals: name.trim(), mode: "insensitive" }, // Case insensitive & trim spasi
        country: { equals: country.trim(), mode: "insensitive" },
        city: { equals: city.trim(), mode: "insensitive" },
      },
    });
  }

  // Update destinasi berdasarkan ID tanpa menghapus gambar lama
  static async update(
    destination_id: string,
    data: Partial<DestinationUpdateInput>
  ) {
    return await prisma.$transaction(async (prisma) => {
      // Jika ada gambar baru, tambahkan ke database tanpa menghapus yang lama
      if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        await prisma.destinationImage.createMany({
          data: data.images.map((image) => ({
            image_url: image,
            destination_id,
          })),
        });
      }

      // Hapus `images` dari `data` sebelum menggunakannya dalam update
      const { images, ...updatedData } = data;

      // Pastikan hanya field yang diperbolehkan untuk diupdate
      const validUpdateFields =
        Object.keys(updatedData).length > 0 ? updatedData : {};

      // Update data destinasi
      return await prisma.destination.update({
        where: { destination_id },
        data: validUpdateFields, // Pastikan hanya kolom valid yang dikirim
        include: { images: true }, // Ambil juga gambar setelah update
      });
    });
  }

  // Delete destination by ID
  static async delete(destination_id: string) {
    try {
      return await prisma.$transaction(async (prisma) => {
        // Hapus semua gambar terkait destinasi
        await prisma.destinationImage.deleteMany({
          where: { destination_id },
        });

        // Hapus destinasi dari database
        return await prisma.destination.delete({
          where: { destination_id },
        });
      });
    } catch (error) {
      throw new Error("Destinasi tidak ditemukan atau gagal dihapus");
    }
  }
}
