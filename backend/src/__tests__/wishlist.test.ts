import request from "supertest";
import app from "../app";
import { WishlistModel } from "../models/Wishlist";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import "jest-sorted";

dotenv.config();

const prisma = new PrismaClient();

describe("POST /api/wishlists/wishlist/create", () => {
  let userToken: string;
  let testUserId: string;
  let testDestinationIds: string[];

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Buat user dummy
    testUserId = "user_test_wishlist";
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // Buat destinasi dummy
    testDestinationIds = [];
    for (let i = 1; i <= 3; i++) {
      const destinationId = `dest_test_${i}`;
      testDestinationIds.push(destinationId);

      await prisma.destination.create({
        data: {
          destination_id: destinationId,
          name: `Destinasi ${i}`,
          country: "Indonesia",
          city: "Jakarta",
          latitude: -6.2088,
          longitude: 106.8456,
          description: `Deskripsi destinasi ${i}`,
        },
      });
    }

    // Generate token JWT
    userToken = jwt.sign(
      { user_id: testUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  test("✅ Harus berhasil membuat wishlist baru", async () => {
    const res = await request(app)
      .post("/api/wishlists/wishlist/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        user_id: testUserId,
        wishlist_name: "Wishlist Liburan",
        destination_ids: testDestinationIds,
      })
      .expect(201);

    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("message", "Wishlist berhasil dibuat.");
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data).toHaveProperty("wishlist_name", "Wishlist Liburan");
    expect(res.body.data).toHaveProperty("wishlist_destinations");
    expect(res.body.data.wishlist_destinations).toHaveLength(3);
  });

  test("❌ Harus gagal jika tidak ada destination_ids", async () => {
    const res = await request(app)
      .post("/api/wishlists/wishlist/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        user_id: testUserId,
        wishlist_name: "Wishlist Tanpa Destinasi",
        destination_ids: [],
      })
      .expect(400);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty(
      "message",
      "User ID, Wishlist Name, dan minimal satu Destination ID wajib diisi."
    );
  });

  test("❌ Harus gagal jika user_id tidak diberikan", async () => {
    const res = await request(app)
      .post("/api/wishlists/wishlist/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        wishlist_name: "Wishlist Tanpa User",
        destination_ids: testDestinationIds,
      })
      .expect(400);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty(
      "message",
      "User ID, Wishlist Name, dan minimal satu Destination ID wajib diisi."
    );
  });

  test("❌ Harus gagal jika terjadi error di server", async () => {
    // Mock Prisma agar selalu throw error
    const mocktest = jest
      .spyOn(WishlistModel, "createWishlist")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .post("/api/wishlists/wishlist/create")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        user_id: testUserId,
        wishlist_name: "Wishlist Error",
        destination_ids: testDestinationIds,
      })
      .expect(500);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("message", "Gagal membuat wishlist.");
    expect(res.body).toHaveProperty("error", "Database error");

    // Restore fungsi Prisma ke kondisi normal setelah test selesai
    mocktest.mockRestore();
  });

  afterAll(async () => {
    await prisma.wishlist.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.user.deleteMany();
  });
});

describe("POST /api/wishlists/wishlist/add-destinations", () => {
  let userToken: string;
  let adminToken: string;
  let anotherUserToken: string;
  let testUserId: string;
  let testAdminId: string;
  let anotherUserId: string;
  let testWishlistId: string;
  let testDestinationIds: string[];

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 🔹 Buat user pemilik wishlist
    testUserId = "user_test_wishlist";
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat user lain yang BUKAN pemilik wishlist
    anotherUserId = "user_other";
    await prisma.user.create({
      data: {
        user_id: anotherUserId,
        name: "Other User",
        email: "otheruser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat user dengan role ADMIN
    testAdminId = "admin_test";
    await prisma.user.create({
      data: {
        user_id: testAdminId,
        name: "Admin User",
        email: "admin@example.com",
        password_hash: hashedPassword,
        role: "ADMIN",
      },
    });

    // 🔹 Buat destinasi dummy
    testDestinationIds = [];
    for (let i = 1; i <= 3; i++) {
      const destinationId = `dest_test_${i}`;
      testDestinationIds.push(destinationId);

      await prisma.destination.create({
        data: {
          destination_id: destinationId,
          name: `Destinasi ${i}`,
          country: "Indonesia",
          city: "Jakarta",
          latitude: -6.2088,
          longitude: 106.8456,
          description: `Deskripsi destinasi ${i}`,
        },
      });
    }

    // 🔹 Buat wishlist milik testUserId
    testWishlistId = `wishlist-${testUserId}-abcd1234`;
    await prisma.wishlist.create({
      data: {
        id: testWishlistId,
        user_id: testUserId,
        wishlist_name: "Wishlist Liburan",
      },
    });

    // 🔹 Generate token JWT
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
      { user_id: testAdminId, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  test("✅ Harus berhasil menambahkan destinasi ke wishlist oleh pemilik", async () => {
    const res = await request(app)
      .post("/api/wishlists/wishlist/add-destinations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        wishlist_id: testWishlistId,
        destination_ids: testDestinationIds,
      })
      .expect(200);

    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty(
      "message",
      "Destinasi berhasil ditambahkan ke wishlist."
    );
  });

  test("❌ Harus gagal jika user lain mencoba menambahkan destinasi ke wishlist yang bukan miliknya", async () => {
    const res = await request(app)
      .post("/api/wishlists/wishlist/add-destinations")
      .set("Authorization", `Bearer ${anotherUserToken}`)
      .send({
        wishlist_id: testWishlistId,
        destination_ids: testDestinationIds,
      })
      .expect(403);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty(
      "message",
      "Anda tidak memiliki izin untuk menambahkan destinasi ke wishlist ini."
    );
  });

  test("✅ ADMIN harus bisa menambahkan destinasi ke wishlist user lain", async () => {
    const res = await request(app)
      .post("/api/wishlists/wishlist/add-destinations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        wishlist_id: testWishlistId,
        destination_ids: testDestinationIds,
      })
      .expect(200);

    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty(
      "message",
      "Destinasi berhasil ditambahkan ke wishlist."
    );
  });

  test("❌ Harus gagal jika wishlist_id tidak diberikan", async () => {
    const res = await request(app)
      .post("/api/wishlists/wishlist/add-destinations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        destination_ids: testDestinationIds,
      })
      .expect(400);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty(
      "message",
      "Wishlist ID dan array Destination IDs wajib diisi."
    );
  });

  test("❌ Harus gagal jika destination_ids kosong", async () => {
    const res = await request(app)
      .post("/api/wishlists/wishlist/add-destinations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        wishlist_id: testWishlistId,
        destination_ids: [],
      })
      .expect(400);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty(
      "message",
      "Wishlist ID dan array Destination IDs wajib diisi."
    );
  });

  test("❌ Harus gagal jika wishlist tidak ditemukan", async () => {
    const res = await request(app)
      .post("/api/wishlists/wishlist/add-destinations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        wishlist_id: "wishlist-not-found",
        destination_ids: testDestinationIds,
      })
      .expect(404);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("message", "Wishlist tidak ditemukan.");
  });

  test("❌ Harus gagal jika terjadi error di server", async () => {
    // Mock Prisma agar selalu throw error
    const mocktest = jest
      .spyOn(WishlistModel, "addDestinationsToWishlist")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .post("/api/wishlists/wishlist/add-destinations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        wishlist_id: testWishlistId,
        destination_ids: testDestinationIds,
      })
      .expect(500);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty(
      "message",
      "Gagal menambahkan destinasi ke wishlist."
    );
    expect(res.body).toHaveProperty("error", "Database error");

    // Restore fungsi Prisma ke kondisi normal setelah test selesai
    mocktest.mockRestore();
  });

  afterAll(async () => {
    await prisma.wishlist.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.user.deleteMany();
  });
});

describe("DELETE /api/wishlists/wishlist/remove-destinations", () => {
  let userToken: string;
  let adminToken: string;
  let otherUserToken: string;
  let testUserId: string;
  let adminUserId: string;
  let otherUserId: string;
  let testWishlistId: string;
  let testDestinationIds: string[];

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 🔹 Buat user biasa
    testUserId = "user_test_wishlist";
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat user ADMIN
    adminUserId = "admin_test";
    await prisma.user.create({
      data: {
        user_id: adminUserId,
        name: "Admin User",
        email: "admin@example.com",
        password_hash: hashedPassword,
        role: "ADMIN",
      },
    });

    // 🔹 Buat user lain (bukan pemilik wishlist)
    otherUserId = "other_user";
    await prisma.user.create({
      data: {
        user_id: otherUserId,
        name: "Other User",
        email: "otheruser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat destinasi dummy
    testDestinationIds = [];
    for (let i = 1; i <= 3; i++) {
      const destinationId = `dest_test_${i}`;
      testDestinationIds.push(destinationId);

      await prisma.destination.create({
        data: {
          destination_id: destinationId,
          name: `Destinasi ${i}`,
          country: "Indonesia",
          city: "Jakarta",
          latitude: -6.2088,
          longitude: 106.8456,
          description: `Deskripsi destinasi ${i}`,
        },
      });
    }

    // 🔹 Buat wishlist dummy (milik testUserId)
    testWishlistId = `wishlist-${testUserId}-abcd1234`;
    await prisma.wishlist.create({
      data: {
        id: testWishlistId,
        user_id: testUserId,
        wishlist_name: "Wishlist Liburan",
      },
    });

    // 🔹 Hubungkan wishlist dengan destinasi
    for (const destId of testDestinationIds) {
      await prisma.wishlistDestination.create({
        data: {
          wishlist_id: testWishlistId,
          destination_id: destId,
        },
      });
    }

    // 🔹 Generate token JWT
    userToken = jwt.sign(
      { user_id: testUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    adminToken = jwt.sign(
      { user_id: adminUserId, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    otherUserToken = jwt.sign(
      { user_id: otherUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  test("✅ Harus berhasil menghapus destinasi jika user adalah pemilik wishlist", async () => {
    const res = await request(app)
      .delete("/api/wishlists/wishlist/remove-destinations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        wishlist_id: testWishlistId,
        destination_ids: testDestinationIds,
      })
      .expect(200);

    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty(
      "message",
      "Destinasi berhasil dihapus dari wishlist."
    );
  });

  test("✅ Harus berhasil menghapus destinasi jika user adalah ADMIN", async () => {
    const res = await request(app)
      .delete("/api/wishlists/wishlist/remove-destinations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        wishlist_id: testWishlistId,
        destination_ids: testDestinationIds,
      })
      .expect(200);

    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty(
      "message",
      "Destinasi berhasil dihapus dari wishlist."
    );
  });

  test("❌ Harus gagal jika user bukan pemilik wishlist atau ADMIN", async () => {
    const res = await request(app)
      .delete("/api/wishlists/wishlist/remove-destinations")
      .set("Authorization", `Bearer ${otherUserToken}`)
      .send({
        wishlist_id: testWishlistId,
        destination_ids: testDestinationIds,
      })
      .expect(403);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty(
      "message",
      "Anda tidak memiliki izin untuk menghapus destinasi dari wishlist ini."
    );
  });

  test("❌ Harus gagal jika wishlist_id tidak diberikan", async () => {
    const res = await request(app)
      .delete("/api/wishlists/wishlist/remove-destinations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        destination_ids: testDestinationIds,
      })
      .expect(400);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty(
      "message",
      "Wishlist ID dan array Destination IDs wajib diisi."
    );
  });

  test("❌ Harus gagal jika destination_ids kosong", async () => {
    const res = await request(app)
      .delete("/api/wishlists/wishlist/remove-destinations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        wishlist_id: testWishlistId,
        destination_ids: [],
      })
      .expect(400);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty(
      "message",
      "Wishlist ID dan array Destination IDs wajib diisi."
    );
  });

  test("❌ Harus gagal jika wishlist tidak ditemukan", async () => {
    const res = await request(app)
      .delete("/api/wishlists/wishlist/remove-destinations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        wishlist_id: "wishlist-not-found",
        destination_ids: testDestinationIds,
      })
      .expect(404);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("message", "Wishlist tidak ditemukan.");
  });

  test("❌ Harus gagal jika terjadi error di server", async () => {
    const mocktest = jest
      .spyOn(WishlistModel, "removeDestinationsFromWishlist")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .delete("/api/wishlists/wishlist/remove-destinations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        wishlist_id: testWishlistId,
        destination_ids: testDestinationIds,
      })
      .expect(500);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty(
      "message",
      "Gagal menghapus destinasi dari wishlist."
    );
    expect(res.body).toHaveProperty("error", "Database error");

    mocktest.mockRestore();
  });

  afterAll(async () => {
    await prisma.wishlistDestination.deleteMany();
    await prisma.wishlist.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.user.deleteMany();
  });
});

describe("DELETE /api/wishlists/wishlist/:id", () => {
  let userToken: string;
  let adminToken: string;
  let otherUserToken: string;
  let testUserId: string;
  let adminUserId: string;
  let otherUserId: string;
  let testWishlistId: string;
  let testWishlistId2: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 🔹 Buat user biasa
    testUserId = "user_test_wishlist";
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat user ADMIN
    adminUserId = "admin_test";
    await prisma.user.create({
      data: {
        user_id: adminUserId,
        name: "Admin User",
        email: "admin@example.com",
        password_hash: hashedPassword,
        role: "ADMIN",
      },
    });

    // 🔹 Buat user lain (bukan pemilik wishlist)
    otherUserId = "other_user";
    await prisma.user.create({
      data: {
        user_id: otherUserId,
        name: "Other User",
        email: "otheruser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat wishlist dummy (milik testUserId)
    testWishlistId = `wishlist-${testUserId}-abcd1234`;
    await prisma.wishlist.create({
      data: {
        id: testWishlistId,
        user_id: testUserId,
        wishlist_name: "Wishlist Liburan",
      },
    });

    // 🔹 Buat wishlist kedua (milik testUserId)
    testWishlistId2 = `wishlist-${testUserId}-xyz5678`;
    await prisma.wishlist.create({
      data: {
        id: testWishlistId2,
        user_id: testUserId,
        wishlist_name: "Wishlist Kedua",
      },
    });

    // 🔹 Generate token JWT
    userToken = jwt.sign(
      { user_id: testUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    adminToken = jwt.sign(
      { user_id: adminUserId, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    otherUserToken = jwt.sign(
      { user_id: otherUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  test("✅ Harus berhasil menghapus wishlist jika user adalah pemilik", async () => {
    const res = await request(app)
      .delete(`/api/wishlists/wishlist/${testWishlistId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("message", "Wishlist berhasil dihapus.");
  });

  test("✅ Harus berhasil menghapus wishlist jika user adalah ADMIN", async () => {
    // Buat wishlist baru untuk diuji dengan admin
    const adminWishlistId = `wishlist-${adminUserId}-efgh5678`;
    await prisma.wishlist.create({
      data: {
        id: adminWishlistId,
        user_id: testUserId, // Pemilik tetap user biasa
        wishlist_name: "Wishlist Admin Test",
      },
    });

    const res = await request(app)
      .delete(`/api/wishlists/wishlist/${adminWishlistId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("message", "Wishlist berhasil dihapus.");
  });

  test("❌ Harus gagal jika user bukan pemilik wishlist atau ADMIN", async () => {
    // Buat wishlist baru untuk diuji dengan otherUserToken
    const otherWishlistId = `wishlist-${testUserId}-ijkl91011`;
    await prisma.wishlist.create({
      data: {
        id: otherWishlistId,
        user_id: testUserId,
        wishlist_name: "Wishlist Other User Test",
      },
    });

    const res = await request(app)
      .delete(`/api/wishlists/wishlist/${otherWishlistId}`)
      .set("Authorization", `Bearer ${otherUserToken}`)
      .expect(403);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty(
      "message",
      "Anda tidak memiliki izin untuk menghapus wishlist ini."
    );
  });

  test("❌ Harus gagal jika wishlist tidak ditemukan", async () => {
    const res = await request(app)
      .delete("/api/wishlists/wishlist/wishlist-not-found")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(404);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("message", "Wishlist tidak ditemukan.");
  });

  test("❌ Harus gagal jika terjadi error di server", async () => {
    const mockTest = jest
      .spyOn(WishlistModel, "delete")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .delete(`/api/wishlists/wishlist/${testWishlistId2}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(500);

    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("message", "Gagal menghapus wishlist.");
    expect(res.body).toHaveProperty("error", "Database error");

    mockTest.mockRestore();
  });

  afterAll(async () => {
    await prisma.wishlistDestination.deleteMany();
    await prisma.wishlist.deleteMany();
    await prisma.user.deleteMany();
  });
});

describe("GET /api/wishlists/wishlists", () => {
  let userToken: string;
  let adminToken: string;
  let otherUserToken: string;
  let testUserId: string;
  let adminUserId: string;
  let otherUserId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 🔹 Buat user biasa
    testUserId = "user_test";
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat admin
    adminUserId = "admin_test";
    await prisma.user.create({
      data: {
        user_id: adminUserId,
        name: "Admin User",
        email: "admin@example.com",
        password_hash: hashedPassword,
        role: "ADMIN",
      },
    });

    // 🔹 Buat user lain
    otherUserId = "other_user";
    await prisma.user.create({
      data: {
        user_id: otherUserId,
        name: "Other User",
        email: "otheruser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat banyak wishlist untuk testUserId
    const testWishlists = Array.from({ length: 5 }, (_, i) => ({
      id: `wishlist-${testUserId}-${i + 1}`,
      user_id: testUserId,
      wishlist_name: `Wishlist ${i + 1}`,
      added_at: new Date(),
    }));

    // 🔹 Buat beberapa wishlist untuk otherUserId
    const otherWishlists = Array.from({ length: 3 }, (_, i) => ({
      id: `wishlist-${otherUserId}-${i + 1}`,
      user_id: otherUserId,
      wishlist_name: `Other Wishlist ${i + 1}`,
      added_at: new Date(),
    }));

    await prisma.wishlist.createMany({
      data: [...testWishlists, ...otherWishlists],
    });

    // 🔹 Generate token JWT
    userToken = jwt.sign(
      { user_id: testUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
    adminToken = jwt.sign(
      { user_id: adminUserId, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
    otherUserToken = jwt.sign(
      { user_id: otherUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await prisma.wishlist.deleteMany();
    await prisma.user.deleteMany();
  });

  // ✅ Berhasil mengambil semua wishlist (default pagination)
  test("✅ Harus berhasil mengambil wishlist (default pagination)", async () => {
    const res = await request(app)
      .get("/api/wishlists/wishlists")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(8);
    expect(res.body.data).toHaveLength(8);
  });

  // ✅ Berhasil mengambil wishlist dengan pagination (page 2, limit 3)
  test("✅ Harus berhasil mengambil wishlist (pagination page 2, limit 3)", async () => {
    const res = await request(app)
      .get("/api/wishlists/wishlists?page=2&limit=3")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.currentPage).toBe(2);
    expect(res.body.data).toHaveLength(3);
  });

  // ✅ Berhasil mengambil wishlist dengan sorting A-Z
  test("✅ Harus berhasil mengambil wishlist dengan sorting A-Z", async () => {
    const res = await request(app)
      .get("/api/wishlists/wishlists?sort_by=name&sort_order=asc")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data[0].wishlist_name).toMatch(/^Other Wishlist/);
  });

  // ✅ Berhasil mengambil wishlist dengan sorting Z-A
  test("✅ Harus berhasil mengambil wishlist dengan sorting Z-A", async () => {
    const res = await request(app)
      .get("/api/wishlists/wishlists?sort_by=name&sort_order=desc")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data[0].wishlist_name).toMatch(/^Wishlist/);
  });

  // ✅ Berhasil mengambil wishlist dengan sorting berdasarkan tanggal terbaru
  test("✅ Harus berhasil mengambil wishlist dengan sorting berdasarkan tanggal terbaru", async () => {
    const res = await request(app)
      .get("/api/wishlists/wishlists?sort_by=date&sort_order=desc")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data[0].wishlist_name).toMatch(/Wishlist|Other Wishlist/);
  });

  // ❌ Gagal jika terjadi error di server (500 Internal Server Error)
  test("❌ Harus gagal jika terjadi error di server", async () => {
    const mocktest = jest
      .spyOn(WishlistModel, "findAll")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get("/api/wishlists/wishlists")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(500);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Gagal mengambil semua wishlist.");
    expect(res.body.error).toBe("Database error");

    mocktest.mockRestore();
  });
});

describe("GET /api/wishlists/wishlist/user/:user_id", () => {
  let userToken: string;
  let adminToken: string;
  let otherUserToken: string;
  let testUserId: string;
  let adminUserId: string;
  let otherUserId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 🔹 Buat user biasa
    testUserId = "user_test";
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat admin
    adminUserId = "admin_test";
    await prisma.user.create({
      data: {
        user_id: adminUserId,
        name: "Admin User",
        email: "admin@example.com",
        password_hash: hashedPassword,
        role: "ADMIN",
      },
    });

    // 🔹 Buat user lain
    otherUserId = "other_user";
    await prisma.user.create({
      data: {
        user_id: otherUserId,
        name: "Other User",
        email: "otheruser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat banyak wishlist untuk testUserId
    const testWishlists = Array.from({ length: 4 }, (_, i) => ({
      id: `wishlist-${testUserId}-${i + 1}`,
      user_id: testUserId,
      wishlist_name: `Wishlist ${i + 1}`,
      added_at: new Date(),
    }));

    // 🔹 Buat beberapa wishlist untuk otherUserId
    const otherWishlists = Array.from({ length: 3 }, (_, i) => ({
      id: `wishlist-${otherUserId}-${i + 1}`,
      user_id: otherUserId,
      wishlist_name: `Other Wishlist ${i + 1}`,
      added_at: new Date(),
    }));

    await prisma.wishlist.createMany({
      data: [...testWishlists, ...otherWishlists],
    });

    // 🔹 Generate token JWT
    userToken = jwt.sign(
      { user_id: testUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
    adminToken = jwt.sign(
      { user_id: adminUserId, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
    otherUserToken = jwt.sign(
      { user_id: otherUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await prisma.wishlist.deleteMany();
    await prisma.user.deleteMany();
  });

  // ✅ Berhasil mengambil wishlist berdasarkan user_id
  test("✅ Harus berhasil mengambil wishlist berdasarkan user_id", async () => {
    const res = await request(app)
      .get(`/api/wishlists/wishlist/user/${testUserId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Wishlist berhasil ditemukan.");
    expect(res.body.data).toHaveLength(4);
  });

  // ✅ Admin bisa mengambil wishlist user lain
  test("✅ Admin bisa mengambil wishlist user lain", async () => {
    const res = await request(app)
      .get(`/api/wishlists/wishlist/user/${testUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(4);
  });

  // ❌ Jika user_id tidak memiliki wishlist, harus return 404
  test("❌ Jika user_id tidak memiliki wishlist, harus return 404", async () => {
    const res = await request(app)
      .get("/api/wishlists/wishlist/user/nonexistent_user")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Wishlist tidak ditemukan untuk user ini.");
  });

  // ❌ Gagal jika terjadi error di server (500 Internal Server Error)
  test("❌ Harus gagal jika terjadi error di server", async () => {
    const mocktest = jest
      .spyOn(WishlistModel, "findAllByUser")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get(`/api/wishlists/wishlist/user/${testUserId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(500);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Gagal mengambil wishlist berdasarkan user.");
    expect(res.body.error).toBe("Database error");

    mocktest.mockRestore();
  });
});

describe("GET /api/wishlists/wishlist/:id", () => {
  let userToken: string;
  let adminToken: string;
  let otherUserToken: string;
  let testUserId: string;
  let adminUserId: string;
  let otherUserId: string;
  let testWishlistId: string;
  let otherWishlistId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 🔹 Buat user biasa
    testUserId = "user_test";
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat admin
    adminUserId = "admin_test";
    await prisma.user.create({
      data: {
        user_id: adminUserId,
        name: "Admin User",
        email: "admin@example.com",
        password_hash: hashedPassword,
        role: "ADMIN",
      },
    });

    // 🔹 Buat user lain
    otherUserId = "other_user";
    await prisma.user.create({
      data: {
        user_id: otherUserId,
        name: "Other User",
        email: "otheruser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat wishlist untuk testUserId
    testWishlistId = `wishlist-${testUserId}-1`;
    await prisma.wishlist.create({
      data: {
        id: testWishlistId,
        user_id: testUserId,
        wishlist_name: "Wishlist 1",
        added_at: new Date(),
      },
    });

    // 🔹 Buat wishlist untuk otherUserId
    otherWishlistId = `wishlist-${otherUserId}-1`;
    await prisma.wishlist.create({
      data: {
        id: otherWishlistId,
        user_id: otherUserId,
        wishlist_name: "Other Wishlist 1",
        added_at: new Date(),
      },
    });

    // 🔹 Generate token JWT
    userToken = jwt.sign(
      { user_id: testUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
    adminToken = jwt.sign(
      { user_id: adminUserId, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
    otherUserToken = jwt.sign(
      { user_id: otherUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await prisma.wishlist.deleteMany();
    await prisma.user.deleteMany();
  });

  // ✅ Berhasil mengambil wishlist berdasarkan ID
  test("✅ Harus berhasil mengambil wishlist berdasarkan ID", async () => {
    jest.spyOn(WishlistModel, "findById").mockResolvedValue({
      id: testWishlistId,
      user_id: testUserId,
      wishlist_name: "Wishlist 1",
      added_at: new Date(), // 🔹 Tambahkan `added_at`
      wishlist_destinations: [], // 🔹 Bisa tetap kosong, tapi harus punya struktur benar
      user: { name: "Test User", email: "testuser@example.com" }, // 🔹 Pastikan struktur user sesuai
    });

    const res = await request(app)
      .get(`/api/wishlists/wishlist/${testWishlistId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Wishlist berhasil ditemukan.");
    expect(res.body.data.id).toBe(testWishlistId);
  });

  // ✅ Admin juga bisa mengambil wishlist berdasarkan ID
  test("✅ Admin juga bisa mengambil wishlist berdasarkan ID", async () => {
    jest.spyOn(WishlistModel, "findById").mockResolvedValue({
      id: testWishlistId,
      user_id: testUserId,
      wishlist_name: "Wishlist 1",
      added_at: new Date(),
      wishlist_destinations: [],
      user: { name: "Test User", email: "testuser@example.com" },
    });

    const res = await request(app)
      .get(`/api/wishlists/wishlist/${testWishlistId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(testWishlistId);
  });

  // ❌ Gagal jika wishlist tidak ditemukan (404)
  test("❌ Harus gagal jika wishlist tidak ditemukan", async () => {
    jest.spyOn(WishlistModel, "findById").mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/wishlists/wishlist/invalid-id`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Wishlist tidak ditemukan.");
  });

  // ❌ Gagal jika ID tidak diberikan (400)
  test("❌ Harus gagal jika ID tidak diberikan", async () => {
    const res = await request(app)
      .get(`/api/wishlists/wishlist/`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(404); // Karena endpoint tidak valid

    expect(res.body.success).toBeUndefined(); // Karena tidak ada response JSON
  });

  // ❌ Gagal jika terjadi error di server (500 Internal Server Error)
  test("❌ Harus gagal jika terjadi error di server", async () => {
    const mocktest = jest
      .spyOn(WishlistModel, "findById")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get(`/api/wishlists/wishlist/${testWishlistId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(500);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Gagal mengambil wishlist.");
    expect(res.body.error).toBe("Database error");

    mocktest.mockRestore();
  });
});

describe("PUT /api/wishlists/wishlist/:id", () => {
  let userToken: string;
  let adminToken: string;
  let anotherUserToken: string;
  let testUserId: string;
  let testAdminId: string;
  let anotherUserId: string;
  let testWishlistId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 🔹 Buat user pemilik wishlist
    testUserId = "user_test_wishlist";
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat user lain yang BUKAN pemilik wishlist
    anotherUserId = "user_other";
    await prisma.user.create({
      data: {
        user_id: anotherUserId,
        name: "Other User",
        email: "otheruser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat user dengan role ADMIN
    testAdminId = "admin_test";
    await prisma.user.create({
      data: {
        user_id: testAdminId,
        name: "Admin User",
        email: "admin@example.com",
        password_hash: hashedPassword,
        role: "ADMIN",
      },
    });

    // 🔹 Buat wishlist milik testUserId
    testWishlistId = `wishlist-${testUserId}-abcd1234`;
    await prisma.wishlist.create({
      data: {
        id: testWishlistId,
        user_id: testUserId,
        wishlist_name: "Wishlist Liburan",
      },
    });

    // 🔹 Generate token JWT
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
      { user_id: testAdminId, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await prisma.wishlist.deleteMany();
    await prisma.user.deleteMany();
  });

  // ✅ Berhasil update nama wishlist oleh pemiliknya
  it("✅ Harus berhasil update nama wishlist oleh pemiliknya", async () => {
    const res = await request(app)
      .put(`/api/wishlists/wishlist/${testWishlistId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ wishlist_name: "Wishlist Baru" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Nama wishlist berhasil diperbarui.");
    expect(res.body.data.wishlist_name).toBe("Wishlist Baru");
  });

  // ✅ Berhasil update nama wishlist oleh ADMIN
  it("✅ Harus berhasil update nama wishlist oleh ADMIN", async () => {
    const res = await request(app)
      .put(`/api/wishlists/wishlist/${testWishlistId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ wishlist_name: "Wishlist Admin" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Nama wishlist berhasil diperbarui.");
    expect(res.body.data.wishlist_name).toBe("Wishlist Admin");
  });

  // ❌ Gagal update wishlist yang tidak ditemukan
  it("❌ Harus gagal jika wishlist tidak ditemukan", async () => {
    const res = await request(app)
      .put("/api/wishlists/wishlist/not-found-id")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ wishlist_name: "Wishlist Tidak Ada" })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Wishlist tidak ditemukan.");
  });

  // ❌ Gagal update tanpa mengirimkan wishlist_name
  it("❌ Harus gagal jika wishlist_name tidak dikirim", async () => {
    const res = await request(app)
      .put(`/api/wishlists/wishlist/${testWishlistId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Nama wishlist wajib diisi.");
  });

  // ❌ Gagal update jika user bukan pemilik wishlist dan bukan ADMIN
  it("❌ Harus gagal jika user bukan pemilik wishlist dan bukan ADMIN", async () => {
    const res = await request(app)
      .put(`/api/wishlists/wishlist/${testWishlistId}`)
      .set("Authorization", `Bearer ${anotherUserToken}`)
      .send({ wishlist_name: "Tidak Bisa Ubah" })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Anda tidak memiliki izin untuk mengubah wishlist ini."
    );
  });

  // ❌ Gagal dengan server error (500 Internal Server Error)
  it("❌ Harus gagal dengan server error (500) jika terjadi kesalahan di server", async () => {
    const mocktest = jest
      .spyOn(WishlistModel, "updateWishlistName")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .put(`/api/wishlists/wishlist/${testWishlistId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ wishlist_name: "Wishlist Error" })
      .expect(500);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Gagal memperbarui nama wishlist.");
    expect(res.body.error).toBe("Database error");

    // 🔹 Kembalikan fungsi Prisma ke normal setelah test selesai
    mocktest.mockRestore();
  });
});

describe("GET /api/wishlists/wishlist/check/destination", () => {
  let userToken: string;
  let testUserId: string;
  let testWishlistId: string;
  let testDestinationId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 🔹 Buat user pemilik wishlist
    testUserId = "user_test_check";
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat wishlist milik testUserId
    testWishlistId = `wishlist-${testUserId}-check`;
    await prisma.wishlist.create({
      data: {
        id: testWishlistId,
        user_id: testUserId,
        wishlist_name: "Wishlist Test",
      },
    });

    // 🔹 Buat destinasi dummy
    testDestinationId = "dest_check_123";
    await prisma.destination.create({
      data: {
        destination_id: testDestinationId,
        name: "Destinasi Test",
        country: "Indonesia",
        city: "Jakarta",
        latitude: -6.2088,
        longitude: 106.8456,
        description: "Deskripsi destinasi test",
      },
    });

    // 🔹 Tambahkan destinasi ke wishlist
    await prisma.wishlistDestination.create({
      data: {
        wishlist_id: testWishlistId,
        destination_id: testDestinationId,
      },
    });

    // 🔹 Generate token JWT
    userToken = jwt.sign(
      { user_id: testUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await prisma.wishlistDestination.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.wishlist.deleteMany();
    await prisma.user.deleteMany();
  });

  // ✅ Berhasil menemukan destinasi dalam wishlist
  it("✅ Harus berhasil menemukan destinasi dalam wishlist", async () => {
    const res = await request(app)
      .get(`/api/wishlists/wishlist/check/destination`)
      .set("Authorization", `Bearer ${userToken}`)
      .query({ wishlist_id: testWishlistId, destination_id: testDestinationId })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Destinasi ada dalam wishlist.");
    expect(res.body.data.exists).toBe(true);
  });

  // ❌ Gagal jika destinasi tidak ada dalam wishlist
  it("❌ Harus gagal jika destinasi tidak ditemukan dalam wishlist", async () => {
    const res = await request(app)
      .get(`/api/wishlists/wishlist/check/destination`)
      .set("Authorization", `Bearer ${userToken}`)
      .query({ wishlist_id: testWishlistId, destination_id: "dest_invalid" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Destinasi tidak ditemukan dalam wishlist.");
    expect(res.body.data.exists).toBe(false);
  });

  // ❌ Gagal jika `wishlist_id` atau `destination_id` tidak dikirim
  it("❌ Harus gagal jika `wishlist_id` tidak dikirim", async () => {
    const res = await request(app)
      .get(`/api/wishlists/wishlist/check/destination`)
      .set("Authorization", `Bearer ${userToken}`)
      .query({ destination_id: testDestinationId }) // Tidak mengirimkan `wishlist_id`
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Wishlist ID dan Destination ID wajib diisi."
    );
  });

  it("❌ Harus gagal jika `destination_id` tidak dikirim", async () => {
    const res = await request(app)
      .get(`/api/wishlists/wishlist/check/destination`)
      .set("Authorization", `Bearer ${userToken}`)
      .query({ wishlist_id: testWishlistId }) // Tidak mengirimkan `destination_id`
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Wishlist ID dan Destination ID wajib diisi."
    );
  });

  // ❌ Gagal dengan server error (500 Internal Server Error)
  it("❌ Harus gagal dengan server error (500) jika terjadi kesalahan di server", async () => {
    // 🔹 Mock Prisma supaya selalu melempar error saat `findFirst`
    const mocktest = jest
      .spyOn(WishlistModel, "checkDestinationInWishlist")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get(`/api/wishlists/wishlist/check/destination`)
      .set("Authorization", `Bearer ${userToken}`)
      .query({ wishlist_id: testWishlistId, destination_id: testDestinationId })
      .expect(500);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Gagal mengecek destinasi dalam wishlist.");
    expect(res.body.error).toBe("Database error");

    // 🔹 Kembalikan fungsi Prisma ke normal setelah test selesai
    mocktest.mockRestore();
  });
});

describe("GET /api/wishlists/wishlist/:id/destinations", () => {
  let userToken: string;
  let testUserId: string;
  let testWishlistId: string;
  let testDestinationId1: string;
  let testDestinationId2: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 🔹 Buat user pemilik wishlist
    testUserId = "user_test_destinations";
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat wishlist milik testUserId
    testWishlistId = `wishlist-${testUserId}-destinations`;
    await prisma.wishlist.create({
      data: {
        id: testWishlistId,
        user_id: testUserId,
        wishlist_name: "Wishlist Test Destinations",
      },
    });

    // 🔹 Buat destinasi dummy
    testDestinationId1 = "dest_001";
    testDestinationId2 = "dest_002";

    await prisma.destination.createMany({
      data: [
        {
          destination_id: testDestinationId1,
          name: "Bali",
          country: "Indonesia",
          city: "Denpasar",
          latitude: -8.4095,
          longitude: 115.1889,
          description: "Pantai dan budaya Bali",
        },
        {
          destination_id: testDestinationId2,
          name: "Yogyakarta",
          country: "Indonesia",
          city: "Yogyakarta",
          latitude: -7.7956,
          longitude: 110.3695,
          description: "Kota budaya dengan Candi Borobudur",
        },
      ],
    });

    // 🔹 Tambahkan destinasi ke wishlist
    await prisma.wishlistDestination.createMany({
      data: [
        { wishlist_id: testWishlistId, destination_id: testDestinationId1 },
        { wishlist_id: testWishlistId, destination_id: testDestinationId2 },
      ],
    });

    // 🔹 Generate token JWT
    userToken = jwt.sign(
      { user_id: testUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await prisma.wishlistDestination.deleteMany();
    await prisma.destination.deleteMany();
    await prisma.wishlist.deleteMany();
    await prisma.user.deleteMany();
  });

  // ✅ Test sukses mendapatkan daftar destinasi dalam wishlist
  it("✅ Harus berhasil mendapatkan daftar destinasi dalam wishlist", async () => {
    const res = await request(app)
      .get(`/api/wishlists/wishlist/${testWishlistId}/destinations`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].destination.name).toBe("Bali");
    expect(res.body.data[1].destination.name).toBe("Yogyakarta");
  });

  // ✅ Test sukses tetapi wishlist kosong
  it("✅ Harus mengembalikan daftar kosong jika wishlist tidak memiliki destinasi", async () => {
    const emptyWishlistId = `wishlist-${testUserId}-empty`;
    await prisma.wishlist.create({
      data: {
        id: emptyWishlistId,
        user_id: testUserId,
        wishlist_name: "Empty Wishlist",
      },
    });

    const res = await request(app)
      .get(`/api/wishlists/wishlist/${emptyWishlistId}/destinations`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  // ❌ Test gagal jika wishlist tidak ditemukan
  it("❌ Harus mengembalikan 404 jika wishlist tidak ditemukan", async () => {
    const res = await request(app)
      .get(`/api/wishlists/wishlist/non-existent-wishlist/destinations`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Wishlist tidak ditemukan.");
  });

  // ❌ Test gagal jika terjadi error server
  it("❌ Harus mengembalikan 500 jika terjadi error server", async () => {
    const mocktest = jest
      .spyOn(WishlistModel, "getWishlistDestinations")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get(`/api/wishlists/wishlist/${testWishlistId}/destinations`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(500);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Gagal mengambil daftar destinasi dalam wishlist."
    );
    expect(res.body.error).toBe("Database error");

    mocktest.mockRestore();
  });
});

describe("DELETE /api/wishlists/wishlist/user/:user_id", () => {
  let userToken: string;
  let adminToken: string;
  let testUserId: string;
  let adminUserId: string;
  let testWishlistId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 🔹 Buat user biasa
    testUserId = "user_test_delete";
    await prisma.user.create({
      data: {
        user_id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        password_hash: hashedPassword,
        role: "USER",
      },
    });

    // 🔹 Buat user dengan role ADMIN
    adminUserId = "admin_test_delete";
    await prisma.user.create({
      data: {
        user_id: adminUserId,
        name: "Admin User",
        email: "admin@example.com",
        password_hash: hashedPassword,
        role: "ADMIN",
      },
    });

    // 🔹 Generate token JWT
    userToken = jwt.sign(
      { user_id: testUserId, role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    adminToken = jwt.sign(
      { user_id: adminUserId, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  beforeEach(async () => {
    // 🔹 Pastikan database dalam keadaan bersih
    await prisma.wishlist.deleteMany();

    // 🔹 Buat wishlist dummy untuk user
    testWishlistId = `wishlist-${testUserId}-delete`;
    await prisma.wishlist.create({
      data: {
        id: testWishlistId,
        user_id: testUserId,
        wishlist_name: "Wishlist Test",
      },
    });
  });

  afterEach(async () => {
    await prisma.wishlist.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
  });

  // ✅ Berhasil menghapus wishlist jika pemiliknya sendiri
  it("✅ Harus berhasil menghapus semua wishlist jika pemiliknya sendiri", async () => {
    const res = await request(app)
      .delete(`/api/wishlists/wishlist/user/${testUserId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(
      "Semua wishlist milik user berhasil dihapus."
    );
  });

  // ✅ Berhasil menghapus wishlist jika user adalah ADMIN
  it("✅ Harus berhasil menghapus semua wishlist jika user adalah ADMIN", async () => {
    const res = await request(app)
      .delete(`/api/wishlists/wishlist/user/${testUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(
      "Semua wishlist milik user berhasil dihapus."
    );
  });

  // ❌ Harus gagal dengan status 403 jika user lain mencoba menghapus
  it("❌ Harus gagal dengan status 403 jika user lain mencoba menghapus", async () => {
    const otherUserToken = jwt.sign(
      { user_id: "random_other_user", role: "USER" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .delete(`/api/wishlists/wishlist/user/${testUserId}`)
      .set("Authorization", `Bearer ${otherUserToken}`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Anda tidak memiliki izin untuk menghapus wishlist ini."
    );
  });

  // ❌ Harus gagal dengan status 404 jika user tidak memiliki wishlist
  it("❌ Harus gagal dengan status 404 jika user tidak memiliki wishlist", async () => {
    // 🔹 Hapus semua wishlist sebelum menjalankan test ini
    await prisma.wishlist.deleteMany();

    const res = await request(app)
      .delete(`/api/wishlists/wishlist/user/${testUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Wishlist tidak ditemukan.");
  });

  // ❌ Harus mengembalikan 500 jika terjadi error server
  it("❌ Harus mengembalikan 500 jika terjadi error server", async () => {
    const mocktest = jest
      .spyOn(WishlistModel, "deleteAllWishlistsByUser")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .delete(`/api/wishlists/wishlist/user/${testUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(500);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Gagal menghapus semua wishlist milik user.");

    mocktest.mockRestore();
  });
});
