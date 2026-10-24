import { z } from "zod";

export const manifestSchema = z.object({
  contractVersion: z.literal("1.0"),
  name: z.string().min(1, "Nama modul wajib diisi").max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung"),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "Versi harus berformat semver (contoh: 1.0.0)"),
  maxScore: z.number().int().min(1).max(1000),
  emits: z.array(z.string()).refine((arr) => arr.includes("result"), {
    message: "Emits wajib menyertakan 'result'",
  }),
});

export type ModuleManifest = z.infer<typeof manifestSchema>;

// Template default kuis pilihan ganda (FR-13)
export const DEFAULT_QUIZ_TEMPLATE = {
  manifest: {
    contractVersion: "1.0",
    name: "Kuis Pilihan Ganda Dasar",
    slug: "kuis-dasar",
    version: "1.0.0",
    maxScore: 100,
    emits: ["result"],
  } satisfies ModuleManifest,
  sourceHtml: `<!-- Template Modul KABIRU: Kuis Pilihan Ganda -->
<div class="quiz-card">
  <div class="badge">Pertanyaan 1 dari 1</div>
  <h2 id="question">Berapakah hasil dari 5 + 7?</h2>
  <div class="options">
    <button class="opt-btn" onclick="submitAnswer(10)">A. 10</button>
    <button class="opt-btn" onclick="submitAnswer(12)">B. 12</button>
    <button class="opt-btn" onclick="submitAnswer(15)">C. 15</button>
  </div>
  <div id="status" class="status-msg"></div>
</div>`,
  sourceCss: `/* Styling modul sandbox (isolasi DOM) */
body {
  margin: 0;
  padding: 16px;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #f8fafc;
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  box-sizing: border-box;
}

.quiz-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.badge {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

h2 {
  margin: 0 0 20px 0;
  font-size: 18px;
  line-height: 1.4;
  color: #1e293b;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.opt-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 15px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #334155;
}

.opt-btn:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.status-msg {
  margin-top: 16px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}`,
  sourceJs: `// Logika interaktif modul menggunakan SDK KABIRU
let isFinished = false;

// Beritahu LMS induk bahwa modul siap dimainkan
if (window.Kabiru) {
  window.Kabiru.ready();
}

function submitAnswer(choice) {
  if (isFinished) return;
  isFinished = true;

  const statusEl = document.getElementById("status");
  const isCorrect = choice === 12;
  const finalScore = isCorrect ? 100 : 0;

  if (isCorrect) {
    statusEl.innerText = "Jawaban Benar! Skor: 100";
    statusEl.style.color = "#16a34a";
  } else {
    statusEl.innerText = "Kurang Tepat. Jawaban yang benar adalah 12.";
    statusEl.style.color = "#dc2626";
  }

  // Kirim hasil akhir ke LMS induk via SDK Kabiru
  if (window.Kabiru) {
    window.Kabiru.finish({
      score: finalScore,
      completed: true
    });
  }
}`,
};
