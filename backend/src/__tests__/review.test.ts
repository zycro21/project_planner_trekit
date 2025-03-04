import request from "supertest";
import app from "../app";
import { ReviewModel } from "../models/Review";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import "jest-sorted";

dotenv.config();

const prisma = new PrismaClient();

describe("GET /api/reviews/reviews", () => {
  const testUserId = "test_user";
  const testItineraryId = "test_itinerary";
  const testDestinationId = "test_destination";
  let testToken: string;

  beforeAll(async () => {
    // Hash password user dummy
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Buat destinasi dummy
    await prisma.destination.create({
      data: {
        destination_id: testDestinationId,
        name: "Pantai Indah",
        country: "Indonesia",
        city: "Denpasar",
        latitude: -8.4095,
        longitude: 115.1889,
        description: "Pantai yang indah",
      },
    });

    // Buat user dummy
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "John Doe",
        email: `testuser${Date.now()}@example.com`,
        password_hash: hashedPassword,
        role: "ADMIN",
      },
    });

    // Generate token JWT
    testToken = jwt.sign(
      { user_id: testUserId, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // Buat banyak review dummy
    const reviewData = Array.from({ length: 20 }).map((_, i) => ({
      review_id: `REV-${Date.now() + i}`,
      destination_id: testDestinationId,
      user_id: testUserId,
      rating: Math.floor(Math.random() * 5) + 1, // Rating acak dari 1 - 5
      comment: `Review ke-${i + 1}`,
      created_at: new Date(Date.now() - i * 100000), // Tanggal dibuat mundur
    }));

    await prisma.review.createMany({ data: reviewData });

    // Tambahkan delay untuk memastikan data tersimpan
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Bersihkan data setelah test selesai
    await prisma.review.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.user.deleteMany();
  });

  // ✅ **Harus berhasil mengambil semua review**
  test("✅ Harus berhasil mengambil semua review", async () => {
    const res = await request(app)
      .get("/api/reviews/reviews")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("limit");
    expect(res.body).toHaveProperty("offset");
    expect(res.body.reviews).toBeInstanceOf(Array);
    expect(res.body.reviews.length).toBeGreaterThanOrEqual(1);
  });

  // ✅ **Harus berhasil mengambil review berdasarkan destination_id**
  test("✅ Harus berhasil mengambil review berdasarkan destination_id", async () => {
    const res = await request(app)
      .get(`/api/reviews/reviews?destination_id=${testDestinationId}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(
      res.body.reviews.every((r: any) => r.destination.name === "Pantai Indah")
    ).toBe(true);
  });

  // ✅ **Harus berhasil mengambil review berdasarkan user_id**
  test("✅ Harus berhasil mengambil review berdasarkan user_id", async () => {
    const res = await request(app)
      .get(`/api/reviews/reviews?user_id=${testUserId}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reviews.every((r: any) => r.user.name === "John Doe")).toBe(
      true
    );
  });

  // ✅ **Harus berhasil mengambil review dengan filter minimal rating**
  test("✅ Harus berhasil mengambil review dengan filter minimal rating", async () => {
    const res = await request(app)
      .get("/api/reviews/reviews?min_rating=4")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reviews.every((r: any) => r.rating >= 4)).toBe(true);
  });

  // ✅ **Harus berhasil mengambil review dengan sorting ASC**
  test("✅ Harus berhasil mengambil review dengan sorting ASC", async () => {
    const res = await request(app)
      .get("/api/reviews/reviews?sort=ASC")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reviews).toBeInstanceOf(Array);

    if (res.body.reviews.length > 1) {
      expect(
        new Date(res.body.reviews[0].created_at).getTime()
      ).toBeLessThanOrEqual(new Date(res.body.reviews[1].created_at).getTime());
    }
  });

  // ✅ **Harus berhasil mengambil review dengan limit dan offset**
  test("✅ Harus berhasil mengambil review dengan limit dan offset", async () => {
    const res = await request(app)
      .get("/api/reviews/reviews?limit=1&offset=1")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("limit", 1);
    expect(res.body).toHaveProperty("offset", 1);
    expect(res.body.reviews.length).toBe(1);
  });

  // ❌ **Harus gagal jika terjadi kesalahan server**
  test("❌ Harus gagal jika terjadi kesalahan server", async () => {
    const mockCreate = jest
      .spyOn(ReviewModel, "findAll")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get("/api/reviews/reviews")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Gagal mengambil review");

    mockCreate.mockRestore();
  });
});

describe("GET /api/reviews/:review_id", () => {
  const testUserId = "test_user";
  const testDestinationId = "test_destination";
  let testToken: string;
  let testReviewId: string;

  beforeAll(async () => {
    // Hash password untuk user dummy
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Buat destinasi dummy
    await prisma.destination.create({
      data: {
        destination_id: testDestinationId,
        name: "Pantai Indah",
        country: "Indonesia",
        city: "Denpasar",
        latitude: -8.4095,
        longitude: 115.1889,
        description: "Pantai yang indah",
      },
    });

    // Buat user dummy
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "John Doe",
        email: `testuser${Date.now()}@example.com`,
        password_hash: hashedPassword,
        role: "ADMIN",
      },
    });

    // Generate token JWT untuk user
    testToken = jwt.sign(
      { user_id: testUserId, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // Buat review dummy
    const review = await prisma.review.create({
      data: {
        review_id: `REV-${Date.now()}`,
        destination_id: testDestinationId,
        user_id: testUserId,
        rating: 5,
        comment: "Review terbaik!",
        created_at: new Date(),
      },
    });

    testReviewId = review.review_id;
  });

  afterAll(async () => {
    // Bersihkan data setelah test selesai
    await prisma.review.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.user.deleteMany();
  });

  // ✅ **Harus berhasil mengambil review berdasarkan ID**
  test("✅ Harus berhasil mengambil review berdasarkan ID", async () => {
    const res = await request(app)
      .get(`/api/reviews/${testReviewId}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.review).toHaveProperty("review_id", testReviewId);
    expect(res.body.review).toHaveProperty("comment", "Review terbaik!");
    expect(res.body.review).toHaveProperty("user");
    expect(res.body.review).toHaveProperty("destination");
  });

  // ❌ **Harus gagal jika review ID tidak ditemukan**
  test("❌ Harus gagal jika review ID tidak ditemukan", async () => {
    const res = await request(app)
      .get("/api/reviews/REV-NOTEXIST")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Review tidak ditemukan.");
  });

  // ❌ **Harus gagal jika terjadi kesalahan server**
  test("❌ Harus gagal jika terjadi kesalahan server", async () => {
    const mockFindById = jest
      .spyOn(ReviewModel, "findById")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get(`/api/reviews/${testReviewId}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Gagal mengambil review");

    mockFindById.mockRestore();
  });
});

describe("POST /api/reviews/review", () => {
  const testUserId = "test_user";
  const testDestinationId = "test_destination";
  let testToken: string;

  beforeAll(async () => {
    // Hash password untuk user dummy
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Buat destinasi dummy
    await prisma.destination.create({
      data: {
        destination_id: testDestinationId,
        name: "Pantai Indah",
        country: "Indonesia",
        city: "Denpasar",
        latitude: -8.4095,
        longitude: 115.1889,
        description: "Pantai yang indah",
      },
    });

    // Buat user dummy
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "John Doe",
        email: `testuser${Date.now()}@example.com`,
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // Generate token JWT untuk user
    testToken = jwt.sign(
      { user_id: testUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    // Bersihkan data setelah test selesai
    await prisma.review.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.user.deleteMany();
  });

  // ✅ **Harus berhasil membuat review baru**
  test("✅ Harus berhasil membuat review baru", async () => {
    const res = await request(app)
      .post("/api/reviews/review")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        user_id: testUserId,
        destination_id: testDestinationId,
        rating: 5,
        comment: "Review luar biasa!",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("review_id");
    expect(res.body).toHaveProperty("user_id", testUserId);
    expect(res.body).toHaveProperty("destination_id", testDestinationId);
    expect(res.body).toHaveProperty("rating", 5);
    expect(res.body).toHaveProperty("comment", "Review luar biasa!");
  });

  // ❌ **Harus gagal jika user_id tidak disertakan**
  test("❌ Harus gagal jika user_id tidak disertakan", async () => {
    const res = await request(app)
      .post("/api/reviews/review")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        destination_id: testDestinationId,
        rating: 4,
        comment: "Mantap!",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "User ID, Destination ID, dan Rating wajib diisi."
    );
  });

  // ❌ **Harus gagal jika destination_id tidak disertakan**
  test("❌ Harus gagal jika destination_id tidak disertakan", async () => {
    const res = await request(app)
      .post("/api/reviews/review")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        user_id: testUserId,
        rating: 4,
        comment: "Mantap!",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "User ID, Destination ID, dan Rating wajib diisi."
    );
  });

  // ❌ **Harus gagal jika rating tidak disertakan**
  test("❌ Harus gagal jika rating tidak disertakan", async () => {
    const res = await request(app)
      .post("/api/reviews/review")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        user_id: testUserId,
        destination_id: testDestinationId,
        comment: "Bagus banget!",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "User ID, Destination ID, dan Rating wajib diisi."
    );
  });

  // ❌ **Harus gagal jika terjadi kesalahan server**
  test("❌ Harus gagal jika terjadi kesalahan server", async () => {
    const mockCreate = jest
      .spyOn(ReviewModel, "create")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .post("/api/reviews/review")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        user_id: testUserId,
        destination_id: testDestinationId,
        rating: 5,
        comment: "Review luar biasa!",
      });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Gagal menambahkan review");

    mockCreate.mockRestore();
  });
});

describe("PUT /api/reviews/:review_id", () => {
  const testUserId = "test_user";
  const anotherUserId = "another_user";
  const adminUserId = "admin_user";
  const testDestinationId = "test_destination";
  let testReviewId: string;
  let userToken: string;
  let anotherUserToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Hash password untuk user dummy
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Buat destinasi dummy
    await prisma.destination.create({
      data: {
        destination_id: testDestinationId,
        name: "Pantai Indah",
        country: "Indonesia",
        city: "Denpasar",
        latitude: -8.4095,
        longitude: 115.1889,
        description: "Pantai yang indah",
      },
    });

    // Buat user biasa
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "John Doe",
        email: `testuser${Date.now()}@example.com`,
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // Buat user lain (bukan pemilik review)
    await prisma.user.create({
      data: {
        user_id: anotherUserId,
        name: "Jane Doe",
        email: `anotheruser${Date.now()}@example.com`,
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // Buat admin
    await prisma.user.create({
      data: {
        user_id: adminUserId,
        name: "Admin",
        email: `admin${Date.now()}@example.com`,
        password_hash: hashedPassword,
        role: "ADMIN",
      },
    });

    // Generate token JWT
    userToken = jwt.sign(
      { user_id: testUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    anotherUserToken = jwt.sign(
      { user_id: anotherUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    adminToken = jwt.sign(
      { user_id: adminUserId, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // Buat review dummy
    const newReview = await prisma.review.create({
      data: {
        review_id: "RVW-" + testDestinationId + "-0001",
        user_id: testUserId,
        destination_id: testDestinationId,
        rating: 4,
        comment: "Bagus banget!",
      },
    });

    testReviewId = newReview.review_id;
  });

  afterAll(async () => {
    // Bersihkan data setelah test selesai
    await prisma.review.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.user.deleteMany();
  });

  // ✅ **Harus berhasil memperbarui review sebagai pemilik**
  test("✅ Harus berhasil memperbarui review sebagai pemilik", async () => {
    const res = await request(app)
      .put(`/api/reviews/${testReviewId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 5, comment: "Sekarang lebih bagus!" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.updatedReview).toHaveProperty("rating", 5);
    expect(res.body.updatedReview).toHaveProperty(
      "comment",
      "Sekarang lebih bagus!"
    );
  });

  // ✅ **Admin bisa memperbarui review**
  test("✅ Admin bisa memperbarui review", async () => {
    const res = await request(app)
      .put(`/api/reviews/${testReviewId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ rating: 3, comment: "Kurang memuaskan." });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.updatedReview).toHaveProperty("rating", 3);
    expect(res.body.updatedReview).toHaveProperty(
      "comment",
      "Kurang memuaskan."
    );
  });

  // ❌ **Harus gagal jika user bukan pemilik review**
  test("❌ Harus gagal jika user bukan pemilik review", async () => {
    const res = await request(app)
      .put(`/api/reviews/${testReviewId}`)
      .set("Authorization", `Bearer ${anotherUserToken}`)
      .send({ rating: 2, comment: "Saya tidak suka." });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Anda tidak memiliki izin untuk mengupdate review ini."
    );
  });

  // ❌ **Harus gagal jika review tidak ditemukan**
  test("❌ Harus gagal jika review tidak ditemukan", async () => {
    const res = await request(app)
      .put(`/api/reviews/RVW-unknown-0001`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 5 });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Review tidak ditemukan.");
  });

  // ❌ **Harus gagal jika tidak ada field yang dikirim**
  test("❌ Harus gagal jika tidak ada field yang dikirim", async () => {
    const res = await request(app)
      .put(`/api/reviews/${testReviewId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Harus ada setidaknya satu kolom yang diupdate (rating atau comment)."
    );
  });

  // ❌ **Harus gagal jika terjadi kesalahan server**
  test("❌ Harus gagal jika terjadi kesalahan server", async () => {
    const mockUpdate = jest
      .spyOn(ReviewModel, "update")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .put(`/api/reviews/${testReviewId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 5 });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Gagal mengupdate review");

    mockUpdate.mockRestore();
  });
});

describe("DELETE /api/reviews/:review_id", () => {
  const testUserId = "test_user";
  const anotherUserId = "another_user";
  const adminUserId = "admin_user";
  const testDestinationId = "test_destination";
  let testReviewId: string;
  let userToken: string;
  let anotherUserToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Hash password untuk user dummy
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Buat destinasi dummy
    await prisma.destination.create({
      data: {
        destination_id: testDestinationId,
        name: "Pantai Indah",
        country: "Indonesia",
        city: "Denpasar",
        latitude: -8.4095,
        longitude: 115.1889,
        description: "Pantai yang indah",
      },
    });

    // Buat user biasa
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "John Doe",
        email: `testuser${Date.now()}@example.com`,
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // Buat user lain (bukan pemilik review)
    await prisma.user.create({
      data: {
        user_id: anotherUserId,
        name: "Jane Doe",
        email: `anotheruser${Date.now()}@example.com`,
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // Buat admin
    await prisma.user.create({
      data: {
        user_id: adminUserId,
        name: "Admin",
        email: `admin${Date.now()}@example.com`,
        password_hash: hashedPassword,
        role: "ADMIN",
      },
    });

    // Generate token JWT
    userToken = jwt.sign(
      { user_id: testUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    anotherUserToken = jwt.sign(
      { user_id: anotherUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    adminToken = jwt.sign(
      { user_id: adminUserId, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // Buat review dummy
    const newReview = await prisma.review.create({
      data: {
        review_id: "RVW-" + testDestinationId + "-0001",
        user_id: testUserId,
        destination_id: testDestinationId,
        rating: 4,
        comment: "Bagus banget!",
      },
    });

    testReviewId = newReview.review_id;
  });

  afterAll(async () => {
    await prisma.review.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.user.deleteMany();
  });

  // ✅ Pemilik review bisa menghapus review
  test("✅ Harus berhasil menghapus review sebagai pemilik", async () => {
    const res = await request(app)
      .delete(`/api/reviews/${testReviewId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Review berhasil dihapus.");
  });

  // ✅ Admin bisa menghapus review siapa saja
  test("✅ Admin bisa menghapus review", async () => {
    // Buat review baru untuk admin hapus
    const newReview = await prisma.review.create({
      data: {
        review_id: `RVW-${testDestinationId}-0002`,
        user_id: anotherUserId,
        destination_id: testDestinationId,
        rating: 3,
        comment: "Cukup bagus.",
      },
    });

    const res = await request(app)
      .delete(`/api/reviews/${newReview.review_id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Review berhasil dihapus.");
  });

  test("❌ Harus gagal jika user bukan pemilik review", async () => {
    // Buat review baru untuk dites
    const newReview = await prisma.review.create({
      data: {
        review_id: `RVW-${testDestinationId}-0003`,
        user_id: testUserId,
        destination_id: testDestinationId,
        rating: 5,
        comment: "Review untuk test hak akses.",
      },
    });

    const res = await request(app)
      .delete(`/api/reviews/${newReview.review_id}`)
      .set("Authorization", `Bearer ${anotherUserToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Anda tidak memiliki izin untuk menghapus review ini."
    );
  });

  // ❌ Gagal jika review tidak ditemukan
  test("❌ Harus gagal jika review tidak ditemukan", async () => {
    const res = await request(app)
      .delete("/api/reviews/RVW-NONEXISTENT-0001")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Review tidak ditemukan.");
  });

  // ❌ Gagal jika terjadi kesalahan server
  test("❌ Harus gagal jika terjadi kesalahan server", async () => {
    // Mock findById agar tidak 404
    const mockFindById = jest.spyOn(ReviewModel, "findById").mockResolvedValue({
      review_id: testReviewId,
      user_id: testUserId,
      destination_id: testDestinationId,
      created_at: new Date(),
      rating: 4,
      comment: "Bagus banget!",
      user: { name: "John Doe" },
      destination: { name: "Bali" },
    } as any);

    // Mock delete supaya mengembalikan error
    const mockDelete = jest
      .spyOn(ReviewModel, "delete")
      .mockRejectedValue(new Error("DB Error"));

    const res = await request(app)
      .delete(`/api/reviews/${testReviewId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Gagal menghapus review");

    // Kembalikan fungsi ke semula
    mockFindById.mockRestore();
    mockDelete.mockRestore();
  });
});

describe("GET /api/reviews/review/:destination_id", () => {
  const testDestinationId = "test_destination";
  let userToken: string;
  let anotherUserToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Buat destinasi dummy
    await prisma.destination.create({
      data: {
        destination_id: testDestinationId,
        name: "Pantai Indah",
        country: "Indonesia",
        city: "Denpasar",
        latitude: -8.4095,
        longitude: 115.1889,
        description: "Pantai yang indah",
      },
    });

    // Buat beberapa user dummy
    const userIds: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const userId = `user_dummy_${i}`;
      userIds.push(userId);

      await prisma.user.create({
        data: {
          user_id: userId,
          name: `User Dummy ${i}`,
          email: `dummy${i}@example.com`,
          password_hash: hashedPassword,
          role: "USER",
        },
      });
    }

    // Generate token JWT
    userToken = jwt.sign(
      { user_id: userIds[0], role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    anotherUserToken = jwt.sign(
      { user_id: userIds[1], role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    adminToken = jwt.sign(
      { user_id: "admin_user", role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // Buat 50 review dummy
    const reviewsData = [];
    for (let i = 1; i <= 50; i++) {
      const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
      const randomRating = Math.floor(Math.random() * 5) + 1;

      reviewsData.push({
        review_id: `RVW-${testDestinationId}-${String(i).padStart(4, "0")}`,
        user_id: randomUserId,
        destination_id: testDestinationId,
        rating: randomRating,
        comment: `Review ke-${i} dengan rating ${randomRating}`,
      });
    }

    await prisma.review.createMany({ data: reviewsData });
  });

  // ✅ Berhasil mengambil semua review berdasarkan destination_id
  test("✅ Harus berhasil mengambil semua review berdasarkan destination_id", async () => {
    const res = await request(app)
      .get(`/api/reviews/review/${testDestinationId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toBeInstanceOf(Array);
    expect(res.body.reviews.length).toBeGreaterThan(0);
  });

  // ✅ Berhasil mengambil review dengan filter rating minimum
  test("✅ Harus berhasil mengambil review dengan filter rating minimum", async () => {
    const res = await request(app)
      .get(`/api/reviews/review/${testDestinationId}?min_rating=4`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toBeInstanceOf(Array);
    res.body.reviews.forEach((review: any) => {
      expect(review.rating).toBeGreaterThanOrEqual(4);
    });
  });

  // ✅ Berhasil mengambil review dengan sorting ascending
  test("✅ Harus berhasil mengambil review dengan sorting ascending", async () => {
    const res = await request(app)
      .get(`/api/reviews/review/${testDestinationId}?sort=ASC`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toBeInstanceOf(Array);
    expect(res.body.reviews).toBeSortedBy("created_at", { descending: false });
  });

  // ✅ Berhasil mengambil review dengan limit dan offset (pagination)
  test("✅ Harus berhasil mengambil review dengan limit dan offset", async () => {
    const res = await request(app)
      .get(`/api/reviews/review/${testDestinationId}?limit=10&offset=10`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toBeInstanceOf(Array);
    expect(res.body.reviews.length).toBeLessThanOrEqual(10);
  });

  // ❌ Gagal jika destinasi tidak ditemukan
  test("❌ Harus gagal jika destinasi tidak ditemukan", async () => {
    const res = await request(app)
      .get("/api/reviews/review/invalid_destination")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200); // Harus tetap 200 tapi array kosong
    expect(res.body.reviews).toEqual([]);
  });

  // ❌ Gagal jika terjadi kesalahan server
  test("❌ Harus gagal jika terjadi kesalahan server", async () => {
    const mockTest = jest
      .spyOn(ReviewModel, "findAllDestination")
      .mockImplementationOnce(() => {
        throw new Error("Database error");
      });

    const res = await request(app)
      .get(`/api/reviews/review/${testDestinationId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Gagal mengambil review berdasarkan destinasi"
    );

    mockTest.mockRestore();
  });

  // Bersihkan data setelah semua test dalam blok ini selesai
  afterAll(async () => {
    await prisma.review.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.user.deleteMany();
  });
});

describe("GET /api/reviews/review/user/:user_id", () => {
  let userToken: string;
  let anotherUserToken: string;
  let adminToken: string;
  const testUserId = "user_tester";
  const anotherUserId = "user_dummy";
  const testDestinations = [
    "dest_1",
    "dest_2",
    "dest_3",
    "dest_4",
    "dest_5",
    "dest_6",
    "dest_7",
    "dest_8",
    "dest_9",
    "dest_10",
  ];

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Buat 1 user dummy saja
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "User Tester",
        email: "tester@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // Generate token JWT untuk user ini
    userToken = jwt.sign(
      { user_id: testUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // Buat beberapa destinasi dummy
    await prisma.destination.createMany({
      data: testDestinations.map((dest, index) => ({
        destination_id: dest,
        name: `Destinasi ${index + 1}`,
        country: "Indonesia",
        city: "Jakarta",
        latitude: -6.2,
        longitude: 106.8,
        description: `Deskripsi untuk destinasi ${index + 1}`,
      })),
    });

    // Buat review dummy untuk testUserId di banyak destinasi
    const reviewsData = testDestinations.map((destinationId, index) => ({
      review_id: `RVW-${testUserId}-${String(index + 1).padStart(4, "0")}`,
      user_id: testUserId,
      destination_id: destinationId,
      rating: index === 0 ? 5 : Math.floor(Math.random() * 5) + 1, // Pastikan ada satu review dengan rating 5
      comment: `Review ke-${index + 1} dengan rating ${
        Math.floor(Math.random() * 5) + 1
      }`,
      created_at: new Date(), // Pastikan ada `created_at`
    }));

    await prisma.review.createMany({ data: reviewsData });

    console.log("Data review berhasil dibuat:", await prisma.review.findMany());

    // Debugging: Pastikan data benar-benar masuk
    const totalReviews = await prisma.review.count({
      where: { user_id: testUserId },
    });
    const totalDestinations = await prisma.destination.count();
    console.log(`Total destinasi: ${totalDestinations}`);
    console.log(`Total review untuk ${testUserId}: ${totalReviews}`);

    const insertedReviews = await prisma.review.findMany({
      where: { user_id: testUserId },
      orderBy: { created_at: "desc" },
    });
    console.log("DEBUG: Review di Database sebelum test:", insertedReviews);
  });

  test("✅ Harus berhasil mengambil semua review berdasarkan user_id", async () => {
    const res = await request(app)
      .get(`/api/reviews/review/user/${testUserId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    console.log("DEBUG: API Response:", res.body);

    expect(res.body).toHaveProperty("reviews");
    expect(res.body.reviews).toBeInstanceOf(Array);
    expect(res.body.reviews.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty("total");
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  test("✅ Harus berhasil mengambil review dengan filter minimal rating", async () => {
    const res = await request(app)
      .get(`/api/reviews/review/user/${testUserId}?min_rating=4`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveProperty("reviews");
    expect(res.body.reviews).toBeInstanceOf(Array);
    expect(res.body.reviews.length).toBeGreaterThanOrEqual(1);
    expect(res.body.reviews.every((r: any) => r.rating >= 4)).toBe(true);
  });

  test("✅ Harus berhasil mengambil review dengan sorting ASC", async () => {
    const res = await request(app)
      .get(`/api/reviews/review/user/${testUserId}?sort=ASC`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveProperty("reviews");
    expect(res.body.reviews).toBeInstanceOf(Array);
    expect(res.body.reviews.length).toBeGreaterThan(1);

    const dates = res.body.reviews.map((r: any) => new Date(r.created_at));
    expect(dates).toEqual([...dates].sort((a, b) => a.getTime() - b.getTime()));
  });

  test("✅ Harus berhasil mengambil review dengan limit dan offset", async () => {
    const res = await request(app)
      .get(`/api/reviews/review/user/${testUserId}?limit=2&offset=2`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    console.log("DEBUG: Pagination Response:", res.body);

    expect(res.body).toHaveProperty("reviews");
    expect(res.body.reviews).toBeInstanceOf(Array);
    expect(res.body.limit).toBe(2);
    expect(res.body.offset).toBe(2);
    expect(res.body.reviews.length).toBeLessThanOrEqual(2);
  });

  test("❌ Harus gagal jika user tidak memiliki review", async () => {
    const res = await request(app)
      .get(`/api/reviews/review/user/nonexistent_user`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveProperty("reviews");
    expect(res.body.reviews).toBeInstanceOf(Array);
    expect(res.body.reviews.length).toBe(0);
    expect(res.body.total).toBe(0);
  });

  test("❌ Harus gagal jika terjadi kesalahan server", async () => {
    jest
      .spyOn(ReviewModel, "findAllUser")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get(`/api/reviews/review/user/${testUserId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(500);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty(
      "message",
      "Gagal mengambil review berdasarkan user"
    );
  });

  afterAll(async () => {
    await prisma.review.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.user.deleteMany();
  });
});

describe("GET /api/reviews/review/:destination_id/average-rating", () => {
  const testDestinationId = "test_destination_avg";
  let userToken: string;
  let anotherUserToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Buat destinasi dummy
    await prisma.destination.create({
      data: {
        destination_id: testDestinationId,
        name: "Gunung Indah",
        country: "Indonesia",
        city: "Bandung",
        latitude: -6.9147,
        longitude: 107.6098,
        description: "Gunung yang sangat indah",
      },
    });

    // Buat beberapa user dummy
    const userIds: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const userId = `user_dummy_avg_${i}`;
      userIds.push(userId);

      await prisma.user.create({
        data: {
          user_id: userId,
          name: `User Dummy ${i}`,
          email: `dummy_avg${i}@example.com`,
          password_hash: hashedPassword,
          role: "USER",
        },
      });
    }

    // Generate token JWT
    userToken = jwt.sign(
      { user_id: userIds[0], role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    anotherUserToken = jwt.sign(
      { user_id: userIds[1], role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    adminToken = jwt.sign(
      { user_id: "admin_user_avg", role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // Buat beberapa review dummy
    const reviewsData = [
      {
        review_id: "RVW-001",
        user_id: userIds[0],
        destination_id: testDestinationId,
        rating: 5,
        comment: "Mantap sekali!",
      },
      {
        review_id: "RVW-002",
        user_id: userIds[1],
        destination_id: testDestinationId,
        rating: 3,
        comment: "Biasa saja",
      },
      {
        review_id: "RVW-003",
        user_id: userIds[2],
        destination_id: testDestinationId,
        rating: 4,
        comment: "Bagus!",
      },
    ];

    await prisma.review.createMany({ data: reviewsData });
  });

  test("✅ Harus berhasil mengambil rata-rata rating untuk destinasi yang ada", async () => {
    const res = await request(app)
      .get(`/api/reviews/review/${testDestinationId}/average-rating`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("destination_id", testDestinationId);
    expect(res.body).toHaveProperty("average_rating");
    expect(typeof res.body.average_rating).toBe("number");
    expect(res.body.average_rating).toBeGreaterThan(0);
  });

  test("❌ Harus gagal jika destinasi tidak ditemukan", async () => {
    const res = await request(app)
      .get(`/api/reviews/review/non_existing_destination/average-rating`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(404);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty(
      "message",
      "Tidak ada review untuk destinasi ini."
    );
  });

  test("❌ Harus gagal jika terjadi error di server", async () => {
    // Mock Prisma agar selalu throw error
    const mockTest = jest
      .spyOn(ReviewModel, "getAverageRating")
      .mockRejectedValue(new Error("Database connection failed"));

    const res = await request(app)
      .get(`/api/reviews/review/${testDestinationId}/average-rating`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(500);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty(
      "message",
      "Gagal menghitung rata-rata rating"
    );
    expect(res.body).toHaveProperty("error", "Database connection failed");

    // Restore fungsi Prisma ke versi aslinya setelah test selesai
    mockTest.mockRestore();
  });

  afterAll(async () => {
    await prisma.review.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.user.deleteMany();
  });
});
