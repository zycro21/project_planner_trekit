import { Request, Response } from "express";
import { prisma } from "../config/database";
import { DestinationModel } from "../models/destination";
import dotenv from "dotenv";
const { validationResult } = require("express-validator");

dotenv.config();

export const getAllDestinations = async (req: Request, res: Response) => {
  const { search, country, city, sort } = req.query;

  try {
    const destinations = await DestinationModel.findAll({
      search: search as string,
      country: country as string,
      city: city as string,
      sort: sort as "ASC" | "DESC",
    });

    res.json(destinations);
    return;
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server", error });
    return;
  }
};

export const getDestinationById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const destination = await DestinationModel.findById(id);

    if (!destination) {
      res.status(404).json({ message: "Destinasi tidak ditemukan" });
      return;
    }

    res.json(destination);
    return;
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server", error });
    return;
  }
};

export const createDestination = async (req: Request, res: Response) => {
  try {
    const destination = await DestinationModel.create(req.body);

    res.status(201).json(destination);
    return;
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server", error });
    return;
  }
};

export const updateDestination = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  // Validasi: Pastikan tidak mengirim `destination_id`
  if ("destination_id" in data) {
    res.status(400).json({ message: "destination_id tidak boleh diubah" });
    return;
  }

  try {
    const updatedDestination = await DestinationModel.update(id, data);
    res.json(updatedDestination);
    return;
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server", error });
    return;
  }
};

export const deleteDestination = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await DestinationModel.delete(id);

    res.json({ message: "Destinasi berhasil dihapus" });
    return;
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server", error });
    return;
  }
};
