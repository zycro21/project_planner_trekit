import multer from "multer";
import path from "path";
import fs from "fs";

// Pastikan folder `destination_image_save` ada
const destinationFolder = path.resolve(__dirname, "../destination_image_save");
if (!fs.existsSync(destinationFolder)) {
  fs.mkdirSync(destinationFolder, { recursive: true });
}

// Konfigurasi storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, destinationFolder); // Simpan di `destination_image_save`
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// Filter hanya gambar yang diperbolehkan
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("File harus berupa gambar"), false);
  }
  cb(null, true);
};

// Middleware untuk upload multiple images (maksimal 5 gambar)
export const upload = multer({ storage, fileFilter });

export const uploadImages = upload.array("images", 10);
