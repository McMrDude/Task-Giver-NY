"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";

type User = {
  name: string;
  email: string;
  role: string;
};

type Ticket = {
  id: number;
  content: string;
  category: string;
  priority: string;
  status: string;
  due_date: string | null;
  created_at: string;
};

export default function AdminDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(
    null
  );

  const [tickets, setTickets] = useState<
    Ticket[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
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

      if (me.user.role !== "admin") {
        router.push("/");
        return;
      }

      setUser(me.user);

      const ticketResponse = await fetch(
        "/api/admin/tasks"
      );

      const ticketResult =
        await ticketResponse.json();

      if (!ticketResult.success) {
        setError(ticketResult.error);
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

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Laster adminpanel...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      </main>
    );
  }

  const totalTickets = tickets.length;

  const openTickets = tickets.filter(
    (ticket) =>
      ticket.status === "not_started"
  ).length;

  const highPriorityTickets =
    tickets.filter(
      (ticket) =>
        ticket.priority === "høy" ||
        ticket.priority === "high"
    ).length;

  const inProgressTickets =
    tickets.filter(
      (ticket) =>
        ticket.status === "in_progress" ||
        ticket.status === "pågår"
    ).length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

      <div className="flex min-h-screen">


        {/* SIDEBAR */}

        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">


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

            <button
              className="w-full cursor-pointer rounded-lg bg-blue-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
            >
              Dashboard
            </button>

            <button
              onClick={() =>
                router.push("/")
              }
              className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Mine saker
            </button>


            <div className="px-3 pb-2 pt-6">

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Admin
              </p>

            </div>


            <button
              className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Alle saker
            </button>

            <button
              className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Ansatte
            </button>

          </nav>


          {/* BOTTOM */}

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">

            <div className="mb-3">
              <ThemeToggle />
            </div>


            {/* ACCOUNT */}

            <div className="mb-3 flex items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
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
              className="w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Logg ut
            </button>

          </div>

        </aside>


        {/* MAIN */}

        <section className="min-w-0 flex-1">


          {/* HEADER */}

          <header className="border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900 lg:px-8">

            <div>

              <p className="text-sm font-medium text-blue-600">
                Administrasjon
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Oversikt over alle støttesaker.
              </p>

            </div>

          </header>


          {/* CONTENT */}

          <div className="space-y-8 p-6 lg:p-8">


            {/* STATISTICS */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                title="Totale saker"
                value={totalTickets}
                description="Alle registrerte saker"
              />

              <StatCard
                title="Åpne"
                value={openTickets}
                description="Venter på behandling"
              />

              <StatCard
                title="Høy prioritet"
                value={
                  highPriorityTickets
                }
                description="Krever oppmerksomhet"
                important
              />

              <StatCard
                title="Pågår"
                value={
                  inProgressTickets
                }
                description="Saker som behandles"
              />

            </div>


            {/* TICKETS */}

            <section>

              <div className="mb-4">

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Alle saker
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Administrer og følg opp
                  registrerte støttesaker.
                </p>

              </div>


              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                {tickets.length ===
                0 ? (

                  <div className="p-10 text-center">

                    <p className="font-medium text-slate-700 dark:text-slate-200">
                      Ingen saker
                    </p>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Det finnes ingen
                      registrerte
                      støttesaker.
                    </p>

                  </div>

                ) : (

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">

                    {tickets.map(
                      (ticket) => (
                        <TicketRow
                          key={
                            ticket.id
                          }
                          ticket={
                            ticket
                          }
                        />
                      )
                    )}

                  </div>

                )}

              </div>

            </section>

          </div>

        </section>

      </div>

    </main>
  );
}


/* STAT CARD */

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
            ? "text-red-600"
            : "text-slate-900 dark:text-white"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}


/* TICKET ROW */

function TicketRow({
  ticket,
}: {
  ticket: Ticket;
}) {
  return (
    <div className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 md:flex-row md:items-center">


      {/* ID */}

      <div className="w-16 shrink-0">

        <p className="text-xs font-medium text-slate-400">
          SAK
        </p>

        <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
          #{ticket.id}
        </p>

      </div>


      {/* MAIN */}

      <div className="min-w-0 flex-1">

        <div className="mb-1 flex flex-wrap items-center gap-2">

          <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
            {ticket.category}
          </span>

          <PriorityBadge
            priority={
              ticket.priority
            }
          />

        </div>

        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
          {ticket.content}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Opprettet{" "}
          {new Date(
            ticket.created_at
          ).toLocaleDateString(
            "nb-NO"
          )}
        </p>

      </div>


      {/* STATUS */}

      <StatusBadge
        status={ticket.status}
      />


      {/* ACTION */}

      <button
        className="shrink-0 cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Åpne
      </button>

    </div>
  );
}


/* PRIORITY */

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  const isHigh =
    priority === "høy" ||
    priority === "high";

  const isMedium =
    priority === "medium";

  if (isHigh) {
    return (
      <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400">
        Høy
      </span>
    );
  }

  if (isMedium) {
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


/* STATUS */

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
      <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
        Pågår
      </span>
    );
  }

  if (
    status === "completed" ||
    status === "finished"
  ) {
    return (
      <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400">
        Ferdig
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      Åpen
    </span>
  );
}