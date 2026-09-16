"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../../components/ThemeToggle";
import NotificationBell from "../../components/NotificationBell";

// ====================================================
// TYPES
// ====================================================

type User = {
  id: string | number;
  name: string;
  email: string;
  role: string;
};

type TicketStatus =
  | "not_started"
  | "started"
  | "completed"
  | "cancelled";

type Ticket = {
  id: number;

  sender_id: string | number | null;
  receiver_id: string | number | null;

  content: string;
  category: string;
  subcategory: string | null;

  status: TicketStatus;
  priority: string;

  due_date: string | null;
  created_at: string;

  sender?: {
    id: string | number;
    name: string;
    email: string;
  } | null;
};

// ====================================================
// EMPLOYEE DASHBOARD
// ====================================================

export default function EmployeeDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  // ==================================================
  // MOBILE MENU SCROLL LOCK
  // ==================================================

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    loadEmployee();
  }, []);

  async function loadEmployee() {
    try {
      // ----------------------------------------------
      // CHECK LOGIN
      // ----------------------------------------------

      const meResponse = await fetch(
        "/api/auth/me"
      );

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
      // CHECK ROLE
      // ----------------------------------------------

      if (me.user.role === "admin") {
        router.push("/admin");
        return;
      }

      if (me.user.role !== "employee") {
        router.push("/");
        return;
      }

      setUser(me.user);

      // ----------------------------------------------
      // LOAD ASSIGNED TICKETS
      // ----------------------------------------------

      const ticketResponse = await fetch(
        "/api/employee/tasks"
      );

      const ticketResult =
        await ticketResponse.json();

      if (
        !ticketResponse.ok ||
        !ticketResult.success
      ) {
        setError(
          ticketResult.error ||
            "Kunne ikke hente dine tildelte saker."
        );

        return;
      }

      const assignedTickets =
        ticketResult.data || [];

      setTickets(assignedTickets);
    } catch (err) {
      console.error(err);

      setError(
        "Kunne ikke laste ansattpanelet."
      );
    } finally {
      setLoading(false);
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
  // UPDATE TICKET STATUS
  // ==================================================

  async function updateTicketStatus(
    ticketId: number,
    status: TicketStatus
  ) {
    try {
      const response = await fetch(
        "/api/employee/tasks",
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            id: ticketId,
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

      // --------------------------------------------
      // UPDATE THE TICKET LOCALLY
      // --------------------------------------------

      setTickets(current =>
        current.map(ticket =>
          ticket.id === ticketId
            ? {
                ...ticket,
                status,
              }
            : ticket
        )
      );
    } catch (error) {
      console.error(error);

      alert(
        "En nettverksfeil oppstod."
      );
    }
  }

  // ==================================================
  // LOGOUT
  // ==================================================

  async function logout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    setMobileMenuOpen(false);

    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );
    } finally {
      router.push("/login");
    }
  }

  // ==================================================
  // ACTIVE / COMPLETED TICKETS
  // ==================================================

  const activeTickets = tickets.filter(
    ticket =>
      ticket.status !== "completed" &&
      ticket.status !== "cancelled"
  );

  const completedTickets = tickets.filter(
    ticket =>
      ticket.status === "completed"
  );

  // ==================================================
  // STATISTICS
  // ==================================================

  function isCreatedToday(
    createdAt: string
  ) {
    const created =
      new Date(createdAt);

    const now =
      new Date();

    return (
      created.getFullYear() ===
        now.getFullYear() &&
      created.getMonth() ===
        now.getMonth() &&
      created.getDate() ===
        now.getDate()
    );
  }

  const totalTickets =
    activeTickets.length;

  const inProgressTickets =
    activeTickets.filter(
      ticket =>
        ticket.status === "started"
    ).length;

  const newTickets =
    activeTickets.filter(
      ticket =>
        ticket.status ===
          "not_started" &&
        isCreatedToday(
          ticket.created_at
        )
    ).length;

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />

          <div className="text-sm text-slate-500 dark:text-slate-400">
            Laster ansattpanel...
          </div>
        </div>
      </main>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
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

      <div className="flex min-h-screen w-full min-w-0">

        {/* ==================================================
            DESKTOP SIDEBAR
        ================================================== */}

        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:flex">

          {/* LOGO / HEADER */}

          <div className="flex h-20 shrink-0 items-center gap-3 border-b border-slate-200 px-6 dark:border-slate-800">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
              IT
            </div>

            <div className="min-w-0">
              <p className="truncate font-bold text-slate-900 dark:text-white">
                IT Support
              </p>

              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                Støttesystem
              </p>
            </div>

          </div>

          {/* NAVIGATION */}

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">

            {/* OVERSIKT */}

            <button
              type="button"
              onClick={() =>
                router.push("/employee")
              }
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <span>▦</span>
              Oversikt
            </button>

            {/* MINE SAKER */}

            <button
              type="button"
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
            >
              <span>📋</span>
              Mine tildelte saker
            </button>

            {/* FULLFØRTE SAKER */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/completed-tasks"
                )
              }
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <span>✓</span>
              Fullførte saker
            </button>

            {/* HJELP */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/employee/help"
                )
              }
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <span>❓</span>
              Hjelp
            </button>

          </nav>

          {/* THEME TOGGLE */}

          <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
            <ThemeToggle />
          </div>

          {/* ACCOUNT */}

          <div className="shrink-0 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">

            {user ? (
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
                  type="button"
                  onClick={logout}
                  disabled={loggingOut}
                  className="mt-3 w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {loggingOut
                    ? "Logger ut..."
                    : "Logg ut"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() =>
                  router.push("/login")
                }
                className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Logg inn
              </button>
            )}

          </div>

        </aside>

        {/* ==================================================
            MOBILE HEADER
        ================================================== */}

        <header className="fixed inset-x-0 top-0 z-50 lg:hidden">

          <div className="border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/95">

            <div className="flex h-16 items-center justify-between px-4 sm:px-5">

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
                    Ansattportal
                  </p>

                </div>

              </div>

              {/* RIGHT SIDE */}

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

                {/* NOTIFICATIONS */}

                <div className="flex h-10 w-10 items-center justify-center">
                  <NotificationBell />
                </div>

                {/* LOGOUT */}

                <button
                  type="button"
                  onClick={logout}
                  disabled={loggingOut}
                  aria-label="Logg ut"
                  title="Logg ut"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
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
                      d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 17l5-5-5-5"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12H3"
                    />
                  </svg>

                  <span className="hidden sm:inline">
                    {loggingOut
                      ? "Logger ut..."
                      : "Logg ut"}
                  </span>
                </button>

                {/* HAMBURGER */}

                <button
                  type="button"
                  aria-label={
                    mobileMenuOpen
                      ? "Lukk meny"
                      : "Åpne meny"
                  }
                  aria-expanded={
                    mobileMenuOpen
                  }
                  onClick={() =>
                    setMobileMenuOpen(
                      open => !open
                    )
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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
            className="fixed inset-0 top-16 z-40 bg-slate-950/20 backdrop-blur-[2px] lg:hidden"
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

                  {/* OVERSIKT */}

                  <button
                    type="button"
                    onClick={() =>
                      navigateMobile(
                        "/employee"
                      )
                    }
                    className="flex min-h-11 w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    Oversikt
                  </button>

                  {/* MINE TILDELTE SAKER */}

                  <button
                    type="button"
                    onClick={() =>
                      navigateMobile(
                        "/employee/tasks"
                      )
                    }
                    className="flex min-h-11 w-full cursor-pointer items-center rounded-xl bg-blue-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                  >
                    Mine tildelte saker
                  </button>

                  {/* FULLFØRTE SAKER */}

                  <button
                    type="button"
                    onClick={() =>
                      navigateMobile(
                        "/completed-tasks"
                      )
                    }
                    className="flex min-h-11 w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    Fullførte saker
                  </button>

                  {/* HJELP */}

                  <button
                    type="button"
                    onClick={() =>
                      navigateMobile(
                        "/employee/help"
                      )
                    }
                    className="flex min-h-11 w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    Hjelp
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
            MAIN
        ================================================== */}

        <section className="min-w-0 w-full flex-1 lg:ml-64">

          {/* ==================================================
              DESKTOP PAGE HEADER
          ================================================== */}

          <header className="hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">

            <div className="flex min-w-0 items-start justify-between gap-4 px-6 py-6 lg:px-8">

              <div className="min-w-0">

                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Ansattportal
                </p>

                <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Mine tildelte saker
                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Her finner du støttesakene som er tildelt til deg.
                </p>

              </div>

              {/* NOTIFICATIONS */}

              <div className="shrink-0">
                <NotificationBell />
              </div>

            </div>

          </header>

          {/* ==================================================
              MOBILE PAGE HEADER
          ================================================== */}

          <div className="border-b border-slate-200 bg-white px-4 pb-6 pt-6 dark:border-slate-800 dark:bg-slate-900 sm:px-5 lg:hidden">

            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Ansattportal
            </p>

            <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Mine tildelte saker
            </h1>

            <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
              Støttesaker som er tildelt til deg.
            </p>

          </div>

          {/* ==================================================
              CONTENT
          ================================================== */}

          <div className="w-full min-w-0 space-y-8 overflow-hidden p-4 sm:p-5 lg:p-8">

            {/* ==================================================
                STATISTICS
            ================================================== */}

            <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                title="Tildelte saker"
                value={totalTickets}
                description="Totalt tildelt til deg"
              />

              <StatCard
                title="Nye"
                value={newTickets}
                description="Venter på behandling"
              />

              <StatCard
                title="Pågår"
                value={inProgressTickets}
                description="Under behandling"
              />

              <StatCard
                title="Ferdige"
                value={completedTickets.length}
                description="Ferdigbehandlede saker"
              />

            </div>

            {/* ==================================================
                TICKET SECTION
            ================================================== */}

            <section className="min-w-0">

              <div className="mb-5">

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Tildelte saker
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Her ser du alle sakene du har fått ansvar for.
                </p>

              </div>

              {/* ==================================================
                  EMPTY STATE
              ================================================== */}

              {activeTickets.length === 0 ? (

                <div className="w-full rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
                    📋
                  </div>

                  <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">
                    Ingen aktive saker
                  </p>

                  <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                    Du har ingen støttesaker å behandle akkurat nå.
                  </p>

                </div>

              ) : (

                <div className="w-full min-w-0 space-y-4">

                  {activeTickets.map(
                    ticket => (

                      <EmployeeTicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onUpdateStatus={
                          updateTicketStatus
                        }
                      />

                    )
                  )}

                </div>

              )}

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
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

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
  );
}

// ====================================================
// EMPLOYEE TICKET CARD
// ====================================================

function EmployeeTicketCard({
  ticket,
  onUpdateStatus,
}: {
  ticket: Ticket;

  onUpdateStatus: (
    ticketId: number,
    status: TicketStatus
  ) => void;
}) {
  const router = useRouter();

  return (
    <article
      onClick={() =>
        router.push(
          `/tickets/${ticket.id}`
        )
      }
      className="w-full min-w-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:p-5 lg:p-6"
    >

      {/* ==================================================
          TOP
      ================================================== */}

      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start">

        {/* ID */}

        <div className="w-full shrink-0 lg:w-16">

          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
            SAK
          </p>

          <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
            #{ticket.id}
          </p>

        </div>

        {/* CONTENT */}

        <div className="min-w-0 flex-1">

          {/* BADGES */}

          <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">

            <span className="max-w-full break-words rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
              {ticket.category}
            </span>

            {ticket.subcategory && (

              <span className="max-w-full break-words rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {ticket.subcategory}
              </span>

            )}

            <PriorityBadge
              priority={ticket.priority}
            />

          </div>

          {/* DESCRIPTION */}

          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800 dark:text-slate-200">
            {ticket.content}
          </p>

          {/* META */}

          <div className="mt-3 flex min-w-0 flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400 dark:text-slate-500">

            <span>
              Opprettet{" "}
              {new Date(
                ticket.created_at
              ).toLocaleDateString(
                "nb-NO"
              )}
            </span>

            {ticket.sender && (

              <span className="min-w-0 max-w-full">
                Fra:{" "}
                <span className="font-medium text-slate-500 dark:text-slate-300">
                  {ticket.sender.name}
                </span>
              </span>

            )}

          </div>

        </div>

        {/* STATUS */}

        <div className="shrink-0 self-start lg:self-auto">

          <StatusBadge
            status={ticket.status}
            createdAt={ticket.created_at}
          />

        </div>

      </div>

      {/* ==================================================
          FOOTER INFORMATION
      ================================================== */}

      <div className="mt-5 flex min-w-0 flex-col gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex min-w-0 flex-wrap gap-x-6 gap-y-4">

          {/* PRIORITY */}

          <div>

            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              Prioritet
            </p>

            <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
              {getPriorityLabel(
                ticket.priority
              )}
            </p>

          </div>

          {/* DUE DATE */}

          <div>

            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              Frist
            </p>

            <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
              {ticket.due_date
                ? new Date(
                    ticket.due_date
                  ).toLocaleDateString(
                    "nb-NO"
                  )
                : "Ingen frist"}
            </p>

          </div>

        </div>

        {/* STATUS */}

        <div className="w-full text-left sm:w-auto sm:text-right">

          <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Status
          </p>

          <select
            onClick={e =>
              e.stopPropagation()
            }
            value={ticket.status}
            onChange={e =>
              onUpdateStatus(
                ticket.id,
                e.target.value as TicketStatus
              )
            }
            className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950 sm:w-auto"
          >
            <option value="not_started">
              Ikke startet
            </option>

            <option value="started">
              Pågår
            </option>

            <option value="completed">
              Ferdig
            </option>
          </select>

        </div>

      </div>

    </article>
  );
}

// ====================================================
// PRIORITY BADGE
// ====================================================

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  if (
    priority === "høy" ||
    priority === "high"
  ) {
    return (
      <span className="shrink-0 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400">
        Høy
      </span>
    );
  }

  if (priority === "medium") {
    return (
      <span className="shrink-0 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
        Medium
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      Lav
    </span>
  );
}

// ====================================================
// PRIORITY LABEL
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

  if (priority === "medium") {
    return "Medium";
  }

  return "Lav";
}

// ====================================================
// STATUS BADGE
// ====================================================

function StatusBadge({
  status,
  createdAt,
}: {
  status: string;
  createdAt: string;
}) {
  if (status === "started") {
    return (
      <span className="inline-flex shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
        Pågår
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span className="inline-flex shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400">
        Ferdig
      </span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="inline-flex shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400">
        Avbrutt
      </span>
    );
  }

  if (status === "not_started") {

    const created =
      new Date(createdAt);

    const now =
      new Date();

    const isCreatedToday =
      created.getFullYear() ===
        now.getFullYear() &&
      created.getMonth() ===
        now.getMonth() &&
      created.getDate() ===
        now.getDate();

    return (
      <span className="inline-flex shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {isCreatedToday
          ? "Ny"
          : "Ikke startet"}
      </span>
    );
  }

  return null;
}