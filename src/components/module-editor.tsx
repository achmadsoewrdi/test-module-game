"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { ModuleManifest } from "@/lib/contract/manifest";

// Muat Monaco Editor secara dinamis (hanya di client/browser)
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-xs text-neutral-400 font-mono">
      Memuat editor kode...
    </div>
  ),
});

interface VersionData {
  id: string;
  versionNo: number;
  manifest: ModuleManifest;
  sourceHtml: string;
  sourceCss: string;
  sourceJs: string;
  checksumSha256: string;
  createdAt: string;
}

interface ModuleData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  currentVersionId: string | null;
  versions: VersionData[];
}

export default function ModuleEditor({
  initialModule,
}: {
  initialModule: ModuleData;
}) {
  const [moduleData, setModuleData] = useState<ModuleData>(initialModule);
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    initialModule.currentVersionId || initialModule.versions[0]?.id || ""
  );

  // Active Tab: html | css | js | manifest | preview
  const [activeTab, setActiveTab] = useState<
    "html" | "css" | "js" | "manifest" | "preview"
  >("html");

  // State Kode yang sedang diedit
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [jsCode, setJsCode] = useState("");
  const [maxScore, setMaxScore] = useState<number>(100);

  // Feedback states
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Sync state ketika versi yang dipilih berubah
  useEffect(() => {
    const currentVer = moduleData.versions.find(
      (v) => v.id === selectedVersionId
    );
    if (currentVer) {
      setHtmlCode(currentVer.sourceHtml);
      setCssCode(currentVer.sourceCss);
      setJsCode(currentVer.sourceJs);
      setMaxScore(currentVer.manifest.maxScore || 100);
    }
  }, [selectedVersionId, moduleData]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Simpan Versi Baru (FR-03: Immutable Versioning)
  const handleSaveNewVersion = async () => {
    setSaving(true);
    try {
      const manifest: ModuleManifest = {
        contractVersion: "1.0",
        name: moduleData.title,
        slug: moduleData.slug,
        version: `1.0.${moduleData.versions.length}`,
        maxScore: Number(maxScore),
        emits: ["result"],
      };

      const res = await fetch(`/api/modules/${moduleData.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manifest,
          sourceHtml: htmlCode,
          sourceCss: cssCode,
          sourceJs: jsCode,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        showToast(json.error || "Gagal menyimpan versi baru.", "error");
      } else {
        const newVer: VersionData = json.data;
        // Tambahkan ke daftar versi lokal
        const updatedVersions = [newVer, ...moduleData.versions];
        setModuleData({ ...moduleData, versions: updatedVersions });
        setSelectedVersionId(newVer.id);
        showToast(`Versi baru (v${newVer.versionNo}) berhasil disimpan!`);
      }
    } catch (err: any) {
      showToast(err.message || "Terjadi kesalahan koneksi.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Publish Versi Aktif (FR-06)
  const handlePublish = async () => {
    if (!selectedVersionId) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/modules/${moduleData.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId: selectedVersionId,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        showToast(json.error || "Gagal mem-publish versi.", "error");
      } else {
        setModuleData({
          ...moduleData,
          status: "published",
          currentVersionId: selectedVersionId,
        });
        showToast("Modul berhasil di-publish dan aktif untuk siswa!");
      }
    } catch (err: any) {
      showToast(err.message || "Gagal melakukan publish.", "error");
    } finally {
      setPublishing(false);
    }
  };

  // Dokumen gabungan untuk Live Preview sandbox
  const previewDocument = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${cssCode}</style>
      </head>
      <body>
        ${htmlCode}
        <script>
          // Mock SDK untuk preview di dashboard
          window.Kabiru = {
            ready: () => console.log("[SANDBOX PREVIEW] Kabiru.ready() dipanggil"),
            finish: (res) => alert("[SANDBOX PREVIEW] Modul Selesai! Skor: " + res.score + ", Completed: " + res.completed)
          };
          ${jsCode}
        </script>
      </body>
    </html>
  `;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-16 right-6 z-50 px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg border transition ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Editor Sub-header Bar */}
      <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            {moduleData.title}
          </h2>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide uppercase ${
              moduleData.status === "published"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
            }`}
          >
            {moduleData.status}
          </span>
        </div>

        {/* Versi Switcher & Tombol Aksi */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span>Versi:</span>
            <select
              value={selectedVersionId}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2 py-1 text-xs font-mono text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              {moduleData.versions.map((ver) => (
                <option key={ver.id} value={ver.id}>
                  v{ver.versionNo} {ver.id === moduleData.currentVersionId ? "(Aktif)" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveNewVersion}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 transition disabled:opacity-50"
            title="Simpan perubahan sebagai versi baru yang immutable"
          >
            {saving ? "Menyimpan..." : "Simpan Versi Baru"}
          </button>

          <button
            onClick={handlePublish}
            disabled={publishing || moduleData.currentVersionId === selectedVersionId}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition disabled:opacity-40"
            title="Tandai versi ini sebagai versi aktif untuk siswa"
          >
            {moduleData.currentVersionId === selectedVersionId ? "Versi Ter-publish" : "Publish"}
          </button>
        </div>
      </div>

      {/* Editor Tab Bar */}
      <div className="h-10 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 sm:px-6 flex items-center justify-between text-xs font-medium shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("html")}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === "html"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs border border-neutral-200/80 dark:border-neutral-800"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            index.html
          </button>

          <button
            onClick={() => setActiveTab("css")}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === "css"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs border border-neutral-200/80 dark:border-neutral-800"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            styles.css
          </button>

          <button
            onClick={() => setActiveTab("js")}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === "js"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs border border-neutral-200/80 dark:border-neutral-800"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            script.js
          </button>

          <button
            onClick={() => setActiveTab("manifest")}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === "manifest"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs border border-neutral-200/80 dark:border-neutral-800"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            manifest.json
          </button>
        </div>

        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
            activeTab === "preview"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800"
          }`}
        >
          <span>▶ Preview Sandbox</span>
        </button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 relative overflow-hidden bg-white dark:bg-neutral-900">
        {activeTab === "html" && (
          <div className="absolute inset-0">
            <MonacoEditor
              height="100%"
              language="html"
              theme="vs-dark"
              value={htmlCode}
              onChange={(val) => setHtmlCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                automaticLayout: true,
              }}
            />
          </div>
        )}

        {activeTab === "css" && (
          <div className="absolute inset-0">
            <MonacoEditor
              height="100%"
              language="css"
              theme="vs-dark"
              value={cssCode}
              onChange={(val) => setCssCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                automaticLayout: true,
              }}
            />
          </div>
        )}

        {activeTab === "js" && (
          <div className="absolute inset-0">
            <MonacoEditor
              height="100%"
              language="javascript"
              theme="vs-dark"
              value={jsCode}
              onChange={(val) => setJsCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                automaticLayout: true,
              }}
            />
          </div>
        )}

        {activeTab === "manifest" && (
          <div className="absolute inset-0 overflow-y-auto p-8">
            <div className="max-w-xl mx-auto space-y-5">
              <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                Konfigurasi Kontrak Manifest (FR-04)
              </h3>
              <div>
              <label className="block text-xs font-medium uppercase text-neutral-500 mb-1">
                Max Score (Skor Maksimal)
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Host LMS akan memvalidasi agar skor yang dikirim modul tidak melebihi angka ini.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase text-neutral-500 mb-1">
                Contract Version
              </label>
              <input
                type="text"
                disabled
                value="1.0"
                className="w-full px-3 py-2 text-sm font-mono bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-500"
              />
            </div>
          </div>
          </div>
        )}

        {activeTab === "preview" && (
          <div className="absolute inset-0 flex flex-col bg-neutral-100 dark:bg-neutral-950 p-4">
            <div className="mb-2 text-xs font-mono text-neutral-400 flex items-center justify-between">
              <span>Sandbox Status: allow-scripts (Terisolasi)</span>
              <span>Live Render</span>
            </div>
            <iframe
              srcDoc={previewDocument}
              sandbox="allow-scripts"
              title="Preview Modul"
              className="w-full flex-1 border border-neutral-300 dark:border-neutral-800 rounded-xl bg-white shadow-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
}
