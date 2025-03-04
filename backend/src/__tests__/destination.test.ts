import request from "supertest";
import app from "../app"; // Import Express app utama
import { DestinationModel } from "../models/Destination";
import { PrismaClient, Prisma } from "@prisma/client"; // Import Prisma Client
import { Decimal } from "@prisma/client/runtime/library";
import jwt from "jsonwebtoken"; // Import JWT

const prisma = new PrismaClient();
let testToken: string; // Simpan token di sini

describe("GET /api/destinations/destinations", () => {
  beforeAll(async () => {
    // Buat token untuk user dengan role USER
    testToken = jwt.sign(
      { user_id: "test123", role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    const dummyDestinations = Array.from({ length: 50 }, (_, i) => ({
      destination_id: `D${i + 1}`,
      name: `Destinasi ${i + 1}`,
      country: `Negara ${(i % 5) + 1}`, // 5 negara berbeda
      city: `Kota ${(i % 10) + 1}`, // 10 kota berbeda
    }));

    await prisma.destination.createMany({ data: dummyDestinations });
  });

  afterAll(async () => {
    await prisma.destination.deleteMany({});
    await prisma.$disconnect();
  });

  test("✅ Harus mengembalikan semua destinasi (tanpa filter)", async () => {
    const res = await request(app)
      .get("/api/destinations/destinations")
      .set("Authorization", `Bearer ${testToken}`); // 🔥 Tambahkan token

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.total).toBeGreaterThan(0);
  });

  test("✅ Harus mengembalikan destinasi berdasarkan pencarian `search`", async () => {
    const res = await request(app)
      .get("/api/destinations/destinations?search=Destinasi 10")
      .set("Authorization", `Bearer ${testToken}`); // 🔥 Tambahkan token

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe("Destinasi 10");
  });

  test("❌ Harus mengembalikan error jika terjadi kesalahan di server", async () => {
    const mockFindAll = jest
      .spyOn(DestinationModel, "findAll")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get("/api/destinations/destinations")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Terjadi kesalahan server");

    mockFindAll.mockRestore(); // 🔥 Hanya restore mock ini
  });
});

describe("GET /api/destinations/destinations/:id", () => {
  let testDestinationId: string;

  beforeAll(async () => {
    testToken = jwt.sign(
      { user_id: "test123", role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    const testDestination = await prisma.destination.create({
      data: {
        destination_id: "D999",
        name: "Testing Destination",
        country: "Testland",
        city: "Test City",
      },
    });

    testDestinationId = testDestination.destination_id;
  });

  afterAll(async () => {
    await prisma.destination.deleteMany({
      where: { destination_id: "D999" },
    });
    await prisma.$disconnect();
  });

  test("✅ Harus mengembalikan destinasi berdasarkan ID yang valid", async () => {
    const res = await request(app)
      .get(`/api/destinations/destinations/${testDestinationId}`)
      .set("Authorization", `Bearer ${testToken}`); // 🔥 Tambahkan token

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("destination_id", testDestinationId);
    expect(res.body).toHaveProperty("name", "Testing Destination");
  });

  test("❌ Harus mengembalikan 404 jika ID destinasi tidak ditemukan", async () => {
    const res = await request(app)
      .get("/api/destinations/destinations/DOES_NOT_EXIST")
      .set("Authorization", `Bearer ${testToken}`); // 🔥 Tambahkan token

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Destinasi tidak ditemukan");
  });

  test("❌ Harus mengembalikan 400 jika ID tidak valid", async () => {
    const res = await request(app)
      .get("/api/destinations/destinations/invalid@123")
      .set("Authorization", `Bearer ${testToken}`); // 🔥 Tambahkan token

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message", "ID destinasi tidak valid");
  });

  test("❌ Harus mengembalikan error 500 jika ada masalah server", async () => {
    const mockFindById = jest
      .spyOn(DestinationModel, "findById")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get(`/api/destinations/destinations/${testDestinationId}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message", "Terjadi kesalahan server");

    mockFindById.mockRestore();
  });
});

describe("POST /api/destinations/destinations", () => {
  beforeAll(() => {
    testToken = jwt.sign(
      { user_id: "test123", role: "ADMIN" }, // 🔥 Pastikan role bisa buat destinasi
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Harus berhasil membuat destinasi baru", async () => {
    jest.spyOn(DestinationModel, "create").mockResolvedValue({
      destination_id: "D100",
      name: "Pantai Indah",
      country: "Indonesia",
      city: "Bali",
      latitude: new Decimal("-8.40950000000000000000"),
      longitude: new Decimal("115.18890000000000000000"),
      description: "Pantai yang indah",
      images: [
        { image_id: "IMG1", destination_id: "D100", image_url: "image1.jpg" },
        { image_id: "IMG2", destination_id: "D100", image_url: "image2.jpg" },
      ],
    });

    const res = await request(app)
      .post("/api/destinations/destinations")
      .set("Authorization", `Bearer ${testToken}`)
      .field("name", "Pantai Indah")
      .field("country", "Indonesia")
      .field("city", "Bali")
      .field("latitude", "-8.4095")
      .field("longitude", "115.1889")
      .field("description", "Pantai yang indah")
      .attach("images", Buffer.from("dummy image"), "image1.jpg") // ✅ Dummy image
      .attach("images", Buffer.from("dummy image"), "image2.jpg");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("destination_id", "D100");
    expect(res.body).toHaveProperty("name", "Pantai Indah");
  });

  test("❌ Harus mengembalikan 400 jika input tidak valid", async () => {
    const res = await request(app)
      .post("/api/destinations/destinations")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        country: "Indonesia",
        city: "Bali",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "Nama, negara, dan kota harus diisi"
    );
  });

  test("❌ Harus mengembalikan 409 jika destinasi sudah ada", async () => {
    jest.spyOn(DestinationModel, "create").mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        "Destinasi dengan nama ini sudah ada",
        {
          code: "P2002",
          clientVersion: "6.4.1",
        }
      )
    );

    const res = await request(app)
      .post("/api/destinations/destinations")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        name: "Pantai Indah",
        country: "Indonesia",
        city: "Bali",
      });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty(
      "message",
      "Destinasi dengan nama ini sudah ada"
    );
  });

  test("❌ Harus mengembalikan 500 jika terjadi kesalahan server", async () => {
    jest
      .spyOn(DestinationModel, "create")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .post("/api/destinations/destinations")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        name: "Pantai Indah",
        country: "Indonesia",
        city: "Bali",
      });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message", "Terjadi kesalahan server");
  });
});

describe("PUT /api/destinations/destinations/:id", () => {
  beforeAll(() => {
    testToken = jwt.sign(
      { user_id: "test123", role: "ADMIN" }, // 🔥 Pastikan role bisa update destinasi
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("✅ Harus berhasil mengupdate destinasi", async () => {
    jest.spyOn(DestinationModel, "findById").mockResolvedValue({
      destination_id: "D100",
      name: "Pantai Indah",
      country: "Indonesia",
      city: "Bali",
      latitude: new Decimal("-8.40950000000000000000"), //
      longitude: new Decimal("115.18890000000000000000"), //
      description: "Pantai yang indah",
      images: [],
    });

    jest.spyOn(DestinationModel, "update").mockResolvedValue({
      destination_id: "D100",
      name: "Pantai Baru",
      country: "Indonesia",
      city: "Bali",
      description: "Pantai yang lebih indah",
      latitude: new Decimal("-8.40950000000000000000"), //
      longitude: new Decimal("115.18890000000000000000"), //
      images: [],
    });

    const res = await request(app)
      .put("/api/destinations/destinations/D100")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ name: "Pantai Baru", description: "Pantai yang lebih indah" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("name", "Pantai Baru");
    expect(res.body).toHaveProperty("description", "Pantai yang lebih indah");
  });

  test("❌ Harus mengembalikan 400 jika mencoba mengubah `destination_id`, `country`, atau `city`", async () => {
    const res = await request(app)
      .put("/api/destinations/destinations/D100")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        destination_id: "D999",
        country: "Malaysia",
        city: "Kuala Lumpur",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "destination_id, country, dan city tidak boleh diubah"
    );
  });

  test("❌ Harus mengembalikan 404 jika destinasi tidak ditemukan", async () => {
    jest.spyOn(DestinationModel, "findById").mockResolvedValue(null);

    const res = await request(app)
      .put("/api/destinations/destinations/D999")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ name: "Pantai Baru" });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Destinasi tidak ditemukan");
  });

  test("❌ Harus mengembalikan 409 jika nama destinasi sudah digunakan", async () => {
    jest.spyOn(DestinationModel, "findById").mockResolvedValue({
      destination_id: "D100",
      name: "Pantai Indah",
      country: "Indonesia",
      city: "Bali",
      description: "Pantai yang indah",
      latitude: new Decimal("-8.40950000000000000000"), //
      longitude: new Decimal("115.18890000000000000000"), //
      images: [],
    });

    jest.spyOn(DestinationModel, "findByName").mockResolvedValue({
      destination_id: "D200",
      name: "Pantai Baru",
      country: "Indonesia",
      city: "Bali",
      description: "Pantai yang indah",
      latitude: new Decimal("-8.40950000000000000000"), //
      longitude: new Decimal("115.18890000000000000000"), //
    });

    const res = await request(app)
      .put("/api/destinations/destinations/D100")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ name: "Pantai Baru" });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty(
      "message",
      "Nama destinasi sudah digunakan"
    );
  });

  test("❌ Harus mengembalikan 500 jika terjadi kesalahan server", async () => {
    jest
      .spyOn(DestinationModel, "findById")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .put("/api/destinations/destinations/D100")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ name: "Pantai Baru" });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message", "Terjadi kesalahan server");
  });
});

describe("DELETE /api/destinations/destinations/:id", () => {
  beforeAll(() => {
    testToken = jwt.sign(
      { user_id: "test123", role: "ADMIN" }, // 🔥 Role harus bisa hapus destinasi
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("✅ Harus berhasil menghapus destinasi", async () => {
    jest.spyOn(DestinationModel, "findById").mockResolvedValue({
      destination_id: "D100",
      name: "Pantai Indah",
      country: "Indonesia",
      city: "Bali",
      latitude: new Decimal("-8.40950000000000000000"),
      longitude: new Decimal("115.18890000000000000000"),
      description: "Pantai yang indah",
      images: [], // Tidak ada gambar
    });

    jest.spyOn(DestinationModel, "delete").mockResolvedValue({} as any);

    const res = await request(app)
      .delete("/api/destinations/destinations/D100")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Destinasi berhasil dihapus");
  });

  test("❌ Harus mengembalikan 404 jika destinasi tidak ditemukan", async () => {
    jest.spyOn(DestinationModel, "findById").mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/destinations/destinations/D999")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Destinasi tidak ditemukan");
  });

  test("❌ Harus mengembalikan 500 jika terjadi kesalahan server", async () => {
    jest
      .spyOn(DestinationModel, "findById")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .delete("/api/destinations/destinations/D100")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message", "Terjadi kesalahan server");
  });
});
