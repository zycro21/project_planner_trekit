import { Request, Response, RequestHandler } from "express";
import { ItineraryModel } from "../models/Itinerary";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllItineraries: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { search, sortBy, sortOrder, limit, page, includeDestinations } =
      req.query;

    // Validasi sortBy
    const validSortFields = ["start_date", "end_date"];
    const sortByFixed =
      sortBy && validSortFields.includes(sortBy as string)
        ? (sortBy as "start_date" | "end_date")
        : undefined;

    // Validasi sortOrder
    const sortOrderFixed =
      sortOrder && ["asc", "desc"].includes((sortOrder as string).toLowerCase())
        ? (sortOrder as "asc" | "desc")
        : undefined;

    // Parsing limit & page dengan nilai default
    const limitNum = parseInt(limit as string) || 10;
    const pageNum = parseInt(page as string) || 1;

    if (isNaN(limitNum) || isNaN(pageNum) || limitNum < 1 || pageNum < 1) {
      res.status(400).json({
        message: "Parameter 'limit' dan 'page' harus angka positif",
      });
      return;
    }

    // Parsing includeDestinations menjadi boolean
    const includeDestinationsBool =
      typeof includeDestinations === "string" &&
      includeDestinations.toLowerCase() === "true";

    // Query ke database
    const { data, totalPages } = await ItineraryModel.findAll({
      search: search as string,
      sortBy: sortByFixed,
      sortOrder: sortOrderFixed,
      limit: limitNum,
      page: pageNum,
      includeDestinations: includeDestinationsBool,
    });

    // Perbaikan: Response dikembalikan sebagai objek dengan `data` dan `totalPages`
    res.json({ data, totalPages });
  } catch (error) {
    res.status(500).json({
      message: "Terjadi kesalahan server",
      itineraries: [],
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getItineraryById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || id.trim() === "" || id === "/") {
    res.status(404).json({ message: "Itinerary tidak ditemukan" });
    return;
  }

  try {
    const itinerary = await ItineraryModel.findById(id);

    if (!itinerary) {
      res.status(404).json({ message: "Itinerary tidak ditemukan" });
      return;
    }

    // Pastikan itinerary_destinations tidak undefined
    const destinations = itinerary.itinerary_destinations || [];

    res.json({
      itinerary_id: itinerary.itinerary_id,
      title: itinerary.title,
      description: itinerary.description,
      start_date: itinerary.start_date,
      end_date: itinerary.end_date,
      is_public: itinerary.is_public,
      user: itinerary.user, // Informasi user
      destinations: itinerary.itinerary_destinations.map((itineraryDest) => ({
        id: itineraryDest.id,
        destination: itineraryDest.destination || null, // Kirim seluruh objek destination
        day: itineraryDest.day,
        order_index: itineraryDest.order_index,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Terjadi kesalahan server",
      error: error.message,
    });
    return;
  }
};

export const getItinerariesByUserId = async (req: Request, res: Response) => {
  const { user_id } = req.params;

  try {
    if (!user_id) {
      res.status(400).json({ message: "User ID diperlukan." });
      return;
    }

    const itineraries = await ItineraryModel.findByUserId(user_id);

    if (!itineraries.length) {
      res.status(404).json({ message: "Tidak ada itinerary ditemukan." });
      return;
    }

    res.json(itineraries);
  } catch (error: any) {
    res.status(500).json({
      message: "Terjadi kesalahan server",
      error: error.message,
    });
  }
};

export const createItinerary = async (req: Request, res: Response) => {
  console.log("📌 [CREATE ITINERARY] Request masuk");
  console.log("📥 Data dari frontend:", req.body);

  const { user_id, title, description, start_date, end_date, destinations } =
    req.body;

  // 🔹 Validasi input utama
  if (!user_id || !title || !start_date || !end_date) {
    console.log("❌ Validasi gagal: Data wajib belum lengkap");
    res.status(400).json({
      message: "user_id, title, start_date, dan end_date wajib diisi.",
    });
    return;
  }

  console.log("✅ Validasi data berhasil");

  // 🔹 Konversi tanggal ke Date object dan validasi
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  if (isNaN(startDate.getTime())) {
    console.log("❌ Error: Format start_date tidak valid");
    res.status(400).json({ message: "Format start_date tidak valid." });
    return;
  }
  if (isNaN(endDate.getTime())) {
    console.log("❌ Error: Format end_date tidak valid");
    res.status(400).json({ message: "Format end_date tidak valid." });
    return;
  }
  if (endDate < startDate) {
    console.log("❌ Error: end_date lebih kecil dari start_date");
    res.status(400).json({
      message: "end_date tidak boleh lebih kecil dari start_date.",
    });
    return;
  }

  console.log("✅ Tanggal valid:", { start_date, end_date });

  try {
    console.log("🚀 [DATABASE] Mulai proses create itinerary...");
    const newItinerary = await ItineraryModel.create(
      user_id,
      {
        title,
        description: description || "",
        start_date: startDate,
        end_date: endDate,
        is_public: true,
      },
      destinations
    );

    console.log("✅ [DATABASE] Itinerary berhasil dibuat:", newItinerary);
    res.status(201).json(newItinerary);
  } catch (error: any) {
    console.log("❌ [ERROR] Gagal membuat itinerary:", error.message);
    res.status(500).json({
      message: "Gagal membuat itinerary",
      error: error.message,
    });
  }
};

export const updateItinerary = async (req: Request, res: Response) => {
  const { id } = req.params; // itinerary_id
  const { title, description, start_date, end_date, is_public } = req.body;

  try {
    // 🔹 Cek apakah itinerary ada di database
    const existingItinerary = await ItineraryModel.findById(id);
    if (!existingItinerary) {
      res.status(404).json({ message: "Itinerary tidak ditemukan." });
      return;
    }

    // 🔹 Validasi: Minimal satu field harus diupdate
    if (
      !title &&
      !description &&
      !start_date &&
      !end_date &&
      is_public === undefined
    ) {
      res.status(400).json({
        message: "Minimal satu field harus diupdate.",
      });
      return;
    }

    // 🔹 Validasi format tanggal
    if (start_date && isNaN(Date.parse(start_date))) {
      res.status(400).json({ message: "Format start_date tidak valid." });
      return;
    }
    if (end_date && isNaN(Date.parse(end_date))) {
      res.status(400).json({ message: "Format end_date tidak valid." });
      return;
    }

    //  Validasi: end_date tidak boleh lebih kecil dari start_date
    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      res.status(400).json({
        message: "end_date tidak boleh lebih kecil dari start_date.",
      });
      return;
    }

    // Update itinerary
    const updatedItinerary = await ItineraryModel.update(id, {
      ...(title && { title }),
      ...(description && { description }),
      ...(start_date && { start_date: new Date(start_date) }),
      ...(end_date && { end_date: new Date(end_date) }),
      ...(is_public !== undefined && { is_public }),
    });

    res.status(200).json(updatedItinerary);
    return;
  } catch (error: any) {
    res.status(500).json({
      message: "Gagal memperbarui itinerary",
      error: error.message,
    });
    return;
  }
};

// Tambah destinasi ke itinerary (dengan replace jika duplikat)
export const addDestinationToItinerary = async (
  req: Request,
  res: Response
) => {
  const { id: itinerary_id } = req.params;
  const { destination_id, day, order_index } = req.body;

  try {
    // Cek input wajib
    if (
      !itinerary_id ||
      !destination_id ||
      day === undefined ||
      order_index === undefined
    ) {
      res.status(400).json({
        message:
          "itinerary_id, destination_id, day, dan order_index wajib diisi.",
      });
      return;
    }

    // Cek apakah itinerary ada
    const itinerary = await prisma.itinerary.findUnique({
      where: { itinerary_id },
    });
    if (!itinerary) {
      res.status(404).json({ message: "Itinerary tidak ditemukan." });
      return;
    }

    // Cek apakah destinasi ada
    const destination = await prisma.destination.findUnique({
      where: { destination_id },
    });
    if (!destination) {
      res.status(404).json({ message: "Destinasi tidak ditemukan." });
      return;
    }

    // Validasi angka positif
    if (day <= 0 || order_index < 0) {
      res
        .status(400)
        .json({ message: "day dan order_index harus angka positif." });
      return;
    }

    // Hapus data lama jika ada `order_index` atau `destination_id` yang sama di hari itu
    await prisma.itineraryDestination.deleteMany({
      where: {
        itinerary_id,
        day,
        OR: [{ order_index }, { destination_id }],
      },
    });

    // 🔹 Tambahkan data baru
    const newDestination = await ItineraryModel.addDestination(itinerary_id, {
      destination_id,
      day,
      order_index,
    });

    res.status(201).json(newDestination);
    return;
  } catch (error: any) {
    res.status(500).json({
      message: "Gagal menambahkan destinasi.",
      error: error.message,
    });
    return;
  }
};

// Hapus destinasi dari itinerary
export const removeDestinationFromItinerary = async (
  req: Request,
  res: Response
) => {
  const { itinerary_id, destination_id } = req.params;

  try {
    const result = await ItineraryModel.removeDestination(
      itinerary_id,
      destination_id
    );
    res.json({ message: "Destinasi berhasil dihapus", result });
    return;
  } catch (error: any) {
    res.status(500).json({
      message: "Gagal menghapus destinasi",
      error: error.message,
    });
    return;
  }
};

// Update order_index dan day dalam itinerary
export const updateDestinationOrderInItinerary = async (
  req: Request,
  res: Response
) => {
  const { id: itinerary_id, destination_id } = req.params;

  try {
    if (!itinerary_id || !destination_id) {
      res
        .status(400)
        .json({ message: "ID itinerary dan destinasi harus disertakan." });
      return;
    }

    // Pastikan order_index dan day dikirim dan berupa angka
    if (
      !req.body.hasOwnProperty("order_index") ||
      !req.body.hasOwnProperty("day") ||
      !Number.isInteger(req.body.order_index) ||
      !Number.isInteger(req.body.day)
    ) {
      res
        .status(400)
        .json({ message: "order_index dan day harus diisi dan berupa angka." });
      return;
    }

    const { order_index, day } = req.body;

    const itinerary = await prisma.itinerary.findUnique({
      where: { itinerary_id },
    });

    if (!itinerary) {
      res.status(404).json({ message: "Itinerary tidak ditemukan." });
      return;
    }

    const itineraryDestination = await prisma.itineraryDestination.findFirst({
      where: { itinerary_id, destination_id },
    });

    if (!itineraryDestination) {
      res
        .status(404)
        .json({ message: "Destinasi tidak ditemukan dalam itinerary." });
      return;
    }

    const updatedDestination = await ItineraryModel.updateOrderIndexAndDay(
      itinerary_id,
      destination_id,
      order_index,
      day
    );

    if (!updatedDestination || updatedDestination.count === 0) {
      res
        .status(404)
        .json({ message: "Destinasi tidak ditemukan dalam itinerary." });
      return;
    }

    res.status(200).json({
      message: "Urutan destinasi berhasil diperbarui",
      updatedDestination,
    });
    return;
  } catch (error: any) {
    console.error("Error saat memperbarui itinerary destination:", error);
    res.status(500).json({
      message: "Gagal memperbarui urutan destinasi",
      error: error.message,
    });
    return;
  }
};

export const deleteItinerary = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await ItineraryModel.delete(id);
    res.json({ message: "Itinerary berhasil dihapus" });
    return;
  } catch (error: any) {
    if (error.message === "Itinerary tidak ditemukan") {
      res.status(404).json({ message: "Itinerary tidak ditemukan" });
      return;
    }

    res.status(500).json({
      message: "Gagal menghapus itinerary",
    });
    return;
  }
};
