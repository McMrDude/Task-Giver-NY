"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  async function handleSubmit(
    event: FormEvent
  ) {

    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");


    try {

      const response =
        await fetch(
          "/api/auth/forgot-password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email,
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
          "Noe gikk galt."
        );

        return;

      }


      setMessage(
        result.message
      );


    } catch (error) {

      console.error(error);

      setError(
        "En nettverksfeil oppstod."
      );


    } finally {

      setLoading(false);

    }

  }


  return (

    <main className="min-h-screen flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        <h1 className="text-3xl font-bold">
          Glemt passord?
        </h1>

        <p className="mt-2 text-slate-500">
          Skriv inn e-postadressen din,
          så sender vi deg en lenke for
          å tilbakestille passordet.
        </p>


        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >

          <div>

            <label
              htmlFor="email"
              className="block text-sm font-medium"
            >
              E-post
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={e =>
                setEmail(e.target.value)
              }
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border px-4 py-3"
              placeholder="din@email.no"
            />

          </div>


          {error && (

            <p className="text-sm text-red-600">
              {error}
            </p>

          )}


          {message && (

            <p className="text-sm text-green-600">
              {message}
            </p>

          )}


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white disabled:opacity-50"
          >

            {loading
              ? "Sender..."
              : "Send tilbakestillingslenke"}

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