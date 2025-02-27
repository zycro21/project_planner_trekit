import { Request, Response } from "express";
import { ItineraryModel } from "../models/Itinerary";

export const getAllItineraries = async (req: Request, res: Response) => {
  try {
    const { search, sortBy, sortOrder, limit, page, includeDestinations } =
      req.query;

    // Validasi input query params
    const validSortFields = ["start_date", "end_date"];
    if (sortBy && !validSortFields.includes(sortBy as string)) {
      res.status(400).json({
        message: "sortBy harus 'start_date' atau 'end_date'",
      });
      return;
    }

    if (sortOrder && !["asc", "desc"].includes(sortOrder as string)) {
      res.status(400).json({
        message: "sortOrder harus 'asc' atau 'desc'",
      });
      return;
    }

    const limitNum = limit ? parseInt(limit as string) : 10;
    const pageNum = page ? parseInt(page as string) : 1;
    if (isNaN(limitNum) || isNaN(pageNum) || limitNum < 1 || pageNum < 1) {
      res.status(400).json({
        message: "limit dan page harus angka positif",
      });
      return;
    }

    const itineraries = await ItineraryModel.findAll({
      search: search as string,
      sortBy: sortBy as "start_date" | "end_date",
      sortOrder: sortOrder as "asc" | "desc",
      limit: limitNum,
      page: pageNum,
      includeDestinations: includeDestinations === "true",
    });

    res.json(itineraries);
    return;
  } catch (error: any) {
    res.status(500).json({
      message: "Terjadi kesalahan server",
      error: error.message,
    });
    return;
  }
};

export const getItineraryById = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validasi ID harus ada
  if (!id) {
    res.status(400).json({ message: "ID itinerary diperlukan" });
    return;
  }

  try {
    const itinerary = await ItineraryModel.findById(id);

    if (!itinerary) {
      res.status(404).json({ message: "Itinerary tidak ditemukan" });
      return;
    }

    res.json(itinerary);
    return;
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
  const { user_id, title, description, start_date, end_date, destinations } =
    req.body;

  // 🔹 Validasi input utama
  if (!user_id || !title || !start_date || !end_date) {
    res.status(400).json({
      message: "user_id, title, start_date, dan end_date wajib diisi.",
    });
    return;
  }

  if (typeof title !== "string" || title.trim().length === 0) {
    res
      .status(400)
      .json({ message: "Title harus berupa string dan tidak boleh kosong." });
    return;
  }

  if (title.length > 255) {
    res
      .status(400)
      .json({ message: "Title tidak boleh lebih dari 255 karakter." });
    return;
  }

  // 🔹 Konversi tanggal ke Date object dan validasi
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  if (isNaN(startDate.getTime())) {
    res.status(400).json({ message: "Format start_date tidak valid." });
    return;
  }
  if (isNaN(endDate.getTime())) {
    res.status(400).json({ message: "Format end_date tidak valid." });
    return;
  }
  if (endDate < startDate) {
    res
      .status(400)
      .json({ message: "end_date tidak boleh lebih kecil dari start_date." });
    return;
  }

  try {
    const newItinerary = await ItineraryModel.create(
      user_id,
      {
        title,
        description: description || "",
        start_date: startDate,
        end_date: endDate,
        is_public: true, // Default is_public ke true
      },
      destinations // Daftar destinasi (opsional)
    );

    res.status(201).json(newItinerary);
    return;
  } catch (error: any) {
    res.status(500).json({
      message: "Gagal membuat itinerary",
      error: error.message,
    });
    return;
  }
};

export const updateItinerary = async (req: Request, res: Response) => {
  const { id } = req.params; // itinerary_id
  const { title, description, start_date, end_date, is_public } = req.body;

  try {
    // Validasi: Pastikan ada setidaknya satu field yang diupdate
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

    const updatedItinerary = await ItineraryModel.update(id, {
      ...(title && { title }),
      ...(description && { description }),
      ...(start_date && { start_date: new Date(start_date) }),
      ...(end_date && { end_date: new Date(end_date) }),
      ...(is_public !== undefined && { is_public }),
    });

    res.json(updatedItinerary);
  } catch (error: any) {
    res.status(500).json({
      message: "Gagal memperbarui itinerary",
      error: error.message,
    });
  }
};

// Tambah destinasi ke itinerary
export const addDestinationToItinerary = async (
  req: Request,
  res: Response
) => {
  const { itinerary_id, destination_id, day, order_index } = req.body;

  try {
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

    const newDestination = await ItineraryModel.addDestination(itinerary_id, {
      destination_id,
      day,
      order_index,
    });

    res.status(201).json(newDestination);
    return;
  } catch (error: any) {
    res.status(500).json({
      message: "Gagal menambahkan destinasi",
      error: error.message,
    });
    return;
  }
};

// 🔹 Hapus destinasi dari itinerary
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

// 🔹 Update order_index dan day dalam itinerary
export const updateDestinationOrderInItinerary = async (
  req: Request,
  res: Response
) => {
  const { itinerary_id, destination_id } = req.params;
  const { order_index, day } = req.body;

  try {
    if (order_index === undefined || day === undefined) {
      res.status(400).json({
        message: "order_index dan day harus diisi.",
      });
      return;
    }

    const updatedDestination = await ItineraryModel.updateOrderIndexAndDay(
      itinerary_id,
      destination_id,
      order_index,
      day
    );

    if (updatedDestination.count === 0) {
      res
        .status(404)
        .json({ message: "Destinasi tidak ditemukan dalam itinerary." });
      return;
    }

    res.json({
      message: "Urutan destinasi berhasil diperbarui",
      updatedDestination,
    });
    return;
  } catch (error: any) {
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
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Gagal menghapus itinerary",
    });
  }
};
