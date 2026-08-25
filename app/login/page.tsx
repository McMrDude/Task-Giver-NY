"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (result.user.role === "admin") {
        router.push("/admin");
      } else if (result.user.role === "employee") {
        router.push("/employee");
      } else {
        router.push("/");
      }

      router.refresh();

    } catch {
      setError("Kunne ikke kontakte serveren.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5 py-10 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">

      <div className="w-full max-w-md">

        {/* LOGO / TITLE */}

        <div className="mb-8 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
            IT
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
            Velkommen tilbake
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Logg inn for å se og følge støttesakene dine.
          </p>

        </div>


        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:p-8"
        >

          <div className="space-y-5">

            {/* EMAIL */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
                E-post
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="ola@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
              />

            </div>


            {/* PASSWORD */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
                Passord
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Passord"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
              />

            </div>

          </div>


          {/* ERROR */}

          {error && (

            <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>

          )}


          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            {loading ? "Logger inn..." : "Logg inn"}
          </button>


          {/* REGISTER */}

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">

            Har du ikke en konto?{" "}

            <button
              type="button"
              onClick={() => router.push("/register")}
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Opprett konto
            </button>

          </p>

        </form>


        {/* THEME TOGGLE */}

        {/* <div className="mt-5 rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <ThemeToggle />
        </div> */}

      </div>

    </main>
  );
}