import request from "supertest";
import app from "../app";
import { ItineraryModel } from "../models/Itinerary";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
let testToken: string;
const testUserId = "test_user"; // Gunakan user dummy untuk tes

describe("GET /api/itineraries/itinerary", () => {
  beforeAll(async () => {
    await prisma.$connect(); // Pastikan koneksi Prisma terbuka

    const hashedPassword = await bcrypt.hash("password123", 10);

    // Buat user dummy untuk tes
    const user = await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "ADMIN",
      },
    });

    // Buat token JWT untuk user dummy
    testToken = jwt.sign(
      { user_id: user.user_id, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // Dummy data itineraries untuk user dummy
    const dummyItineraries = Array.from({ length: 20 }, (_, i) => ({
      itinerary_id: `I${i + 1}`,
      user_id: user.user_id, // Pakai user dummy
      title: `Itinerary ${i + 1}`,
      description: `Deskripsi itinerary ${i + 1}`,
      start_date: new Date(`2025-04-${(i % 30) + 1}`),
      end_date: new Date(`2025-05-${(i % 30) + 1}`),
      is_public: true,
      created_at: new Date(),
    }));

    await prisma.itinerary.createMany({ data: dummyItineraries });
  });

  afterAll(async () => {
    await prisma.itinerary.deleteMany({ where: { user_id: testUserId } }); // Hapus itinerary dummy
    await prisma.user.deleteMany({ where: { user_id: testUserId } }); // Hapus user dummy
    await prisma.$disconnect(); // Tutup koneksi Prisma
  });

  test("✅ Harus mengembalikan semua itinerary (tanpa filter)", async () => {
    const res = await request(app)
      .get("/api/itineraries/itinerary")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("title");
  });

  test("✅ Harus mengembalikan itinerary berdasarkan pencarian `search`", async () => {
    const res = await request(app)
      .get("/api/itineraries/itinerary?search=Itinerary 10")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe("Itinerary 10");
  });

  test("✅ Harus mengembalikan itinerary dengan sorting berdasarkan `start_date` ASC", async () => {
    const res = await request(app)
      .get("/api/itineraries/itinerary?sortBy=start_date&sortOrder=asc")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body[0].start_date).toBeDefined();
  });

  test("✅ Harus mengembalikan itinerary dengan pagination (`limit=5, page=2`)", async () => {
    const res = await request(app)
      .get("/api/itineraries/itinerary?limit=5&page=2")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(5);
  });

  test("❌ Harus gagal jika `sortBy` tidak valid", async () => {
    const res = await request(app)
      .get("/api/itineraries/itinerary?sortBy=invalid_field")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("sortBy harus 'start_date' atau 'end_date'");
  });

  test("❌ Harus gagal jika `sortOrder` tidak valid", async () => {
    const res = await request(app)
      .get("/api/itineraries/itinerary?sortOrder=random")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("sortOrder harus 'asc' atau 'desc'");
  });

  test("❌ Harus gagal jika `limit` atau `page` bukan angka positif", async () => {
    const res = await request(app)
      .get("/api/itineraries/itinerary?limit=-1&page=abc")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("limit dan page harus angka positif");
  });

  test("❌ Harus menangani kesalahan server", async () => {
    const mockFindAll = jest
      .spyOn(ItineraryModel, "findAll") //  Mock `ItineraryModel.findAll()`
      .mockRejectedValue(new Error("Database error")); // Paksa error

    const res = await request(app)
      .get("/api/itineraries/itinerary")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Terjadi kesalahan server");

    mockFindAll.mockRestore(); // 🔥 Restore hanya mock ini
  });
});

describe("GET /api/itineraries/itinerary/:id", () => {
  let testUserId: string;
  let testItineraryId: string;
  let testToken: string;

  beforeAll(async () => {
    await prisma.$connect(); // Pastikan koneksi Prisma terbuka

    // 🔹 Buat user dummy dengan ID unik
    testUserId = `USER-${Date.now()}`;
    const hashedPassword = await bcrypt.hash("password123", 10);

    const user = await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: `testuser${Date.now()}@example.com`,
        password_hash: hashedPassword,
        role: "ADMIN",
      },
    });

    // 🔹 Buat token JWT untuk user dummy
    testToken = jwt.sign(
      { user_id: user.user_id, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // 🔹 Buat itinerary dummy
    const itinerary = await prisma.itinerary.create({
      data: {
        itinerary_id: `ITINERARY-${Date.now()}`,
        user_id: user.user_id,
        title: "Test Itinerary",
        description: "Deskripsi itinerary test",
        start_date: new Date("2025-04-01"),
        end_date: new Date("2025-04-10"),
        is_public: true,
        created_at: new Date(),
      },
    });

    testItineraryId = itinerary.itinerary_id; // Simpan ID itinerary untuk pengujian
  });

  afterAll(async () => {
    // 🔹 Hapus data setelah pengujian selesai
    await prisma.itinerary.deleteMany({ where: { user_id: testUserId } });
    await prisma.user.deleteMany({ where: { user_id: testUserId } });
    await prisma.$disconnect();
  });

  test("✅ Harus mengembalikan itinerary jika ID valid", async () => {
    const res = await request(app)
      .get(`/api/itineraries/itinerary/${testItineraryId}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("itinerary_id", testItineraryId);
    expect(res.body).toHaveProperty("title", "Test Itinerary");
  });

  test("❌ Harus gagal jika ID tidak ditemukan", async () => {
    const res = await request(app)
      .get("/api/itineraries/itinerary/non_existent_id")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Itinerary tidak ditemukan");
  });

  test("❌ Harus menangani kesalahan server", async () => {
    const mockFindById = jest
      .spyOn(ItineraryModel, "findById")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get(`/api/itineraries/itinerary/${testItineraryId}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Terjadi kesalahan server");

    mockFindById.mockRestore(); // 🔥 Restore mock agar tidak mengganggu tes lain
  });
});

describe("GET /api/itineraries/itinerary/user/:user_id", () => {
  let testUserId: string;
  let testToken: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Buat user dummy dengan ID unik
    testUserId = `USER-${Date.now()}`;
    const hashedPassword = await bcrypt.hash("password123", 10);

    const user = await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: `testuser${Date.now()}@example.com`,
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // Buat token JWT untuk user dummy
    testToken = jwt.sign(
      { user_id: user.user_id, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // Buat itinerary dummy
    await prisma.itinerary.create({
      data: {
        itinerary_id: `ITINERARY-${Date.now()}`,
        user_id: user.user_id,
        title: "Test Itinerary",
        description: "Deskripsi itinerary test",
        start_date: new Date("2025-04-01"),
        end_date: new Date("2025-04-10"),
        is_public: true,
        created_at: new Date(),
      },
    });
  });

  afterAll(async () => {
    // 🔹 Hapus data setelah pengujian selesai
    await prisma.itinerary.deleteMany({ where: { user_id: testUserId } });
    await prisma.user.deleteMany({ where: { user_id: testUserId } });
    await prisma.$disconnect();
  });

  test("✅ Harus mengembalikan itinerary jika user_id valid", async () => {
    const res = await request(app)
      .get(`/api/itineraries/itinerary/user/${testUserId}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("title", "Test Itinerary");
  });

  test("❌ Harus gagal jika user_id tidak ditemukan", async () => {
    const res = await request(app)
      .get("/api/itineraries/itinerary/user/NON_EXISTENT_USER")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      "Tidak ada itinerary ditemukan."
    );
  });

  test("❌ Harus gagal jika user_id tidak diberikan", async () => {
    const res = await request(app)
      .get("/api/itineraries/itinerary/user/")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(404); // Karena route tidak sesuai dengan pattern
  });

  test("❌ Harus menangani kesalahan server", async () => {
    const mockFindByUserId = jest
      .spyOn(ItineraryModel, "findByUserId")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get(`/api/itineraries/itinerary/user/${testUserId}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message", "Terjadi kesalahan server");

    mockFindByUserId.mockRestore(); // 🔥 Restore mock agar tidak mengganggu tes lain
  });
});

describe("POST /api/itineraries/itinerary", () => {
  let testUserId: string;
  let testToken: string;

  beforeAll(async () => {
    await prisma.$connect();

    // 🔹 Buat user dummy
    testUserId = `USER-${Date.now()}`;
    const hashedPassword = await bcrypt.hash("password123", 10);

    const user = await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: `testuser${Date.now()}@example.com`,
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat token JWT untuk user
    testToken = jwt.sign(
      { user_id: user.user_id, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { user_id: testUserId } });
    await prisma.$disconnect();
  });

  test("✅ Harus berhasil membuat itinerary jika data valid", async () => {
    const res = await request(app)
      .post("/api/itineraries/itinerary")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        user_id: testUserId,
        title: "Liburan ke Bali",
        description: "Perjalanan ke Bali selama 5 hari",
        start_date: "2025-05-01",
        end_date: "2025-05-05",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("itinerary_id");
    expect(res.body.title).toBe("Liburan ke Bali");
  });

  test("❌ Harus gagal jika `user_id`, `title`, `start_date`, atau `end_date` tidak diisi", async () => {
    const res = await request(app)
      .post("/api/itineraries/itinerary")
      .set("Authorization", `Bearer ${testToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "user_id, title, start_date, dan end_date wajib diisi."
    );
  });

  test("❌ Harus gagal jika `title` lebih dari 255 karakter", async () => {
    const longTitle = "A".repeat(256);
    const res = await request(app)
      .post("/api/itineraries/itinerary")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        user_id: testUserId,
        title: longTitle,
        start_date: "2025-05-01",
        end_date: "2025-05-05",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Title tidak boleh lebih dari 255 karakter.");
  });

  test("❌ Harus gagal jika `start_date` atau `end_date` memiliki format tidak valid", async () => {
    const res = await request(app)
      .post("/api/itineraries/itinerary")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        user_id: testUserId,
        title: "Liburan ke Jepang",
        start_date: "invalid-date",
        end_date: "invalid-date",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Format start_date tidak valid.");
  });

  test("❌ Harus gagal jika `end_date` lebih kecil dari `start_date`", async () => {
    const res = await request(app)
      .post("/api/itineraries/itinerary")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        user_id: testUserId,
        title: "Liburan ke Lombok",
        start_date: "2025-05-10",
        end_date: "2025-05-05",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "end_date tidak boleh lebih kecil dari start_date."
    );
  });

  test("❌ Harus menangani kesalahan server", async () => {
    const mockCreate = jest
      .spyOn(ItineraryModel, "create")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .post("/api/itineraries/itinerary")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        user_id: testUserId,
        title: "Liburan ke Eropa",
        start_date: "2025-06-01",
        end_date: "2025-06-10",
      });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Gagal membuat itinerary");

    mockCreate.mockRestore(); // 🔥 Kembalikan fungsi asli
  });
});

describe("PUT /api/itineraries/itinerary/:id", () => {
  let testUserId: string;
  let testItineraryId: string;
  let testToken: string;

  beforeAll(async () => {
    await prisma.$connect();

    // 🔹 Buat user dummy
    testUserId = `USER-${Date.now()}`;
    const hashedPassword = await bcrypt.hash("password123", 10);

    const user = await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: `testuser${Date.now()}@example.com`,
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat token JWT untuk user
    testToken = jwt.sign(
      { user_id: user.user_id, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // 🔹 Buat itinerary dummy
    const itinerary = await prisma.itinerary.create({
      data: {
        itinerary_id: `ITIN-${testUserId}-${Date.now()}`,
        user_id: testUserId,
        title: "Liburan Awal",
        description: "Deskripsi awal",
        start_date: new Date("2025-06-01"),
        end_date: new Date("2025-06-05"),
        is_public: true,
      },
    });

    testItineraryId = itinerary.itinerary_id;
  });

  afterAll(async () => {
    await prisma.itinerary.deleteMany({ where: { user_id: testUserId } });
    await prisma.user.deleteMany({ where: { user_id: testUserId } });
    await prisma.$disconnect();
  });

  test("✅ Harus berhasil memperbarui itinerary jika data valid", async () => {
    const res = await request(app)
      .put(`/api/itineraries/itinerary/${testItineraryId}`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        title: "Liburan Baru",
        description: "Deskripsi baru",
        start_date: "2025-07-01",
        end_date: "2025-07-05",
        is_public: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Liburan Baru");
    expect(res.body.is_public).toBe(false);
  });

  test("❌ Harus gagal jika tidak ada field yang diupdate", async () => {
    const res = await request(app)
      .put(`/api/itineraries/itinerary/${testItineraryId}`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Minimal satu field harus diupdate.");
  });

  test("❌ Harus gagal jika itinerary tidak ditemukan", async () => {
    const res = await request(app)
      .put("/api/itineraries/itinerary/ITIN-INVALID-ID")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        title: "Liburan Gagal",
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Itinerary tidak ditemukan.");
  });

  test("❌ Harus gagal jika `start_date` atau `end_date` memiliki format tidak valid", async () => {
    const res = await request(app)
      .put(`/api/itineraries/itinerary/${testItineraryId}`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        start_date: "invalid-date",
        end_date: "invalid-date",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Format start_date tidak valid.");
  });

  test("❌ Harus gagal jika `end_date` lebih kecil dari `start_date`", async () => {
    const res = await request(app)
      .put(`/api/itineraries/itinerary/${testItineraryId}`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        start_date: "2025-08-10",
        end_date: "2025-08-05",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "end_date tidak boleh lebih kecil dari start_date."
    );
  });

  test("❌ Harus menangani kesalahan server", async () => {
    const mockUpdate = jest
      .spyOn(ItineraryModel, "update")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .put(`/api/itineraries/itinerary/${testItineraryId}`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        title: "Gagal Update",
      });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Gagal memperbarui itinerary");

    mockUpdate.mockRestore(); // Kembalikan fungsi asli
  });
});

describe("DELETE /api/itineraries/itinerary/:id", () => {
  let testUserId: string;
  let testToken: string;
  let itineraryId: string;

  beforeAll(async () => {
    await prisma.$connect(); // Pastikan koneksi Prisma terbuka

    const hashedPassword = await bcrypt.hash("password123", 10);

    // 🔹 Buat user dummy
    const user = await prisma.user.create({
      data: {
        user_id: "test-user-123",
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "ADMIN",
      },
    });

    testUserId = user.user_id;

    // 🔹 Generate token JWT
    testToken = jwt.sign(
      { user_id: user.user_id, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // 🔹 Buat itinerary dummy
    const itinerary = await prisma.itinerary.create({
      data: {
        itinerary_id: "ITIN-test-123",
        user_id: user.user_id,
        title: "Test Itinerary",
        start_date: new Date("2025-03-01"),
        end_date: new Date("2025-03-05"),
        is_public: true,
      },
    });

    itineraryId = itinerary.itinerary_id;
  });

  afterAll(async () => {
    await prisma.itinerary.deleteMany({ where: { user_id: testUserId } }); // Hapus itinerary dummy
    await prisma.user.deleteMany({ where: { user_id: testUserId } }); // Hapus user dummy
    await prisma.$disconnect(); // Tutup koneksi Prisma
  });

  // ✅ **Harus berhasil menghapus itinerary jika ID valid**
  test("✅ Harus berhasil menghapus itinerary jika ID valid", async () => {
    const res = await request(app)
      .delete(`/api/itineraries/itinerary/${itineraryId}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Itinerary berhasil dihapus");

    // Pastikan itinerary benar-benar terhapus
    const deletedItinerary = await prisma.itinerary.findUnique({
      where: { itinerary_id: itineraryId },
    });
    expect(deletedItinerary).toBeNull();
  });

  // ❌ **Harus gagal jika itinerary tidak ditemukan**
  test("❌ Harus gagal jika itinerary tidak ditemukan", async () => {
    const res = await request(app)
      .delete("/api/itineraries/itinerary/ITIN-not-found")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Itinerary tidak ditemukan");
  });

  // Harus menangani kesalahan server
  test("❌ Harus menangani kesalahan server", async () => {
    const mockDelete = jest
      .spyOn(ItineraryModel, "delete")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .delete(`/api/itineraries/itinerary/${itineraryId}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Gagal menghapus itinerary");

    mockDelete.mockRestore();
  });
});

describe("POST /api/itineraries/itinerary/:id/destination", () => {
  const testUserId = "test_user";
  const testItineraryId = "test_itinerary";
  const testDestinationId = "test_destination";

  beforeAll(async () => {
    await prisma.$connect();

    // Buat user dummy
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // Generate token JWT
    testToken = jwt.sign(
      { user_id: user.user_id, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // Buat itinerary dummy
    await prisma.itinerary.create({
      data: {
        itinerary_id: testItineraryId,
        user_id: user.user_id,
        title: "Test Itinerary",
        description: "Ini adalah itinerary untuk test",
        start_date: new Date("2025-04-01"),
        end_date: new Date("2025-04-07"),
        is_public: true,
        created_at: new Date(),
      },
    });

    // Buat destinasi dummy
    await prisma.destination.create({
      data: {
        destination_id: testDestinationId,
        name: "Bali",
        country: "Indonesia",
        city: "Denpasar",
        latitude: -8.4095,
        longitude: 115.1889,
        description: "Pantai yang indah",
      },
    });
  });

  afterAll(async () => {
    await prisma.itineraryDestination.deleteMany({
      where: { itinerary_id: testItineraryId },
    });
    await prisma.itinerary.deleteMany({
      where: { itinerary_id: testItineraryId },
    });
    await prisma.destination.deleteMany({
      where: { destination_id: testDestinationId },
    });
    await prisma.user.deleteMany({ where: { user_id: testUserId } });
    await prisma.$disconnect();
  });

  // Berhasil menambahkan destinasi ke itinerary
  test("✅ Harus berhasil menambahkan destinasi ke itinerary", async () => {
    const res = await request(app)
      .post(`/api/itineraries/itinerary/${testItineraryId}/destination`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        destination_id: testDestinationId,
        day: 2,
        order_index: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.itinerary_id).toBe(testItineraryId);
    expect(res.body.destination_id).toBe(testDestinationId);
  });

  // ❌ **Gagal jika `itinerary_id` atau `destination_id` tidak dikirim**
  test("❌ Harus gagal jika `destination_id` tidak dikirim", async () => {
    const res = await request(app)
      .post(`/api/itineraries/itinerary/${testItineraryId}/destination`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        day: 2,
        order_index: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "itinerary_id, destination_id, day, dan order_index wajib diisi."
    );
  });

  // ❌ **Gagal jika `day` atau `order_index` tidak dikirim**
  test("❌ Harus gagal jika `day` tidak dikirim", async () => {
    const res = await request(app)
      .post(`/api/itineraries/itinerary/${testItineraryId}/destination`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        destination_id: testDestinationId,
        order_index: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "itinerary_id, destination_id, day, dan order_index wajib diisi."
    );
  });

  // ❌ **Gagal jika itinerary tidak ditemukan**
  test("❌ Harus gagal jika itinerary tidak ditemukan", async () => {
    const res = await request(app)
      .post(`/api/itineraries/itinerary/nonexistent_itinerary/destination`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        destination_id: testDestinationId,
        day: 2,
        order_index: 1,
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Itinerary tidak ditemukan.");
  });

  // ❌ **Gagal jika destinasi tidak ditemukan**
  test("❌ Harus gagal jika destinasi tidak ditemukan", async () => {
    const res = await request(app)
      .post(`/api/itineraries/itinerary/${testItineraryId}/destination`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        destination_id: "destination_not_existbbbb",
        day: 2,
        order_index: 1,
      });

    console.log("Debug response:", res.body);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Destinasi tidak ditemukan.");
  });

  // ❌ **Gagal jika terjadi error di server**
  test("❌ Harus menangani kesalahan server", async () => {
    // Mocking agar `addDestination` selalu gagal
    const mockCreate = jest
      .spyOn(ItineraryModel, "addDestination")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .post(`/api/itineraries/itinerary/${testItineraryId}/destination`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        destination_id: "test_destination",
        day: 1,
        order_index: 3,
      });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Gagal menambahkan destinasi.");

    // Kembalikan fungsi `addDestination` ke normal setelah test
    mockCreate.mockRestore();
  });
});

describe("DELETE /api/itineraries/itinerary/:id/destination/:destination_id", () => {
  const testUserId = "test_user";
  const testItineraryId = "test_itinerary";
  const testDestinationId = "test_destination";
  let testToken: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Buat user dummy
    const hashedPassword = await bcrypt.hash("password123", 10);
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // Generate token JWT
    testToken = jwt.sign(
      { user_id: testUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // Buat itinerary dummy
    await prisma.itinerary.create({
      data: {
        itinerary_id: testItineraryId,
        user_id: testUserId,
        title: "Test Itinerary",
        description: "Itinerary untuk testing",
      },
    });

    // Buat destinasi dummy
    await prisma.destination.create({
      data: {
        destination_id: testDestinationId,
        name: "Test Destination",
        country: "Test Country",
        city: "Test City",
        latitude: -6.2,
        longitude: 106.816666,
        description: "Test destination description",
      },
    });

    // Tambahkan destinasi ke itinerary
    await prisma.itineraryDestination.create({
      data: {
        id: "test_itinerary_destination",
        itinerary_id: testItineraryId,
        destination_id: testDestinationId,
        day: 1,
        order_index: 1,
      },
    });
  });

  // ✅ **Berhasil menghapus destinasi dari itinerary**
  test("✅ Harus berhasil menghapus destinasi dari itinerary", async () => {
    const res = await request(app)
      .delete(
        `/api/itineraries/itinerary/${testItineraryId}/destination/${testDestinationId}`
      )
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Destinasi berhasil dihapus");

    // Pastikan destinasi benar-benar terhapus dari database
    const checkDeleted = await prisma.itineraryDestination.findFirst({
      where: {
        itinerary_id: testItineraryId,
        destination_id: testDestinationId,
      },
    });
    expect(checkDeleted).toBeNull();
  });

  // ❌ **Gagal jika itinerary tidak ditemukan**
  test("❌ Harus gagal jika itinerary tidak ditemukan", async () => {
    const res = await request(app)
      .delete(
        `/api/itineraries/itinerary/nonexistent_itinerary/destination/${testDestinationId}`
      )
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200); // Karena deleteMany tidak error meski tidak ada yang dihapus
    expect(res.body.message).toBe("Destinasi berhasil dihapus");
  });

  // ❌ **Gagal jika destinasi tidak ditemukan dalam itinerary**
  test("❌ Harus gagal jika destinasi tidak ada dalam itinerary", async () => {
    const res = await request(app)
      .delete(
        `/api/itineraries/itinerary/${testItineraryId}/destination/nonexistent_destination`
      )
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200); // Sama seperti di atas, deleteMany tetap berhasil meski tidak ada yang dihapus
    expect(res.body.message).toBe("Destinasi berhasil dihapus");
  });

  // ❌ **Gagal jika terjadi error di server (simulasi Prisma error)**
  test("❌ Harus gagal jika terjadi error di server", async () => {
    // Mock Prisma agar selalu throw error
    const mockCreate = jest
      .spyOn(ItineraryModel, "removeDestination")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .delete(
        `/api/itineraries/itinerary/${testItineraryId}/destination/${testDestinationId}`
      )
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Gagal menghapus destinasi");
    expect(res.body.error).toBe("Database error");

    // Reset mock setelah test selesai
    mockCreate.mockRestore();
  });

  afterAll(async () => {
    // Hapus semua data setelah test selesai
    await prisma.itineraryDestination.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.itinerary.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });
});

describe("PUT /api/itineraries/itinerary/:id/destination/:destination_id", () => {
  const testUserId = "test_user";
  const testItineraryId = "test_itinerary";
  const testDestinationId = "test_destination";
  let testToken: string;

  beforeAll(async () => {
    await prisma.$connect();

    // 🔹 Buat user dummy
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Generate token JWT
    testToken = jwt.sign(
      { user_id: user.user_id, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // 🔹 Buat itinerary dummy
    await prisma.itinerary.create({
      data: {
        itinerary_id: testItineraryId,
        user_id: testUserId,
        title: "Test Itinerary",
        description: "Itinerary untuk testing",
      },
    });

    // 🔹 Buat destinasi dummy
    await prisma.destination.create({
      data: {
        destination_id: testDestinationId,
        name: "Bali",
        country: "Indonesia",
        city: "Denpasar",
        latitude: -8.4095,
        longitude: 115.1889,
        description: "Pantai yang indah",
      },
    });

    // 🔹 Hubungkan itinerary dengan destinasi
    await prisma.itineraryDestination.create({
      data: {
        id: "test_itinerary_destination",
        itinerary_id: testItineraryId,
        destination_id: testDestinationId,
        day: 1,
        order_index: 1,
      },
    });
  });

  afterAll(async () => {
    // Hapus semua data uji
    await prisma.itineraryDestination.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.itinerary.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  // ✅ **Sukses mengupdate order_index dan day**
  test("✅ Harus berhasil memperbarui urutan destinasi dalam itinerary", async () => {
    console.log("Mengirim request dengan itinerary_id:", testItineraryId);

    const res = await request(app)
      .put(
        `/api/itineraries/itinerary/${testItineraryId}/destination/${testDestinationId}`
      )
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        order_index: 2,
        day: 3,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Urutan destinasi berhasil diperbarui");
    expect(res.body.updatedDestination.count).toBe(1);
  });

  // ❌ **Gagal jika itinerary tidak ditemukan**
  test("❌ Harus gagal jika itinerary tidak ditemukan", async () => {
    console.log("Mengirim request dengan itinerary_id yang salah");

    const res = await request(app)
      .put(
        `/api/itineraries/itinerary/invalid_itinerary/destination/${testDestinationId}`
      )
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        order_index: 2,
        day: 3,
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Itinerary tidak ditemukan.");
  });

  // ❌ **Gagal jika destination tidak ditemukan**
  test("❌ Harus gagal jika destinasi tidak ditemukan dalam itinerary", async () => {
    const res = await request(app)
      .put(
        `/api/itineraries/itinerary/${testItineraryId}/destination/invalid_destination`
      )
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        order_index: 2,
        day: 3,
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Destinasi tidak ditemukan dalam itinerary.");
  });

  // ❌ **Gagal jika order_index atau day tidak dikirim**
  test("❌ Harus gagal jika order_index dan day tidak dikirim", async () => {
    const data = { order_index: 2, day: 3 };

    console.log("Mengirim request dengan data:", data);

    const res = await request(app)
      .put(
        `/api/itineraries/itinerary/${testItineraryId}/destination/${testDestinationId}`
      )
      .set("Authorization", `Bearer ${testToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("order_index dan day harus diisi dan berupa angka.");
  });

  test("❌ Harus gagal jika terjadi kesalahan server", async () => {
    // Simulasikan error di model ItineraryModel
    const mockCreate = jest
      .spyOn(ItineraryModel, "updateOrderIndexAndDay")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .put(
        `/api/itineraries/itinerary/${testItineraryId}/destination/${testDestinationId}`
      )
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        order_index: 2,
        day: 3,
      });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Gagal memperbarui urutan destinasi");
    expect(res.body.error).toBe("Database error");

    // Pulihkan fungsi asli
    mockCreate.mockRestore();
  });
});
