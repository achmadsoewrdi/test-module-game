import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import {
  modules,
  moduleVersions,
  auditLogs,
  lessonModules,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  manifestSchema,
  DEFAULT_QUIZ_TEMPLATE,
  type ModuleManifest,
} from "@/lib/contract/manifest";

// Batas ukuran kode: maks 200 KB (PRD Bagian 5)
const MAX_CODE_SIZE_BYTES = 200 * 1024;

export async function listModules() {
  return await db.query.modules.findMany({
    orderBy: [desc(modules.createdAt)],
    with: {
      versions: {
        orderBy: [desc(moduleVersions.versionNo)],
      },
    },
  });
}

export async function getModuleById(moduleId: string) {
  return await db.query.modules.findFirst({
    where: eq(modules.id, moduleId),
    with: {
      versions: {
        orderBy: [desc(moduleVersions.versionNo)],
      },
      lessonPlacements: true,
    },
  });
}

export async function createModule(input: {
  title: string;
  slug: string;
  description?: string;
  userId: string;
}) {
  // 1. Simpan baris induk modul
  const [newModule] = await db
    .insert(modules)
    .values({
      title: input.title,
      slug: input.slug,
      description: input.description,
      status: "draft",
      createdBy: input.userId,
    })
    .returning();

  // 2. Buat versi awal v1 menggunakan default quiz template
  const defaultManifest: ModuleManifest = {
    ...DEFAULT_QUIZ_TEMPLATE.manifest,
    name: input.title,
    slug: input.slug,
  };

  const initialSource =
    DEFAULT_QUIZ_TEMPLATE.sourceHtml +
    DEFAULT_QUIZ_TEMPLATE.sourceCss +
    DEFAULT_QUIZ_TEMPLATE.sourceJs;

  const checksum = createHash("sha256").update(initialSource).digest("hex");

  const [v1] = await db
    .insert(moduleVersions)
    .values({
      moduleId: newModule.id,
      versionNo: 1,
      manifest: defaultManifest,
      sourceHtml: DEFAULT_QUIZ_TEMPLATE.sourceHtml,
      sourceCss: DEFAULT_QUIZ_TEMPLATE.sourceCss,
      sourceJs: DEFAULT_QUIZ_TEMPLATE.sourceJs,
      checksumSha256: checksum,
      createdBy: input.userId,
    })
    .returning();

  // Set current version id ke v1
  await db
    .update(modules)
    .set({ currentVersionId: v1.id })
    .where(eq(modules.id, newModule.id));

  // Audit log
  await db.insert(auditLogs).values({
    actorId: input.userId,
    action: "module_created",
    entity: "modules",
    entityId: newModule.id,
    meta: { versionId: v1.id, versionNo: 1 },
  });

  return { ...newModule, currentVersionId: v1.id, initialVersion: v1 };
}

export async function saveNewModuleVersion(input: {
  moduleId: string;
  manifest: unknown;
  sourceHtml: string;
  sourceCss: string;
  sourceJs: string;
  userId: string;
}) {
  // 1. Validasi Manifest via Zod (FR-04)
  const validatedManifest = manifestSchema.parse(input.manifest);

  // 2. Validasi Batas Ukuran Kode (Batas 200 KB)
  const totalSizeBytes = Buffer.byteLength(
    input.sourceHtml + input.sourceCss + input.sourceJs,
    "utf8"
  );
  if (totalSizeBytes > MAX_CODE_SIZE_BYTES) {
    throw new Error(
      `Ukuran total kode (${(totalSizeBytes / 1024).toFixed(1)} KB) melebihi batas maksimal 200 KB.`
    );
  }

  // 3. Ambil nomor versi terakhir
  const existingVersions = await db
    .select({ versionNo: moduleVersions.versionNo })
    .from(moduleVersions)
    .where(eq(moduleVersions.moduleId, input.moduleId))
    .orderBy(desc(moduleVersions.versionNo))
    .limit(1);

  const nextVersionNo =
    existingVersions.length > 0 ? existingVersions[0].versionNo + 1 : 1;

  // 4. Hitung Checksum SHA256 (Integritas)
  const checksum = createHash("sha256")
    .update(input.sourceHtml + input.sourceCss + input.sourceJs)
    .digest("hex");

  // 5. Simpan versi baru (Immutable)
  const [newVersion] = await db
    .insert(moduleVersions)
    .values({
      moduleId: input.moduleId,
      versionNo: nextVersionNo,
      manifest: validatedManifest,
      sourceHtml: input.sourceHtml,
      sourceCss: input.sourceCss,
      sourceJs: input.sourceJs,
      checksumSha256: checksum,
      createdBy: input.userId,
    })
    .returning();

  // Audit log
  await db.insert(auditLogs).values({
    actorId: input.userId,
    action: "version_saved",
    entity: "module_versions",
    entityId: newVersion.id,
    meta: { versionNo: nextVersionNo, checksum },
  });

  return newVersion;
}

export async function publishModuleVersion(input: {
  moduleId: string;
  versionId: string;
  lessonId?: string;
  userId: string;
}) {
  // 1. Update status modul & pasang versi aktif
  await db
    .update(modules)
    .set({
      currentVersionId: input.versionId,
      status: "published",
    })
    .where(eq(modules.id, input.moduleId));

  // 2. Tautkan ke materi jika disediakan
  if (input.lessonId) {
    // Hapus tautan lama jika ada
    await db
      .delete(lessonModules)
      .where(eq(lessonModules.moduleId, input.moduleId));

    await db.insert(lessonModules).values({
      lessonId: input.lessonId,
      moduleId: input.moduleId,
      position: 0,
    });
  }

  // Audit log
  await db.insert(auditLogs).values({
    actorId: input.userId,
    action: "published",
    entity: "modules",
    entityId: input.moduleId,
    meta: { versionId: input.versionId, lessonId: input.lessonId },
  });

  return { success: true };
}
