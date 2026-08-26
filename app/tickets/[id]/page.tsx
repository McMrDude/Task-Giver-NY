"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import ThemeToggle from "../../components/ThemeToggle";


// ====================================================
// TYPES
// ====================================================

type User = {
  id: string | number;
  name: string;
  email: string;
  role: string;
};

type Ticket = {
  id: number;

  sender_id: string | number | null;
  receiver_id: string | number | null;

  content: string;
  category: string;
  subcategory: string | null;

  status: string;
  priority: string;

  due_date: string | null;
  created_at: string;
};


// ====================================================
// PAGE
// ====================================================

export default function TicketDetailPage() {

  const router = useRouter();

  const params = useParams();

  const id = params.id;


  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [user, setUser] =
    useState<User | null>(null);

  const [ticket, setTicket] =
    useState<Ticket | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);


  // ==================================================
  // LOAD
  // ==================================================

  useEffect(() => {

    loadTicket();

  }, [id]);


  async function loadTicket() {

    try {

      // ----------------------------------------------
      // CHECK LOGIN
      // ----------------------------------------------

      const meResponse =
        await fetch("/api/auth/me");

      if (!meResponse.ok) {

        router.push("/login");

        return;

      }

      const me =
        await meResponse.json();

      if (
        !me.success ||
        !me.user
      ) {

        router.push("/login");

        return;

      }

      setUser(me.user);


      // ----------------------------------------------
      // LOAD TICKET
      // ----------------------------------------------

      const response =
        await fetch(
          `/api/tasks/${id}`
        );

      const result =
        await response.json();


      if (!response.ok || !result.success) {

        setError(
          result.error ||
          "Kunne ikke hente saken."
        );

        return;

      }


      setTicket(result.data);

    } catch (error) {

      console.error(error);

      setError(
        "Kunne ikke laste saken."
      );

    } finally {

      setLoading(false);

    }

  }


  // ==================================================
  // UPDATE STATUS
  // ==================================================

  async function updateStatus(
    status: string
  ) {

    if (!ticket) {
      return;
    }

    setUpdatingStatus(true);

    try {

      const response =
        await fetch(
          "/api/employee/tasks",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id: ticket.id,
              status,
            }),
          }
        );


      const result =
        await response.json();


      if (
        !response.ok ||
        !result.success
      ) {

        alert(
          result.error ||
          "Kunne ikke oppdatere saken."
        );

        return;

      }


      setTicket(current => {

        if (!current) {
          return current;
        }

        return {
          ...current,
          status,
        };

      });

    } catch (error) {

      console.error(error);

      alert(
        "En nettverksfeil oppstod."
      );

    } finally {

      setUpdatingStatus(false);

    }

  }


  // ==================================================
  // LOGOUT
  // ==================================================

  async function logout() {

    await fetch(
      "/api/auth/logout",
      {
        method: "POST",
      }
    );

    router.push("/login");

  }


  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

        <div className="text-sm text-slate-500 dark:text-slate-400">

          Laster sak...

        </div>

      </main>
    );

  }


  // ==================================================
  // ERROR
  // ==================================================

  if (error || !ticket) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">

          {error || "Saken ble ikke funnet."}

        </div>

      </main>
    );

  }


  // ==================================================
  // PAGE
  // ==================================================

  return (

    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

      <div className="flex min-h-screen">


        {/* ==================================================
            DESKTOP SIDEBAR
        ================================================== */}

        <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">


          {/* LOGO */}

          <div className="flex h-20 shrink-0 items-center gap-3 border-b border-slate-200 px-6 dark:border-slate-800">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
              IT
            </div>

            <div>

              <p className="font-bold text-slate-900 dark:text-white">
                IT Support
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Støttesystem
              </p>

            </div>

          </div>


          {/* NAVIGATION */}

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">

            <button
              onClick={() => {

                if (user?.role === "employee") {
                  router.push("/employee");
                } else {
                  router.push("/my-tasks");
                }

              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >

              <span>←</span>

              Mine saker

            </button>


            <button
              onClick={() =>
                router.push("/help")
              }
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >

              <span>❓</span>

              Hjelp

            </button>

          </nav>


          {/* THEME */}

          <div className="border-t border-slate-200 p-3 dark:border-slate-800">

            <ThemeToggle />

          </div>


          {/* ACCOUNT */}

          <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">

            {user && (

              <>

                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-400">

                    {user.name
                      .charAt(0)
                      .toUpperCase()}

                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">

                      {user.name}

                    </p>

                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">

                      {user.email}

                    </p>

                  </div>

                </div>


                <button
                  onClick={logout}
                  className="mt-3 w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >

                  Logg ut

                </button>

              </>

            )}

          </div>

        </aside>


        {/* ==================================================
            MOBILE
        ================================================== */}

        <div className="w-full lg:hidden">

          <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

            <div className="flex items-center justify-between px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
                  IT
                </div>

                <div>

                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    IT Support
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Støttesystem
                  </p>

                </div>

              </div>


              <button
                onClick={() =>
                  setMobileMenuOpen(
                    !mobileMenuOpen
                  )
                }
                className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >

                ☰

              </button>

            </div>


            {mobileMenuOpen && (

              <div className="space-y-2 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">

                <button
                  onClick={() => {

                    if (user?.role === "employee") {
                      router.push("/employee");
                    } else {
                      router.push("/my-tasks");
                    }

                  }}
                  className="w-full cursor-pointer rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >

                  ← Mine saker

                </button>


                <button
                  onClick={() =>
                    router.push("/help")
                  }
                  className="w-full cursor-pointer rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >

                  ❓ Hjelp

                </button>


                <ThemeToggle />

              </div>

            )}

          </header>

        </div>


        {/* ==================================================
            MAIN
        ================================================== */}

        <section className="min-w-0 flex-1 lg:ml-64">


          {/* HEADER */}

          <header className="border-b border-slate-200 bg-white px-5 py-6 dark:border-slate-800 dark:bg-slate-900 lg:px-8">

            <button
              onClick={() => {

                if (user?.role === "employee") {
                  router.push("/employee");
                } else {
                  router.push("/my-tasks");
                }

              }}
              className="mb-4 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >

              ← Tilbake til mine saker

            </button>


            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {user?.role === "employee"
                ? "Ansattportal"
                : "Brukerportal"}
            </p>


            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">

                  Sak #{ticket.id}

                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  {ticket.category}

                  {ticket.subcategory &&
                    ` · ${ticket.subcategory}`}

                </p>

              </div>


              <StatusBadge
                status={ticket.status}
              />

            </div>

          </header>


          {/* CONTENT */}

          <div className="mx-auto max-w-5xl space-y-6 p-5 lg:p-8">


            {/* ==================================================
                DESCRIPTION
            ================================================== */}

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">

                <h2 className="font-semibold text-slate-900 dark:text-white">

                  Beskrivelse

                </h2>

              </div>


              <div className="p-5">

                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">

                  {ticket.content}

                </p>

              </div>

            </section>


            {/* ==================================================
                INFORMATION
            ================================================== */}

            <section className="grid grid-cols-1 gap-6 md:grid-cols-2">


              {/* GENERAL */}

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                <h2 className="mb-5 font-semibold text-slate-900 dark:text-white">

                  Saksinformasjon

                </h2>


                <div className="space-y-4">

                  <InfoRow
                    label="Saksnummer"
                    value={`#${ticket.id}`}
                  />

                  <InfoRow
                    label="Kategori"
                    value={ticket.category}
                  />

                  <InfoRow
                    label="Underkategori"
                    value={
                      ticket.subcategory ||
                      "Ingen underkategori"
                    }
                  />

                  <InfoRow
                    label="Prioritet"
                    value={
                      getPriorityLabel(
                        ticket.priority
                      )
                    }
                  />

                </div>

              </div>


              {/* DATES */}

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                <h2 className="mb-5 font-semibold text-slate-900 dark:text-white">

                  Tidspunkt

                </h2>


                <div className="space-y-4">

                  <InfoRow
                    label="Opprettet"
                    value={formatDate(
                      ticket.created_at
                    )}
                  />

                  <InfoRow
                    label="Frist"
                    value={
                      ticket.due_date
                        ? formatDate(
                            ticket.due_date
                          )
                        : "Ingen frist"
                    }
                  />

                </div>

              </div>

            </section>


            {/* ==================================================
                EMPLOYEE CONTROLS
            ================================================== */}

            {user?.role === "employee" && (

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                <h2 className="font-semibold text-slate-900 dark:text-white">

                  Behandling

                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  Oppdater statusen på saken mens du arbeider med den.

                </p>


                <div className="mt-5">

                  <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">

                    Status

                  </label>


                  <select
                    value={ticket.status}
                    disabled={updatingStatus}
                    onChange={e =>
                      updateStatus(
                        e.target.value
                      )
                    }
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                  >

                    <option value="not_started">
                      Ny
                    </option>

                    <option value="started">
                      Pågår
                    </option>

                    <option value="completed">
                      Ferdig
                    </option>

                  </select>

                </div>

              </section>

            )}


            {/* ==================================================
                FUTURE ACTIVITY
            ================================================== */}

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

              <h2 className="font-semibold text-slate-900 dark:text-white">

                Aktivitet

              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                Aktivitetshistorikk kommer her.

              </p>


              <div className="mt-5 rounded-lg bg-slate-50 p-5 text-center dark:bg-slate-950">

                <p className="text-sm text-slate-400 dark:text-slate-500">

                  Ingen aktivitet registrert ennå.

                </p>

              </div>

            </section>


          </div>

        </section>

      </div>

    </main>

  );
}


// ====================================================
// INFO ROW
// ====================================================

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="flex items-start justify-between gap-4">

      <span className="text-sm text-slate-500 dark:text-slate-400">

        {label}

      </span>

      <span className="text-right text-sm font-medium text-slate-900 dark:text-slate-100">

        {value}

      </span>

    </div>

  );

}


// ====================================================
// DATE
// ====================================================

function formatDate(
  value: string
) {

  return new Date(
    value
  ).toLocaleDateString(
    "nb-NO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );

}


// ====================================================
// PRIORITY
// ====================================================

function getPriorityLabel(
  priority: string
) {

  if (
    priority === "høy" ||
    priority === "high"
  ) {
    return "Høy";
  }

  if (
    priority === "medium"
  ) {
    return "Medium";
  }

  return "Lav";

}


// ====================================================
// STATUS
// ====================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {

  if (
    status === "started" ||
    status === "pågår"
  ) {

    return (

      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">

        Pågår

      </span>

    );

  }


  if (
    status === "completed" ||
    status === "finished"
  ) {

    return (

      <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400">

        Ferdig

      </span>

    );

  }


  if (
    status === "cancelled"
  ) {

    return (

      <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400">

        Avbrutt

      </span>

    );

  }


  return (

    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">

      Ny

    </span>

  );

}