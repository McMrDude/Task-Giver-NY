"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";
import NotificationBell from "../components/NotificationBell";

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

  sender?: {
    id: string | number;
    name: string;
    email: string;
  } | null;
};

// ====================================================
// DASHBOARD
// ====================================================

export default function EmployeeDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ==================================================
  // LOAD
  // ==================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
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

      if (me.user.role === "admin") {
        router.push("/admin");
        return;
      }

      if (me.user.role !== "employee") {
        router.push("/");
        return;
      }

      setUser(me.user);

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
            "Kunne ikke hente dine saker."
        );

        return;
      }

      setTickets(ticketResult.data || []);
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
  // LOGOUT
  // ==================================================

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
  }

  // ==================================================
  // TICKET FILTERING
  // ==================================================

  const activeTickets = useMemo(
    () =>
      tickets.filter(
        ticket =>
          ticket.status !== "completed" &&
          ticket.status !== "finished" &&
          ticket.status !== "cancelled"
      ),
    [tickets]
  );

  const completedTickets = useMemo(
    () =>
      tickets.filter(
        ticket =>
          ticket.status === "completed" ||
          ticket.status === "finished"
      ),
    [tickets]
  );

  // ==================================================
  // DASHBOARD CARD DATA
  // ==================================================

  // High-priority active tickets
  const highPriorityTickets = useMemo(
    () =>
      activeTickets.filter(
        ticket =>
          ticket.priority === "høy" ||
          ticket.priority === "high"
      ),
    [activeTickets]
  );

  // Tickets with a deadline within the next 7 days
  const upcomingDeadlineTickets = useMemo(() => {
    const now = new Date();

    const sevenDaysFromNow = new Date(
      now.getTime() +
        7 * 24 * 60 * 60 * 1000
    );

    return activeTickets.filter(ticket => {
      if (!ticket.due_date) {
        return false;
      }

      const dueDate =
        new Date(ticket.due_date);

      return (
        dueDate >= now &&
        dueDate <= sevenDaysFromNow
      );
    });
  }, [activeTickets]);

  // Overdue active tickets
  const overdueTickets = useMemo(() => {
    const now = new Date();

    return activeTickets.filter(ticket => {
      if (!ticket.due_date) {
        return false;
      }

      return (
        new Date(ticket.due_date) < now
      );
    });
  }, [activeTickets]);

  // Completed during the current week
  const completedThisWeek = useMemo(() => {
    const now = new Date();

    // Monday = 1, Sunday = 0
    const day = now.getDay();

    const daysSinceMonday =
      day === 0 ? 6 : day - 1;

    const startOfWeek = new Date(now);

    startOfWeek.setDate(
      now.getDate() - daysSinceMonday
    );

    startOfWeek.setHours(
      0,
      0,
      0,
      0
    );

    return completedTickets.filter(ticket => {
      const createdDate =
        new Date(ticket.created_at);

      return createdDate >= startOfWeek;
    });
  }, [completedTickets]);

  // ==================================================
  // PRIORITY TICKETS
  // ==================================================

  const priorityTickets = useMemo(
    () =>
      [...activeTickets]
        .sort((a, b) => {
          const priorityA =
            getPriorityWeight(a.priority);

          const priorityB =
            getPriorityWeight(b.priority);

          return priorityB - priorityA;
        })
        .slice(0, 3),
    [activeTickets]
  );

  // ==================================================
  // UPCOMING DEADLINES
  // ==================================================

  const upcomingTickets = useMemo(() => {
    const now = new Date();

    return [...activeTickets]
      .filter(ticket => {
        if (!ticket.due_date) {
          return false;
        }

        const dueDate =
          new Date(ticket.due_date);

        return dueDate >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.due_date!).getTime() -
          new Date(b.due_date!).getTime()
      )
      .slice(0, 4);
  }, [activeTickets]);

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Laster ansattpanel...
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
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
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

            {/* DASHBOARD */}

            <button
              onClick={() =>
                router.push("/employee")
              }
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
            >
              <span>▦</span>
              Oversikt
            </button>

            {/* TASKS */}

            <button
              onClick={() =>
                router.push("/employee/tasks")
              }
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <span>📋</span>
              Mine tildelte saker
            </button>

            {/* COMPLETED */}

            <button
              onClick={() =>
                router.push("/completed-tasks")
              }
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <span>✓</span>
              Fullførte saker
            </button>

            {/* HELP */}

            <button
              onClick={() =>
                router.push("/employee/help")
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
                    Ansattportal
                  </p>
                </div>

              </div>

              <button
                onClick={() =>
                  setMobileMenuOpen(
                    !mobileMenuOpen
                  )
                }
                className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Åpne meny"
              >
                ☰
              </button>

            </div>

            {mobileMenuOpen && (
              <div className="space-y-2 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                >
                  ▦ Oversikt
                </button>

                <button
                  onClick={() =>
                    router.push("/employee/tasks")
                  }
                  className="w-full rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  📋 Mine tildelte saker
                </button>

                <button
                  onClick={() =>
                    router.push("/completed-tasks")
                  }
                  className="w-full rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  ✓ Fullførte saker
                </button>

                <button
                  onClick={() =>
                    router.push("/help")
                  }
                  className="w-full rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
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

          <header className="border-b border-slate-200 bg-white px-6 py-6 dark:border-slate-800 dark:bg-slate-900 lg:px-8">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Ansattportal
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Hei, {user?.name}
                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Her får du en rask oversikt over arbeidssakene dine.
                </p>

              </div>

              <NotificationBell />

            </div>

          </header>

          {/* CONTENT */}

          <div className="space-y-8 p-5 lg:p-8">

            {/* ==================================================
                DASHBOARD CARDS
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <DashboardStat
                title="Høy prioritet"
                value={highPriorityTickets.length}
                description="Saker som bør prioriteres"
                icon="!"
              />

              <DashboardStat
                title="Frister snart"
                value={upcomingDeadlineTickets.length}
                description="Frist innen 7 dager"
                icon="◷"
              />

              <DashboardStat
                title="Forfalte"
                value={overdueTickets.length}
                description="Saker med utgått frist"
                icon="!"
                danger={
                  overdueTickets.length > 0
                }
              />

              <DashboardStat
                title="Fullført denne uken"
                value={completedThisWeek.length}
                description="Saker ferdigbehandlet"
                icon="✓"
              />

            </div>

            {/* ==================================================
                QUICK OVERVIEW
            ================================================== */}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

              {/* PRIORITY */}

              <section className="xl:col-span-2">

                <div className="mb-5 flex items-end justify-between gap-4">

                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Krever oppmerksomhet
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Saker du bør prioritere først.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      router.push("/employee/tasks")
                    }
                    className="hidden cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 sm:block"
                  >
                    Se alle →
                  </button>

                </div>

                {priorityTickets.length === 0 ? (

                  <EmptyDashboardCard />

                ) : (

                  <div className="space-y-3">

                    {priorityTickets.map(
                      ticket => (
                        <DashboardTicket
                          key={ticket.id}
                          ticket={ticket}
                        />
                      )
                    )}

                  </div>

                )}

              </section>

              {/* DEADLINES */}

              <section>

                <div className="mb-5">

                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Kommende frister
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Saker med registrert frist.
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                  {upcomingTickets.length === 0 ? (

                    <div className="py-6 text-center">

                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl dark:bg-slate-800">
                        ✓
                      </div>

                      <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Ingen kommende frister
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Du ligger godt an.
                      </p>

                    </div>

                  ) : (

                    <div className="space-y-4">

                      {upcomingTickets.map(
                        ticket => (
                          <button
                            key={ticket.id}
                            onClick={() =>
                              router.push(
                                `/tickets/${ticket.id}`
                              )
                            }
                            className="w-full cursor-pointer text-left"
                          >

                            <div className="flex items-center justify-between gap-3">

                              <div className="min-w-0">

                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                  Sak #{ticket.id}
                                </p>

                                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                  {ticket.category}
                                </p>

                              </div>

                              <p className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                                {formatDate(
                                  ticket.due_date
                                )}
                              </p>

                            </div>

                          </button>
                        )
                      )}

                    </div>

                  )}

                </div>

              </section>

            </div>

            {/* ==================================================
                QUICK ACTION
            ================================================== */}

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Klar for å jobbe?
                  </p>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Se alle sakene som er tildelt til deg.
                  </p>

                </div>

                <button
                  onClick={() =>
                    router.push("/employee/tasks")
                  }
                  className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Se mine saker
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
// DASHBOARD STAT
// ====================================================

function DashboardStat({
  title,
  value,
  description,
  icon,
  danger = false,
}: {
  title: string;
  value: number;
  description: string;
  icon: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900 ${
        danger
          ? "border-red-200 dark:border-red-900/70"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p
            className={`mt-2 text-3xl font-bold ${
              danger &&
              value > 0
                ? "text-red-600 dark:text-red-400"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {value}
          </p>

        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm ${
            danger &&
            value > 0
              ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {icon}
        </div>

      </div>

      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        {description}
      </p>

    </div>
  );
}

// ====================================================
// DASHBOARD TICKET
// ====================================================

function DashboardTicket({
  ticket,
}: {
  ticket: Ticket;
}) {
  const router = useRouter();

  return (
    <button
      onClick={() =>
        router.push(`/tickets/${ticket.id}`)
      }
      className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

        <div className="shrink-0">

          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
            SAK
          </p>

          <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
            #{ticket.id}
          </p>

        </div>

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
              {ticket.category}
            </span>

            {ticket.subcategory && (
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {ticket.subcategory}
              </span>
            )}

            <PriorityBadge
              priority={ticket.priority}
            />

          </div>

          <p className="mt-2 truncate text-sm font-medium text-slate-800 dark:text-slate-200">
            {ticket.content}
          </p>

        </div>

        <StatusBadge
          status={ticket.status}
        />

      </div>

    </button>
  );
}

// ====================================================
// EMPTY STATE
// ====================================================

function EmptyDashboardCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl dark:bg-slate-800">
        ✓
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
        Ingen saker krever oppmerksomhet
      </p>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Du har kontroll på sakene dine.
      </p>

    </div>
  );
}

// ====================================================
// PRIORITY
// ====================================================

function getPriorityWeight(priority: string) {
  if (
    priority === "høy" ||
    priority === "high"
  ) {
    return 3;
  }

  if (priority === "medium") {
    return 2;
  }

  return 1;
}

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
      <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400">
        Høy
      </span>
    );
  }

  if (priority === "medium") {
    return (
      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
        Medium
      </span>
    );
  }

  return (
    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      Lav
    </span>
  );
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
      <span className="inline-flex shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
        Pågår
      </span>
    );
  }

  if (
    status === "completed" ||
    status === "finished"
  ) {
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

  return (
    <span className="inline-flex shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      Ny
    </span>
  );
}

// ====================================================
// DATE
// ====================================================

function formatDate(date: string | null) {
  if (!date) {
    return "Ingen frist";
  }

  return new Date(date).toLocaleDateString(
    "nb-NO"
  );
}