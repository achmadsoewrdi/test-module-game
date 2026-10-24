"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ModuleItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  currentVersionId: string | null;
  createdAt: string;
  versions?: { id: string; versionNo: number }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchModules = async () => {
    try {
      const res = await fetch("/api/modules");
      const json = await res.json();
      if (json.success) {
        setModules(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat modul:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    // Auto-generate slug dari judul
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError("");

    try {
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, description }),
      });

      const json = await res.json();
      if (!json.success) {
        setFormError(json.error || "Gagal membuat modul.");
      } else {
        setIsModalOpen(false);
        setTitle("");
        setSlug("");
        setDescription("");
        // Arahkan langsung ke editor modul yang baru dibuat
        router.push(`/dashboard/modules/${json.data.id}`);
      }
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan saat membuat modul.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Daftar Modul Pembelajaran
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Kelola kode minigame, versioning, dan injeksi sandbox ke LMS KABIRU.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 transition shadow-sm"
        >
          <span className="text-lg leading-none">+</span>
          <span>Buat Modul Baru</span>
        </button>
      </div>

      {/* Module List Grid/Table */}
      <div className="mt-8">
        {loading ? (
          <div className="py-20 text-center text-sm text-neutral-500 flex flex-col items-center justify-center gap-3">
            <span className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
            <span>Memuat data modul...</span>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-8">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Belum ada modul yang terdaftar
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              Mulai buat modul minigame baru untuk disajikan ke siswa tanpa perlu
              deploy ulang LMS induk.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-5 px-4 py-2 text-sm font-medium rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 transition"
            >
              Buat Modul Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((item) => {
              const versionCount = item.versions?.length || 1;
              return (
                <Link
                  key={item.id}
                  href={`/dashboard/modules/${item.id}`}
                  className="group block bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-5 hover:border-neutral-400 dark:hover:border-neutral-700 transition shadow-xs hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase ${
                        item.status === "published"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : item.status === "draft"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {item.status}
                    </span>

                    <span className="text-xs font-mono text-neutral-400">
                      v{versionCount}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-3 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition">
                    {item.title}
                  </h3>

                  <p className="text-xs font-mono text-neutral-400 mt-1">
                    /{item.slug}
                  </p>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 line-clamp-2">
                    {item.description || "Tidak ada deskripsi."}
                  </p>

                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>
                      Dibuat {new Date(item.createdAt).toLocaleDateString("id-ID")}
                    </span>
                    <span className="font-medium group-hover:translate-x-0.5 transition-transform text-neutral-700 dark:text-neutral-300">
                      Buka Editor &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Buat Modul Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Tambah Modul Baru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-sm"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg text-xs bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/50">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateModule} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  Judul Modul
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Contoh: Kuis Matematika Dasar"
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  Slug (URL Identitas)
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="kuis-matematika-dasar"
                  className="w-full px-3 py-2 text-sm font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan ringkas tentang tujuan modul ini..."
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 rounded-lg transition disabled:opacity-50"
                >
                  {creating ? "Membuat..." : "Simpan & Lanjut ke Editor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
