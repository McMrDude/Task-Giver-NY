"use client";

import {
  FormEvent,
  Suspense,
  useState,
} from "react";

import {
  useSearchParams,
  useRouter,
} from "next/navigation";

import Link from "next/link";


// ====================================================
// RESET PASSWORD FORM
// ====================================================

function ResetPasswordForm() {

  const searchParams =
    useSearchParams();

  const router =
    useRouter();


  const token =
    searchParams.get("token");


  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);


  // ==================================================
  // SUBMIT
  // ==================================================

  async function handleSubmit(
    event: FormEvent
  ) {

    event.preventDefault();

    setError("");


    // -----------------------------------------------
    // Make sure token exists
    // -----------------------------------------------

    if (!token) {

      setError(
        "Tilbakestillingslenken mangler."
      );

      return;

    }


    // -----------------------------------------------
    // Check passwords
    // -----------------------------------------------

    if (
      password !==
      confirmPassword
    ) {

      setError(
        "Passordene er ikke like."
      );

      return;

    }


    // -----------------------------------------------
    // Check password length
    // -----------------------------------------------

    if (
      password.length < 8
    ) {

      setError(
        "Passordet må være minst 8 tegn."
      );

      return;

    }


    setLoading(true);


    // =================================================
    // SEND REQUEST
    // =================================================

    try {

      const response =
        await fetch(
          "/api/auth/reset-password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              token,
              password,
            }),
          }
        );


      const result =
        await response.json();


      // -----------------------------------------------
      // API ERROR
      // -----------------------------------------------

      if (
        !response.ok ||
        !result.success
      ) {

        setError(
          result.error ||
          "Kunne ikke endre passordet."
        );

        return;

      }


      // -----------------------------------------------
      // SUCCESS
      // -----------------------------------------------

      setSuccess(true);


      // Send user back to login
      // after 2 seconds.

      setTimeout(() => {

        router.push("/login");

      }, 2000);


    } catch (error) {

      console.error(error);

      setError(
        "En nettverksfeil oppstod."
      );


    } finally {

      setLoading(false);

    }

  }


  // ==================================================
  // NO TOKEN
  // ==================================================

  if (!token) {

    return (

      <main className="min-h-screen flex items-center justify-center px-4">

        <div className="w-full max-w-md text-center">

          <h1 className="text-2xl font-bold">
            Ugyldig lenke
          </h1>

          <p className="mt-2 text-slate-500">
            Denne tilbakestillingslenken
            mangler en token.
          </p>

          <Link
            href="/forgot-password"
            className="mt-6 inline-block text-blue-600 hover:underline"
          >
            Be om en ny lenke
          </Link>

        </div>

      </main>

    );

  }


  // ==================================================
  // SUCCESS
  // ==================================================

  if (success) {

    return (

      <main className="min-h-screen flex items-center justify-center px-4">

        <div className="w-full max-w-md text-center">

          <h1 className="text-2xl font-bold">
            Passordet er endret!
          </h1>

          <p className="mt-2 text-slate-500">
            Du blir sendt til innlogging...
          </p>

        </div>

      </main>

    );

  }


  // ==================================================
  // FORM
  // ==================================================

  return (

    <main className="min-h-screen flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        <h1 className="text-3xl font-bold">
          Tilbakestill passord
        </h1>

        <p className="mt-2 text-slate-500">
          Skriv inn det nye passordet ditt.
        </p>


        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >

          {/* ----------------------------------------- */}
          {/* NEW PASSWORD */}
          {/* ----------------------------------------- */}

          <div>

            <label
              htmlFor="password"
              className="block text-sm font-medium"
            >
              Nytt passord
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={e =>
                setPassword(
                  e.target.value
                )
              }
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border px-4 py-3"
            />

          </div>


          {/* ----------------------------------------- */}
          {/* CONFIRM PASSWORD */}
          {/* ----------------------------------------- */}

          <div>

            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium"
            >
              Bekreft nytt passord
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e =>
                setConfirmPassword(
                  e.target.value
                )
              }
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border px-4 py-3"
            />

          </div>


          {/* ----------------------------------------- */}
          {/* ERROR */}
          {/* ----------------------------------------- */}

          {error && (

            <p className="text-sm text-red-600">
              {error}
            </p>

          )}


          {/* ----------------------------------------- */}
          {/* SUBMIT */}
          {/* ----------------------------------------- */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white disabled:opacity-50"
          >

            {loading
              ? "Endrer passord..."
              : "Endre passord"}

          </button>


          <Link
            href="/login"
            className="block text-center text-sm text-blue-600 hover:underline"
          >
            ← Tilbake til innlogging
          </Link>

        </form>

      </div>

    </main>

  );

}


// ====================================================
// PAGE
// ====================================================

export default function ResetPasswordPage() {

  return (

    <Suspense
      fallback={

        <main className="min-h-screen flex items-center justify-center">

          <p className="text-slate-500">
            Laster...
          </p>

        </main>

      }
    >

      <ResetPasswordForm />

    </Suspense>

  );

}