import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-mono font-bold text-2xl shadow-sm">
          K
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            LMS KABIRU
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            Dashboard Management System & Dynamic Sandbox Runtime
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 transition shadow-sm text-center"
          >
            Buka Dashboard CMS &rarr;
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 transition text-center"
          >
            Halaman Login
          </Link>
        </div>
      </div>
    </main>
  );
}
