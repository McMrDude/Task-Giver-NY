"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";

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

      if (!ticketResponse.ok || !ticketResult.success) {
        setError(
          ticketResult.error ||
            "Kunne ikke hente dine tildelte saker."
        );

        return;
      }

      setTickets(
        ticketResult.data || []
      );
    } catch (err) {
      console.error(err);

      setError(
        "Kunne ikke laste ansattpanelet."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateTicketStatus(
    ticketId: number,
    status: string
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


        if (!response.ok || !result.success) {

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

  const totalTickets = tickets.length;

  const inProgressTickets =
    tickets.filter(
      ticket =>
        ticket.status === "in_progress" ||
        ticket.status === "pågår"
    ).length;

  const completedTickets =
    tickets.filter(
      ticket =>
        ticket.status === "completed" ||
        ticket.status === "finished"
    ).length;

  const newTickets =
    tickets.filter(
      ticket =>
        ticket.status === "not_started"
    ).length;

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
            DESKTOP SIDEBAR
        ================================================== */}

        <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">

          {/* LOGO / HEADER */}

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

            {/* MINE SAKER */}

            <button
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


            {/* HJELP */}

            <button
              onClick={() => {
                router.push("/help");
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <span>❓</span>

              Hjelp
            </button>

          </nav>


          {/* THEME TOGGLE */}

          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <ThemeToggle />
          </div>


          {/* ACCOUNT */}

          <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">

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
                  onClick={logout}
                  className="mt-3 w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Logg ut
                </button>

              </>
            ) : (
              <button
                onClick={() => {
                  router.push("/login");
                }}
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


              {/* HAMBURGER */}

              <button
                onClick={() =>
                  setMobileMenuOpen(
                    !mobileMenuOpen
                  )
                }
                className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Åpne meny"
              >
                ☰
              </button>

            </div>


            {/* MOBILE MENU */}

            {mobileMenuOpen && (

              <div className="space-y-2 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">

                {/* CURRENT PAGE */}

                <button
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="w-full cursor-pointer rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                >
                  📋 Mine tildelte saker
                </button>


                {/* HELP */}

                <button
                  onClick={() =>
                    router.push("/help")
                  }
                  className="w-full cursor-pointer rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  ❓ Hjelp
                </button>


                {/* THEME */}

                <ThemeToggle />

              </div>

            )}

          </header>

        </div>


        {/* ==================================================
            MAIN
        ================================================== */}

        <section className="min-w-0 flex-1 lg:ml-64">


          {/* DESKTOP HEADER */}

          <header className="hidden border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900 lg:block lg:px-8">

            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Ansattportal
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Mine tildelte saker
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Her finner du støttesakene som er tildelt til deg.
            </p>

          </header>


          {/* MOBILE PAGE HEADER */}

          <div className="border-b border-slate-200 bg-white px-5 py-6 dark:border-slate-800 dark:bg-slate-900 lg:hidden">

            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Ansattportal
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Mine tildelte saker
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Støttesaker som er tildelt til deg.
            </p>

          </div>


          {/* CONTENT */}

          <div className="space-y-8 p-5 lg:p-8">


            {/* ==================================================
                STATISTICS
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

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
                value={completedTickets}
                description="Ferdigbehandlede saker"
              />

            </div>


            {/* ==================================================
                TICKET SECTION
            ================================================== */}

            <section>

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

              {tickets.length === 0 ? (

                <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
                    📋
                  </div>

                  <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">
                    Ingen tildelte saker
                  </p>

                  <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                    Du har ingen støttesaker tildelt til deg akkurat nå.
                  </p>

                </div>

              ) : (

                /* ==================================================
                   TICKET LIST
                ================================================== */

                <div className="space-y-4">

                  {tickets.map(ticket => (

                    <EmployeeTicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onUpdateStatus={
                        updateTicketStatus
                        }
                    />

                    ))}

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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
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
    status: string
  ) => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:p-6">

      {/* ==================================================
          TOP
      ================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">

        {/* ID */}

        <div className="w-16 shrink-0">

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

          <div className="mb-3 flex flex-wrap items-center gap-2">

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


          {/* DESCRIPTION */}

          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800 dark:text-slate-200">
            {ticket.content}
          </p>


          {/* META */}

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400 dark:text-slate-500">

            <span>
              Opprettet{" "}
              {new Date(
                ticket.created_at
              ).toLocaleDateString(
                "nb-NO"
              )}
            </span>


            {ticket.sender && (

              <span>
                Fra:{" "}
                <span className="font-medium text-slate-500 dark:text-slate-300">
                  {ticket.sender.name}
                </span>
              </span>

            )}

          </div>

        </div>


        {/* STATUS */}

        <div className="shrink-0">

          <StatusBadge
            status={ticket.status}
          />

        </div>

      </div>


      {/* ==================================================
          FOOTER INFORMATION
      ================================================== */}

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex flex-wrap gap-4">

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

<div className="text-left sm:text-right">

  <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
    Status
  </p>

  <select
    value={ticket.status}
    onChange={e =>
        onUpdateStatus(
            ticket.id,
            e.target.value
        )
    }
    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
  >

    <option value="not_started">
      Ny
    </option>

    <option value="in_progress">
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
}: {
  status: string;
}) {
  if (
    status === "in_progress" ||
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

  if (status === "cancelled") {
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