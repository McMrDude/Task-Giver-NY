"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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

    if (phone.length !== 8) {
      setError("Telefonnummeret må være nøyaktig 8 sifre.");
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
          phone,
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
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5 py-10 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">

      <div className="w-full max-w-md">

        {/* LOGO */}

        <div className="mb-8 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
            IT
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
            Opprett konto
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Opprett en konto for å kunne registrere og følge støttesaker.
          </p>

        </div>


        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:p-8"
        >

          <div className="space-y-5">

            {/* NAME */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
                Navn
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Ola Nordmann"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
              />

            </div>


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


            {/* TELEFON NUMMER */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
                Telefonnummer
              </label>
              <input
                type="text" 
                inputMode="numeric" 
                pattern="[0-9]{8}" 
                minLength={8}
                maxLength={8}
                required
                value={phone}
                onChange={(e) => {
                  // 1. Strip away everything that isn't a number
                  const cleaned = e.target.value.replace(/[^0-9]/g, "");
                  // 2. Only update state if it is 8 digits or fewer
                  if (cleaned.length <= 8) {
                    setPhone(cleaned);
                  }
                }}
                autoComplete="tel"
                placeholder="12345678" // Removed spaces to avoid confusing the user
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
                minLength={8}
                autoComplete="new-password"
                placeholder="Minst 8 tegn"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
              />

            </div>


            {/* CONFIRM PASSWORD */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
                Gjenta passord
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Gjenta passordet"
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


          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full cursor-pointer rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            {loading ? "Oppretter konto..." : "Opprett konto"}
          </button>


          {/* LOGIN */}

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">

            Har du allerede en konto?{" "}

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="cursor-pointer font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Logg inn
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