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
  created_at: string;
};

// ====================================================
// ADMIN DASHBOARD
// ====================================================

export default function AdminDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

      const meResponse = await fetch("/api/auth/me");

      if (!meResponse.ok) {
        router.push("/login");
        return;
      }

      const me = await meResponse.json();

      if (!me.success || !me.user) {
        router.push("/login");
        return;
      }

      // ----------------------------------------------
      // CHECK ADMIN
      // ----------------------------------------------

      if (me.user.role !== "admin") {
        router.push("/");
        return;
      }

      setUser(me.user);

      // ----------------------------------------------
      // LOAD TICKETS
      // ----------------------------------------------

      const ticketResponse = await fetch("/api/admin/tasks");

      const ticketResult = await ticketResponse.json();

      if (!ticketResult.success) {
        setError(
          ticketResult.error ||
            "Kunne ikke hente saker."
        );

        return;
      }

      setTickets(ticketResult.data || []);
    } catch (err) {
      console.error(err);

      setError(
        "Kunne ikke laste adminpanelet."
      );
    } finally {
        setAuthLoading(false);
        setLoading(false);
    }
  }

  // ==================================================
  // LOCK BODY SCROLL WHEN MOBILE MENU IS OPEN
  // ==================================================

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        originalOverflow;
    };
  }, [mobileMenuOpen]);

  // ==================================================
  // LOGOUT
  // ==================================================

  async function logout() {
    try {
      setLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  }

  // ==================================================
  // MOBILE NAVIGATION
  // ==================================================

  function navigateMobile(path: string) {
    setMobileMenuOpen(false);
    router.push(path);
  }

  // ==================================================
  // STATUS STATISTICS
  // ==================================================

  const totalTickets = tickets.length;

  // --------------------------------------------------
  // IKKE TILDELT
  // --------------------------------------------------

  const unassignedTickets = tickets.filter(
    (ticket) => !ticket.receiver_id
  ).length;

  // --------------------------------------------------
  // NYE
  //
  // Assigned + not started + created less than 24h ago
  // --------------------------------------------------

  const newTickets = tickets.filter((ticket) => {
    if (
      ticket.status !== "not_started" ||
      !ticket.receiver_id
    ) {
      return false;
    }

    const createdAt =
      new Date(ticket.created_at).getTime();

    if (!Number.isFinite(createdAt)) {
      return false;
    }

    return (
      Date.now() - createdAt <
      24 * 60 * 60 * 1000
    );
  }).length;

  // --------------------------------------------------
  // IKKE STARTET
  //
  // Assigned + not started + older than 24h
  // --------------------------------------------------

  const notStartedTickets = tickets.filter((ticket) => {
    if (
      ticket.status !== "not_started" ||
      !ticket.receiver_id
    ) {
      return false;
    }

    const createdAt =
      new Date(ticket.created_at).getTime();

    if (!Number.isFinite(createdAt)) {
      return true;
    }

    return (
      Date.now() - createdAt >=
      24 * 60 * 60 * 1000
    );
  }).length;

  // --------------------------------------------------
  // PÅGÅR
  // --------------------------------------------------

  const inProgressTickets = tickets.filter(
    (ticket) =>
      ticket.status === "started"
  ).length;

  // --------------------------------------------------
  // FERDIGE
  // --------------------------------------------------

  const completedTickets = tickets.filter(
    (ticket) =>
      ticket.status === "completed"
  ).length;

  // --------------------------------------------------
  // OTHER STATISTICS
  // --------------------------------------------------

  const highPriorityTickets = tickets.filter(
    (ticket) =>
      ticket.priority === "høy" ||
      ticket.priority === "high"
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
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

      {/* ==================================================
          MOBILE HEADER
      ================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">

        <div className="flex h-16 items-center justify-between px-4">

          {/* BRAND */}

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
              IT
            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                IT Support
              </p>

              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                Administrasjon
              </p>

            </div>

          </div>


          {/* RIGHT SIDE */}

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

            {!authLoading && user && (
              <div className="flex h-10 w-10 items-center justify-center">
                <NotificationBell />
              </div>
            )}

            {!authLoading && (
              <>
                {user ? (
                  <button
                    type="button"
                    onClick={logout}
                    disabled={loggingOut}
                    aria-label="Logg ut"
                    title="Logg ut"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <svg
                      className="h-4 w-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M10 17l5-5-5-5" />
                      <path d="M15 12H3" />
                      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
                    </svg>

                    <span className="hidden sm:inline">
                      {loggingOut ? "Logger ut..." : "Logg ut"}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigateMobile("/login")}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
                  >
                    <svg
                      className="h-4 w-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <path d="M10 17l5-5-5-5" />
                      <path d="M15 12H3" />
                    </svg>

                    <span>Logg inn</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              aria-label={
                mobileMenuOpen
                  ? "Lukk meny"
                  : "Åpne meny"
              }
              aria-expanded={mobileMenuOpen}
              onClick={() =>
                setMobileMenuOpen(
                  (open) => !open
                )
              }
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 dark:active:bg-slate-700"
            >
              {mobileMenuOpen ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6l12 12M18 6L6 18"
                  />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>

          </div>

        </div>

      </header>

      


      {/* ==================================================
          MOBILE MENU BACKDROP
      ================================================== */}

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Lukk meny"
          onClick={() =>
            setMobileMenuOpen(false)
          }
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[2px] lg:hidden"
        />
      )}


      {/* ==================================================
          MOBILE MENU
      ================================================== */}

      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950 lg:hidden">

          <div className="p-4">

            {/* ==================================================
                NAVIGATION
            ================================================== */}

            <div>

              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Navigasjon
              </p>

              <div className="space-y-1">

                {/* DASHBOARD */}

                <button
                  type="button"
                  onClick={() =>
                    navigateMobile("/admin")
                  }
                  className="flex min-h-11 w-full cursor-pointer items-center rounded-xl bg-blue-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                >
                  Dashboard
                </button>


                {/* ALL TICKETS */}

                <button
                  type="button"
                  onClick={() =>
                    navigateMobile(
                      "/admin/tickets"
                    )
                  }
                  className="flex min-h-11 w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Alle saker
                </button>


                {/* EMPLOYEES */}

                <button
                  type="button"
                  onClick={() =>
                    navigateMobile(
                      "/admin/employees"
                    )
                  }
                  className="flex min-h-11 w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Ansatte
                </button>

              </div>

            </div>


            {/* ==================================================
                ACCOUNT
            ================================================== */}

            <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">

              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Konto
              </p>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">

                <div className="flex min-w-0 items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                    {user?.name
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {user?.name}
                    </p>

                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {user?.email}
                    </p>

                  </div>

                </div>

              </div>


              {/* LOGOUT */}

              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="mt-3 flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {loggingOut
                  ? "Logger ut..."
                  : "Logg ut"}
              </button>

            </div>


            {/* ==================================================
                APPEARANCE
            ================================================== */}

            <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">

              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Utseende
              </p>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
                <ThemeToggle />
              </div>

            </div>

          </div>

        </div>
      )}


      {/* ==================================================
          DESKTOP LAYOUT
      ================================================== */}

      <div className="flex min-h-screen w-full">

        {/* ==================================================
            SIDEBAR
        ================================================== */}

        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:flex">

          {/* LOGO */}

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


          {/* NAVIGATION */}

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">

            {/* DASHBOARD */}

            <button
              onClick={() =>
                router.push("/admin")
              }
              className="w-full cursor-pointer rounded-lg bg-blue-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
            >
              Dashboard
            </button>


            {/* ADMIN SECTION */}

            <div className="px-3 pb-2 pt-6">

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Admin
              </p>

            </div>


            {/* ALL TICKETS */}

            <button
              onClick={() =>
                router.push("/admin/tickets")
              }
              className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Alle saker
            </button>


            {/* EMPLOYEES */}

            <button
              onClick={() =>
                router.push("/admin/employees")
              }
              className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Ansatte
            </button>

          </nav>


          {/* THEME */}

          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <ThemeToggle />
          </div>


          {/* ACCOUNT */}

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


            {/* LOGOUT */}

            <button
              onClick={logout}
              disabled={loggingOut}
              className="w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {loggingOut
                ? "Logger ut..."
                : "Logg ut"}
            </button>

          </div>

        </aside>


        {/* ==================================================
            MAIN
        ================================================== */}

        <section className="min-w-0 w-full flex-1">

          {/* ==================================================
              HEADER
          ================================================== */}

          <header className="border-b border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900 sm:px-5 sm:py-6 lg:px-8">

            <div className="flex min-w-0 items-start justify-between gap-4">

              <div className="min-w-0">

                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Administrasjon
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Dashboard
                </h1>

                <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                  En samlet oversikt over supportsystemet og saker som trenger oppmerksomhet.
                </p>

              </div>

              <div className="hidden shrink-0 lg:block">
                <NotificationBell />
              </div>

            </div>

          </header>


          {/* ==================================================
              CONTENT
          ================================================== */}

          <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:space-y-8 sm:px-5 sm:py-6 lg:p-8">

            {/* ==================================================
                WELCOME
            ================================================== */}

            <section>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                  <div className="min-w-0">

                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Velkommen tilbake
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                      Hei, {user?.name}
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Her finner du en rask oversikt over supportsaker,
                      prioriteringer og hva som trenger oppfølging.
                    </p>

                  </div>


                  <button
                    onClick={() =>
                      router.push("/admin/tickets")
                    }
                    className="min-h-11 w-full shrink-0 cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
                  >
                    Se alle saker
                  </button>

                </div>

              </div>

            </section>


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


              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                <StatCard
                  title="Totale saker"
                  value={totalTickets}
                  description="Alle registrerte saker"
                />

                <StatCard
                  title="Nye"
                  value={newTickets}
                  description="Opprettet siste 24 timer"
                  accent="blue"
                />

                <StatCard
                  title="Pågår"
                  value={inProgressTickets}
                  description="Under behandling"
                  accent="amber"
                />

                <StatCard
                  title="Ferdige"
                  value={completedTickets}
                  description="Ferdigbehandlede saker"
                  accent="green"
                />

                <StatCard
                  title="Høy prioritet"
                  value={highPriorityTickets}
                  description="Krever oppmerksomhet"
                  accent="red"
                />

                <StatCard
                  title="Ikke tildelt"
                  value={unassignedTickets}
                  description="Mangler ansvarlig"
                  accent="orange"
                />

              </div>

            </section>


            {/* ==================================================
                STATUS + ATTENTION
            ================================================== */}

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">

              {/* ==================================================
                  STATUS OVERVIEW
              ================================================== */}

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">

                <div className="mb-6">

                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Saksstatus
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Fordeling av alle registrerte saker.
                  </p>

                </div>


                <div className="space-y-5">

                  <StatusProgress
                    label="Ikke tildelt"
                    value={unassignedTickets}
                    total={totalTickets}
                    type="unassigned"
                  />

                  <StatusProgress
                    label="Nye"
                    value={newTickets}
                    total={totalTickets}
                    type="new"
                  />

                  <StatusProgress
                    label="Ikke startet"
                    value={notStartedTickets}
                    total={totalTickets}
                    type="notStarted"
                  />

                  <StatusProgress
                    label="Pågår"
                    value={inProgressTickets}
                    total={totalTickets}
                    type="progress"
                  />

                  <StatusProgress
                    label="Ferdige"
                    value={completedTickets}
                    total={totalTickets}
                    type="completed"
                  />

                </div>

              </div>


              {/* ==================================================
                  NEEDS ATTENTION
              ================================================== */}

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">

                <div className="mb-6">

                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Trenger oppmerksomhet
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Saker som bør følges opp.
                  </p>

                </div>


                <div className="space-y-3">

                  {/* HIGH PRIORITY */}

                  <AttentionItem
                    title="Høy prioritet"
                    description="Saker som krever rask oppfølging."
                    value={highPriorityTickets}
                    type="danger"
                    onClick={() =>
                      router.push(
                        "/admin/tickets?priority=high"
                      )
                    }
                  />


                  {/* UNASSIGNED */}

                  <AttentionItem
                    title="Ikke tildelte saker"
                    description="Saker som mangler en ansvarlig."
                    value={unassignedTickets}
                    type="warning"
                    onClick={() =>
                      router.push(
                        "/admin/tickets?unassigned=true"
                      )
                    }
                  />

                </div>

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
                  Gå direkte til de viktigste administrasjonssidene.
                </p>

              </div>


              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* ALL TICKETS */}

                <QuickAccessCard
                  title="Alle saker"
                  description="Se, søk, filtrer og administrer alle støttesaker."
                  icon="▤"
                  onClick={() =>
                    router.push(
                      "/admin/tickets"
                    )
                  }
                />


                {/* EMPLOYEES */}

                <QuickAccessCard
                  title="Ansatte"
                  description="Se og administrer ansatte som håndterer støttesaker."
                  icon="♙"
                  onClick={() =>
                    router.push(
                      "/admin/employees"
                    )
                  }
                />

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
  accent = "default",
}: {
  title: string;
  value: number;
  description: string;
  accent?:
    | "default"
    | "blue"
    | "amber"
    | "green"
    | "red"
    | "orange";
}) {

  const accentClasses = {
    default:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",

    blue:
      "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",

    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",

    green:
      "bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400",

    red:
      "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",

    orange:
      "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
  };

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-5">

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {description}
          </p>

        </div>


        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${accentClasses[accent]}`}
        >
          {value}
        </div>

      </div>

    </div>
  );
}


// ====================================================
// STATUS PROGRESS
// ====================================================

function StatusProgress({
  label,
  value,
  total,
  type,
}: {
  label: string;
  value: number;
  total: number;
  type:
    | "unassigned"
    | "new"
    | "notStarted"
    | "progress"
    | "completed";
}) {

  const barClasses = {
    unassigned: "bg-orange-500",
    new: "bg-blue-500",
    notStarted: "bg-slate-500",
    progress: "bg-amber-500",
    completed: "bg-green-500",
  };

  const percentage =
    total > 0
      ? (value / total) * 100
      : 0;

  const safePercentage =
    Math.min(
      Math.max(percentage, 0),
      100
    );

  return (
    <div>

      <div className="mb-2 flex items-center justify-between">

        <div className="flex items-center gap-2">

          <span
            className={`h-2.5 w-2.5 rounded-full ${barClasses[type]}`}
          />

          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </span>

        </div>

        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {value}
        </span>

      </div>


      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">

        <div
          className={`h-full rounded-full transition-all ${barClasses[type]}`}
          style={{
            width: `${safePercentage}%`,
          }}
        />

      </div>


      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        {total > 0
          ? `${Math.round(safePercentage)}% av alle saker`
          : "Ingen registrerte saker"}
      </p>

    </div>
  );
}


// ====================================================
// ATTENTION ITEM
// ====================================================

function AttentionItem({
  title,
  description,
  value,
  type,
  onClick,
}: {
  title: string;
  description: string;
  value: number;
  type: "danger" | "warning" | "info";
  onClick: () => void;
}) {

  const styles = {
    danger: {
      wrapper:
        "border-red-200 bg-red-50/70 hover:border-red-300 dark:border-red-900/60 dark:bg-red-950/20 dark:hover:border-red-800",

      badge:
        "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    },

    warning: {
      wrapper:
        "border-amber-200 bg-amber-50/70 hover:border-amber-300 dark:border-amber-900/60 dark:bg-amber-950/20 dark:hover:border-amber-800",

      badge:
        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    },

    info: {
      wrapper:
        "border-blue-200 bg-blue-50/70 hover:border-blue-300 dark:border-blue-900/60 dark:bg-blue-950/20 dark:hover:border-blue-800",

      badge:
        "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    },
  };

  return (
    <button
      onClick={onClick}
      className={`group flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 text-left transition ${styles[type].wrapper}`}
    >

      <div className="min-w-0">

        <p className="font-semibold text-slate-900 dark:text-white">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>

      </div>


      <div className="flex shrink-0 items-center gap-3">

        <span
          className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-bold ${styles[type].badge}`}
        >
          {value}
        </span>

        <span className="text-slate-400 transition group-hover:translate-x-1 dark:text-slate-500">
          →
        </span>

      </div>

    </button>
  );
}


// ====================================================
// QUICK ACCESS CARD
// ====================================================

function QuickAccessCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {

  return (
    <button
      onClick={onClick}
      className="group flex min-h-20 w-full cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800 sm:gap-5 sm:p-6"
    >

      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
        {icon}
      </div>


      <div className="min-w-0 flex-1">

        <p className="font-semibold text-slate-900 dark:text-white">
          {title}
        </p>

        <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>

      </div>


      <span className="shrink-0 text-lg text-blue-600 transition group-hover:translate-x-1 dark:text-blue-400">
        →
      </span>

    </button>
  );
}