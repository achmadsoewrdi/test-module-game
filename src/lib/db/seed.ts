import { auth } from "../auth";
import { db } from "./index";
import { lessons } from "./schema";

async function seed() {
  console.log("🌱 Memulai proses seeding database...");

  // 1. Buat Akun Admin Pertama via Better Auth API
  try {
    const adminUser = await auth.api.signUpEmail({
      body: {
        name: "Admin KABIRU",
        email: "admin@kabiru.test",
        password: "adminpassword123",
        role: "admin",
      },
    });

    console.log("✅ Admin berhasil dibuat:", adminUser?.user?.email);
  } catch (error: any) {
    if (error?.message?.includes("already exists") || error?.status === 400) {
      console.log("ℹ️ Admin admin@kabiru.test sudah ada di database.");
    } else {
      console.error("⚠️ Error saat membuat admin:", error);
    }
  }

  // 2. Buat Stub Materi (Lesson) Awal untuk LMS
  try {
    const existingLessons = await db.select().from(lessons).limit(1);
    if (existingLessons.length === 0) {
      const [newLesson] = await db
        .insert(lessons)
        .values({
          title: "Materi 1: Pengenalan Ekosistem & Minigame Interaktif",
        })
        .returning();
      console.log("✅ Materi awal (stub) berhasil dibuat:", newLesson.title);
    } else {
      console.log("ℹ️ Materi awal sudah ada di database.");
    }
  } catch (error) {
    console.error("⚠️ Error saat membuat materi stub:", error);
  }

  console.log("🎉 Seeding selesai! Database siap digunakan.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Fatal error saat seed:", err);
  process.exit(1);
});
