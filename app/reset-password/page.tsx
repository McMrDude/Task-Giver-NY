"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useSearchParams,
  useRouter,
} from "next/navigation";

import Link from "next/link";


export default function ResetPasswordPage() {

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


  async function handleSubmit(
    event: FormEvent
  ) {

    event.preventDefault();

    setError("");


    if (!token) {

      setError(
        "Tilbakestillingslenken mangler."
      );

      return;

    }


    if (password !== confirmPassword) {

      setError(
        "Passordene er ikke like."
      );

      return;

    }


    if (password.length < 8) {

      setError(
        "Passordet må være minst 8 tegn."
      );

      return;

    }


    setLoading(true);


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


      setSuccess(true);


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


          {error && (

            <p className="text-sm text-red-600">
              {error}
            </p>

          )}


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white disabled:opacity-50"
          >

            {loading
              ? "Endrer passord..."
              : "Endre passord"}

          </button>

        </form>

      </div>

    </main>

  );

}