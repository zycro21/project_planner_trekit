import { Request, Response } from "express";
import { ItineraryModel } from "../models/Itinerary";

export const getAllItineraries = async (req: Request, res: Response) => {
  try {
    const itineraries = await ItineraryModel.findAll(true);
    res.json(itineraries);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan server", error: error.message });
  }
};

export const getItineraryById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const itinerary = await ItineraryModel.findById(id, true);
    if (!itinerary) {
      res.status(404).json({ message: "Itinerary tidak ditemukan" });
      return;
    }
    res.json(itinerary);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan server", error: error.message });
  }
};

export const createItinerary = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newItinerary = await ItineraryModel.create(data);
    res.status(201).json(newItinerary);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Gagal membuat itinerary", error: error.message });
  }
};

export const updateItinerary = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const updatedItinerary = await ItineraryModel.update(id, data);
    res.json(updatedItinerary);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Gagal memperbarui itinerary", error: error.message });
  }
};

export const deleteItinerary = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await ItineraryModel.delete(id);
    res.json({ message: "Itinerary berhasil dihapus" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Gagal menghapus itinerary", error: error.message });
  }
};
