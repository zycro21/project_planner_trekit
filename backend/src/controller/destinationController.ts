import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { DestinationModel } from "../models/Destination";
import { PrismaClient, Prisma } from "@prisma/client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
const { validationResult } = require("express-validator");

dotenv.config();

export const getAllDestinations = async (req: Request, res: Response) => {
  const { search, country, city, sort, limit, offset } = req.query;

  // Validasi dan normalisasi query params
  const searchQuery = search ? String(search).trim() : undefined;
  const countryQuery = country ? String(country).trim() : undefined;
  const cityQuery = city ? String(city).trim() : undefined;
  const sortOrder = sort === "DESC" ? "DESC" : "ASC"; // Default ke "ASC" jika tidak valid

  // Konversi limit & offset ke number dengan nilai default
  const limitValue = limit ? parseInt(limit as string, 10) : 10; // Default: 10 data per halaman
  const offsetValue = offset ? parseInt(offset as string, 10) : 0; // Default: mulai dari awal

  try {
    const { destinations, total } = await DestinationModel.findAll({
      search: searchQuery,
      country: countryQuery,
      city: cityQuery,
      sort: sortOrder as "ASC" | "DESC",
      limit: limitValue,
      offset: offsetValue,
    });

    res.json({
      data: destinations,
      total,
      currentPage: Math.floor(offsetValue / limitValue) + 1,
      totalPages: Math.ceil(total / limitValue),
    });
  } catch (error) {
    res.status(500).json({
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};

export const getDestinationById = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Pastikan ID hanya berisi huruf, angka, atau karakter tertentu yang diizinkan
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
    res.status(400).json({ message: "ID destinasi tidak valid" });
    return;
  }

  try {
    const destination = await DestinationModel.findById(id);

    if (!destination) {
      res.status(404).json({ message: "Destinasi tidak ditemukan" });
      return;
    }

    res.json(destination);
  } catch (error) {
    res.status(500).json({
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};

export const createDestination = async (req: Request, res: Response) => {
  const { name, country, city, latitude, longitude, description } = req.body;

  // Validasi input
  if (!name || !country || !city) {
    res.status(400).json({ message: "Nama, negara, dan kota harus diisi" });
    return;
  }

  if (latitude && (latitude < -90 || latitude > 90)) {
    res.status(400).json({ message: "Latitude harus antara -90 dan 90" });
    return;
  }

  if (longitude && (longitude < -180 || longitude > 180)) {
    res.status(400).json({ message: "Longitude harus antara -180 dan 180" });
    return;
  }

  try {
    // Cek apakah destinasi sudah ada (manual check)
    const existingDestination = await prisma.destination.findFirst({
      where: { name, country, city },
    });

    if (existingDestination) {
      res.status(409).json({ message: "Destinasi dengan nama ini sudah ada" });
      return;
    }

    // Ambil file gambar dari multer (bisa multiple files)
    const images: string[] = req.files
      ? (req.files as Express.Multer.File[]).map((file) => file.filename)
      : [];

    const destination = await DestinationModel.create({
      name,
      country,
      city,
      latitude,
      longitude,
      description,
      images,
    });

    res.status(201).json(destination);
  } catch (error: any) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({ message: "Destinasi dengan nama ini sudah ada" });
      return;
    }
    console.error("Error saat membuat destinasi:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
    return;
  }
};

export const updateDestination = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // 🔄 Konversi deletedImages dari string JSON ke array jika perlu
    if (typeof data.deletedImages === "string") {
      try {
        data.deletedImages = JSON.parse(data.deletedImages);
      } catch (error) {
        console.log("❌ Gagal parse deletedImages:", error);
        data.deletedImages = [];
      }
    }

    // Validasi: Tidak boleh mengubah `destination_id`, `country`, atau `city`
    if ("destination_id" in data || "country" in data || "city" in data) {
      res.status(400).json({
        message: "destination_id, country, dan city tidak boleh diubah",
      });
      return;
    }

    // Cek apakah destinasi ada di database
    const existingData = await DestinationModel.findById(id);
    if (!existingData) {
      res.status(404).json({ message: "Destinasi tidak ditemukan" });
      return;
    }

    // Validasi jika ingin mengganti nama destinasi
    if (data.name) {
      if (!existingData.country || !existingData.city) {
        res.status(400).json({
          message: "Data destinasi tidak valid (country atau city null)",
        });
        return;
      }

      const existingDestination = await DestinationModel.findByName(
        data.name,
        existingData.country,
        existingData.city
      );

      if (existingDestination && existingDestination.destination_id !== id) {
        res.status(409).json({ message: "Nama destinasi sudah digunakan" });
        return;
      }
    }

    console.log("🔥 Gambar yang akan dihapus:", data.deletedImages);

    if (data.deletedImages && Array.isArray(data.deletedImages)) {
      await DestinationModel.deleteImages(id, data.deletedImages);
    }

    console.log("✅ Proses penghapusan gambar selesai");

    // 🟢 Proses gambar baru jika ada
    if (req.files && Array.isArray(req.files)) {
      data.images = req.files.map((file) => `/images/${file.filename}`);
    }

    // Update hanya kolom yang berubah
    const updatedDestination = await DestinationModel.update(id, data);

    res.json(updatedDestination);
    return;
  } catch (error: any) {
    res.status(500).json({
      message: "Terjadi kesalahan server",
      error: error.message,
    });
    return;
  }
};

export const deleteDestination = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Cek apakah destinasi ada & ambil juga gambar terkait
    const existingData = await DestinationModel.findById(id);
    if (!existingData) {
      res.status(404).json({ message: "Destinasi tidak ditemukan" });
      return;
    }

    // Pastikan existingData.images adalah array
    if (Array.isArray(existingData.images) && existingData.images.length > 0) {
      existingData.images.forEach((img) => {
        if (img.image_url) {
          try {
            const imagePath = path.join(
              __dirname,
              "../destination_image_save",
              img.image_url
            );
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath); // Hapus gambar
            }
          } catch (err) {
            console.error("Gagal menghapus gambar:", err);
          }
        }
      });
    }

    // Hapus destinasi dari database
    await DestinationModel.delete(id);

    res.json({ message: "Destinasi berhasil dihapus" });
  } catch (error) {
    res.status(500).json({
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
