import { PrismaClient, Prisma, Review } from "@prisma/client";

const prisma = new PrismaClient();

interface ReviewUpdateInput {
  rating?: number;
  comment?: string;
}

// Review Model
export class ReviewModel {
  // Ambil semua review dengan filter & pagination
  static async findAll({
    destination_id,
    user_id,
    min_rating,
    sort = "DESC",
    limit,
    offset,
  }: {
    destination_id?: string;
    user_id?: string;
    min_rating?: number;
    sort?: "ASC" | "DESC";
    limit?: number;
    offset?: number;
  }) {
    const whereCondition: Prisma.ReviewWhereInput = {
      ...(destination_id ? { destination_id } : {}),
      ...(user_id ? { user_id } : {}),
      ...(min_rating ? { rating: { gte: min_rating } } : {}),
    };

    // Hitung total data sebelum pagination
    const total = await prisma.review.count({ where: whereCondition });

    // Ambil review dengan join user & destination
    const reviews = await prisma.review.findMany({
      where: whereCondition,
      include: {
        user: { select: { name: true } }, // Ambil nama user
        destination: { select: { name: true } }, // Ambil nama destinasi
      },
      orderBy: { created_at: sort === "DESC" ? "desc" : "asc" },
      take: limit || undefined, // `undefined` agar tidak error jika kosong
      skip: offset || undefined,
    });

    return {
      total,
      reviews,
      limit: limit || total, // Jika tidak ada limit, tampilkan semua
      offset: offset || 0,
    };
  }

  // Ambil review berdasarkan ID
  static async findById(review_id: string): Promise<Review | null> {
    return await prisma.review.findUnique({
      where: { review_id },
      include: {
        user: { select: { name: true } }, // Ambil nama user
        destination: { select: { name: true } }, // Ambil nama destinasi
      },
    });
  }

  // Generate review_id dengan format RVW-destination_id-0001
  static async generateReviewId(destination_id: string): Promise<string> {
    // Hitung jumlah review untuk destinasi ini
    const count = await prisma.review.count({
      where: { destination_id },
    });

    // Format nomor urut menjadi 4 digit (0001, 0002, ...)
    const number = (count + 1).toString().padStart(4, "0");

    // Gabungkan format ID
    return `RVW-${destination_id}-${number}`;
  }

  // Buat Review Baru
  static async create(data: {
    user_id: string;
    destination_id: string;
    rating: number;
    comment?: string;
  }) {
    const review_id = await this.generateReviewId(data.destination_id);

    return await prisma.review.create({
      data: { review_id, ...data }, // Tambahkan review_id yang sudah digenerate
    });
  }

  // Update Review
  static async update(
    review_id: string,
    data: { rating?: number; comment?: string }
  ) {
    return await prisma.review.update({
      where: { review_id },
      data,
    });
  }

  // Hapus Review
  static async delete(review_id: string) {
    return await prisma.review.delete({
      where: { review_id },
    });
  }

  // Ambil semua review berdasarkan destination_id dengan filter & pagination
  static async findAllDestination({
    destination_id,
    min_rating,
    sort = "DESC",
    limit,
    offset,
  }: {
    destination_id?: string;
    min_rating?: number;
    sort?: "ASC" | "DESC";
    limit?: number;
    offset?: number;
  }) {
    const whereCondition: Prisma.ReviewWhereInput = {
      ...(destination_id ? { destination_id } : {}),
      ...(min_rating ? { rating: { gte: min_rating } } : {}),
    };

    const total = await prisma.review.count({ where: whereCondition });

    const reviews = await prisma.review.findMany({
      where: whereCondition,
      include: {
        user: { select: { name: true } }, // Ambil nama user
      },
      orderBy: { created_at: sort === "DESC" ? "desc" : "asc" },
      take: limit,
      skip: offset,
    });

    return { reviews, total };
  }

  // Ambil semua review berdasarkan user_id dengan filter & pagination
  static async findAllUser({
    user_id,
    min_rating,
    sort = "DESC",
    limit,
    offset,
  }: {
    user_id?: string;
    min_rating?: number;
    sort?: "ASC" | "DESC";
    limit?: number;
    offset?: number;
  }) {
    const whereCondition: Prisma.ReviewWhereInput = {
      ...(user_id ? { user_id } : {}),
      ...(typeof min_rating !== "undefined"
        ? { rating: { gte: min_rating } }
        : {}),
    };

    const total = await prisma.review.count({ where: whereCondition });

    const reviews = await prisma.review.findMany({
      where: whereCondition,
      include: {
        destination: { select: { name: true, city: true, country: true } },
      },
      orderBy: { created_at: sort === "ASC" ? "asc" : "desc" },
      take: limit && limit > 0 ? limit : 10,
      skip: offset && offset >= 0 ? offset : 0,
    });

    return { reviews, total };
  }

  static async getAverageRating(
    destination_id: string
  ): Promise<number | null> {
    const result = await prisma.review.aggregate({
      _avg: { rating: true },
      where: { destination_id },
    });

    return result._avg.rating || null;
  }
}
