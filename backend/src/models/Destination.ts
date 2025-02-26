import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DestinationUpdateInput {
  name?: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  image_url?: string;
}

export class DestinationModel {
  // Get all destinations with optional filters
  static async findAll({
    search,
    country,
    city,
    sort = "ASC",
  }: {
    search?: string;
    country?: string;
    city?: string;
    sort?: "ASC" | "DESC";
  }) {
    return await prisma.destinations.findMany({
      where: {
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        ...(country
          ? { country: { contains: country, mode: "insensitive" } }
          : {}),
        ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      },
      orderBy: {
        name: sort === "DESC" ? "desc" : "asc",
      },
    });
  }

  // Get single destination by ID
  static async findById(destination_id: string) {
    return await prisma.destinations.findUnique({
      where: { destination_id },
    });
  }

  // Create a new destination
  static async create(data: {
    destination_id: string;
    name: string;
    country: string;
    city: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    image_url?: string;
  }) {
    return await prisma.destinations.create({ data });
  }

  // Update destination by ID
  static async update(
    destination_id: string,
    data: DestinationUpdateInput
  ) {
    return await prisma.destinations.update({
      where: { destination_id },
      data,
    });
  }

  // Delete destination by ID
  static async delete(destination_id: string) {
    return await prisma.destinations.delete({
      where: { destination_id },
    });
  }
}
