"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passordene er ikke like.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Account successfully created.
      // Send user to login page.
      router.push("/login");
    } catch {
      setError("Kunne ikke kontakte serveren.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5 py-10">

      <div className="w-full max-w-md">

        {/* Logo */}

        <div className="mb-8 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
            IT
          </div>

          <h1 className="mt-4 text-2xl font-bold">
            Opprett konto
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Opprett en konto for å kunne registrere og følge støttesaker.
          </p>

        </div>


        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >

          <div className="space-y-5">

            {/* Name */}

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Navn
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Ola Nordmann"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

            </div>


            {/* Email */}

            <div>

              <label className="mb-2 block text-sm font-semibold">
                E-post
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="ola@example.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

            </div>


            {/* Password */}

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Passord
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Minst 8 tegn"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

            </div>


            {/* Confirm password */}

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Gjenta passord
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Gjenta passordet"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

            </div>

          </div>


          {/* Error */}

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}


          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Oppretter konto..." : "Opprett konto"}
          </button>


          {/* Login */}

          <p className="mt-6 text-center text-sm text-slate-500">

            Har du allerede en konto?{" "}

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Logg inn
            </button>

          </p>

        </form>

      </div>

    </main>
  );
}