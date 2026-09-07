"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";
import NotificationBell from "../components/NotificationBell";

// ====================================================
// TYPES
// ====================================================

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Ticket = {
  id: number;

  receiver_id: string | null;

  status: string;
  priority: string;
};


// ====================================================
// ADMIN DASHBOARD
// ====================================================

export default function AdminDashboard() {

  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {

    loadAdmin();

  }, []);


  async function loadAdmin() {

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


      // ----------------------------------------------
      // CHECK ADMIN
      // ----------------------------------------------

      if (
        me.user.role !== "admin"
      ) {

        router.push("/");

        return;

      }


      setUser(me.user);


      // ----------------------------------------------
      // LOAD TICKETS
      // ----------------------------------------------
      //
      // The dashboard only needs the ticket data
      // to calculate its statistics.
      //
      // The actual ticket list now lives at:
      //
      // /admin/tickets
      //
      // ----------------------------------------------

      const ticketResponse =
        await fetch(
          "/api/admin/tasks"
        );


      const ticketResult =
        await ticketResponse.json();


      if (
        !ticketResult.success
      ) {

        setError(
          ticketResult.error ||
          "Kunne ikke hente saker."
        );

        return;

      }


      setTickets(
        ticketResult.data || []
      );


    } catch (err) {

      console.error(err);

      setError(
        "Kunne ikke laste adminpanelet."
      );

    } finally {

      setLoading(false);

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
  // STATISTICS
  // ==================================================

  const totalTickets =
    tickets.length;


  const openTickets =
    tickets.filter(
      ticket =>
        ticket.status ===
        "not_started"
    ).length;


  const inProgressTickets =
    tickets.filter(
      ticket =>
        ticket.status ===
        "started"
    ).length;


  const completedTickets =
    tickets.filter(
      ticket =>
        ticket.status ===
        "completed"
    ).length;


  const highPriorityTickets =
    tickets.filter(
      ticket =>
        ticket.priority === "høy" ||
        ticket.priority === "high"
    ).length;


  const unassignedTickets =
    tickets.filter(
      ticket =>
        !ticket.receiver_id
    ).length;


  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

        <div className="text-sm text-slate-500 dark:text-slate-400">

          Laster adminpanel...

        </div>

      </main>

    );

  }


  // ==================================================
  // ERROR
  // ==================================================

  if (error) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">

          {error}

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
            SIDEBAR
        ================================================== */}

        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">


          {/* ==================================================
              LOGO
          ================================================== */}

          <div className="border-b border-slate-200 p-5 dark:border-slate-800">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">

                IT

              </div>

              <div>

                <p className="font-bold text-slate-900 dark:text-white">

                  IT Support

                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">

                  Administrasjon

                </p>

              </div>

            </div>

          </div>


          {/* ==================================================
              NAVIGATION
          ================================================== */}

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">


            {/* ==================================================
                DASHBOARD
            ================================================== */}

            <button
              onClick={() =>
                router.push("/admin")
              }
              className="w-full cursor-pointer rounded-lg bg-blue-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
            >

              Dashboard

            </button>


            {/* ==================================================
                USER TICKETS
            ================================================== */}

            <button
              onClick={() =>
                router.push("/my-tickets")
              }
              className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >

              Mine saker

            </button>


            {/* ==================================================
                ADMIN SECTION
            ================================================== */}

            <div className="px-3 pb-2 pt-6">

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">

                Admin

              </p>

            </div>


            {/* ==================================================
                ALL TICKETS
            ================================================== */}

            <button
              onClick={() =>
                router.push("/admin/tickets")
              }
              className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >

              Alle saker

            </button>


            {/* ==================================================
                EMPLOYEES
            ================================================== */}

            <button
              onClick={() =>
                router.push("/admin/employees")
              }
              className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >

              Ansatte

            </button>

          </nav>


          {/* ==================================================
              THEME
          ================================================== */}

          <div className="border-t border-slate-200 p-3 dark:border-slate-800">

            <ThemeToggle />

          </div>


          {/* ==================================================
              ACCOUNT
          ================================================== */}

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">

            <div className="mb-3 flex items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-400">

                {user?.name
                  ?.charAt(0)
                  .toUpperCase()}

              </div>


              <div className="min-w-0">

                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">

                  {user?.name}

                </p>

                <p className="truncate text-xs text-slate-500 dark:text-slate-400">

                  Administrator

                </p>

              </div>

            </div>


            {/* ==================================================
                LOGOUT
            ================================================== */}

            <button
              onClick={logout}
              className="w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >

              Logg ut

            </button>

          </div>

        </aside>


        {/* ==================================================
            MAIN
        ================================================== */}

        <section className="min-w-0 flex-1">


          {/* ==================================================
              HEADER
          ================================================== */}

          <header className="border-b border-slate-200 bg-white px-6 py-6 dark:border-slate-800 dark:bg-slate-900 lg:px-8">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">

                  Administrasjon

                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">

                  Dashboard

                </h1>

                <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">

                  Oversikt over støttesaker og systemets status.

                </p>

              </div>


              {/* ==================================================
                  NOTIFICATIONS
              ================================================== */}

              <NotificationBell />

            </div>

          </header>


          {/* ==================================================
              CONTENT
          ================================================== */}

          <div className="space-y-8 p-6 lg:p-8">


            {/* ==================================================
                STATISTICS
            ================================================== */}

            <section>

              <div className="mb-5">

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">

                  Oversikt

                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  Status for registrerte støttesaker.

                </p>

              </div>


              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">


                <StatCard
                  title="Totale saker"
                  value={totalTickets}
                  description="Alle registrerte saker"
                />


                <StatCard
                  title="Nye"
                  value={openTickets}
                  description="Venter på behandling"
                />


                <StatCard
                  title="Pågår"
                  value={inProgressTickets}
                  description="Under behandling"
                />


                <StatCard
                  title="Ferdige"
                  value={completedTickets}
                  description="Ferdigbehandlede saker"
                />


                <StatCard
                  title="Høy prioritet"
                  value={highPriorityTickets}
                  description="Krever oppmerksomhet"
                  important
                />


                <StatCard
                  title="Ikke tildelt"
                  value={unassignedTickets}
                  description="Mangler ansvarlig"
                />

              </div>

            </section>


            {/* ==================================================
                QUICK ACCESS
            ================================================== */}

            <section>

              <div className="mb-5">

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">

                  Hurtigtilgang

                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  Gå direkte til administrasjonssidene.

                </p>

              </div>


              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">


                {/* ALL TICKETS */}

                <button
                  onClick={() =>
                    router.push("/admin/tickets")
                  }
                  className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800"
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-semibold text-slate-900 dark:text-white">

                        Alle saker

                      </p>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                        Se, søk og administrer alle støttesaker.

                      </p>

                    </div>


                    <span className="text-lg text-blue-600 transition group-hover:translate-x-1 dark:text-blue-400">

                      →

                    </span>

                  </div>

                </button>


                {/* EMPLOYEES */}

                <button
                  onClick={() =>
                    router.push("/admin/employees")
                  }
                  className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800"
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-semibold text-slate-900 dark:text-white">

                        Ansatte

                      </p>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                        Se og administrer ansatte.

                      </p>

                    </div>


                    <span className="text-lg text-blue-600 transition group-hover:translate-x-1 dark:text-blue-400">

                      →

                    </span>

                  </div>

                </button>

              </div>

            </section>

          </div>

        </section>

      </div>

    </main>

  );

}


// ====================================================
// STAT CARD
// ====================================================

function StatCard({
  title,
  value,
  description,
  important = false,
}: {
  title: string;
  value: number;
  description: string;
  important?: boolean;
}) {

  return (

    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">

        {title}

      </p>


      <p
        className={`mt-2 text-3xl font-bold ${
          important
            ? "text-red-600 dark:text-red-400"
            : "text-slate-900 dark:text-white"
        }`}
      >

        {value}

      </p>


      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">

        {description}

      </p>

    </div>

  );

}