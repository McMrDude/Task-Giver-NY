"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    checkAdmin();
  }, []);


  async function checkAdmin() {

    try {

      // Check logged-in user
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

      // Not an admin
      if (me.user.role !== "admin") {
        router.push("/");
        return;
      }

      setUser(me.user);


      // Get admin-only tickets
      const ticketResponse = await fetch("/api/admin/tasks");

      const ticketResult = await ticketResponse.json();

      if (!ticketResult.success) {
        setError(ticketResult.error);
        return;
      }

      setTickets(ticketResult.data || []);

    } catch (err) {

      console.error(err);

      setError("Kunne ikke laste adminpanelet.");

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
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-sm text-slate-500">
          Laster adminpanel...
        </div>

      </main>
    );

  }


  if (error) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
          {error}
        </div>

      </main>
    );

  }


  const totalTickets = tickets.length;

  const openTickets = tickets.filter(
    ticket => ticket.status === "not_started"
  ).length;

  const highPriorityTickets = tickets.filter(
    ticket =>
      ticket.priority === "høy" ||
      ticket.priority === "high"
  ).length;

  const inProgressTickets = tickets.filter(
    ticket =>
      ticket.status === "in_progress" ||
      ticket.status === "pågår"
  ).length;


  return (

    <main className="min-h-screen bg-slate-50 text-slate-900">

      <div className="flex min-h-screen">


        {/* SIDEBAR */}

        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">

          {/* Logo */}

          <div className="border-b border-slate-200 p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                IT
              </div>

              <div>

                <p className="font-bold">
                  IT Support
                </p>

                <p className="text-xs text-slate-500">
                  Administrasjon
                </p>

              </div>

            </div>

          </div>


          {/* Navigation */}

          <nav className="flex-1 space-y-1 p-3">

            <button
              className="w-full rounded-lg bg-blue-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-700"
            >
              Dashboard
            </button>

            <button
              onClick={() => router.push("/")}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
            >
              Mine saker
            </button>


            <div className="px-3 pb-2 pt-6">

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Admin
              </p>

            </div>


            <button
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
            >
              Alle saker
            </button>

            <button
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
            >
              Ansatte
            </button>

          </nav>


          {/* Account */}

          <div className="border-t border-slate-200 p-4">

            <div className="mb-3 flex items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {user?.name?.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold">
                  {user?.name}
                </p>

                <p className="truncate text-xs text-slate-500">
                  Administrator
                </p>

              </div>

            </div>


            <button
              onClick={logout}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Logg ut
            </button>

          </div>

        </aside>


        {/* MAIN CONTENT */}

        <section className="min-w-0 flex-1">

          {/* Header */}

          <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-8">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-blue-600">
                  Administrasjon
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight">
                  Dashboard
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Oversikt over alle støttesaker.
                </p>

              </div>

            </div>

          </header>


          {/* Content */}

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
                value={highPriorityTickets}
                description="Krever oppmerksomhet"
                important
              />

              <StatCard
                title="Pågår"
                value={inProgressTickets}
                description="Saker som behandles"
              />

            </div>


            {/* TICKETS */}

            <section>

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-bold">
                    Alle saker
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Administrer og følg opp registrerte støttesaker.
                  </p>

                </div>

              </div>


              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                {tickets.length === 0 ? (

                  <div className="p-10 text-center">

                    <p className="font-medium text-slate-700">
                      Ingen saker
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Det finnes ingen registrerte støttesaker.
                    </p>

                  </div>

                ) : (

                  <div className="divide-y divide-slate-100">

                    {tickets.map(ticket => (

                      <TicketRow
                        key={ticket.id}
                        ticket={ticket}
                      />

                    ))}

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

    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p
        className={`mt-2 text-3xl font-bold ${
          important
            ? "text-red-600"
            : "text-slate-900"
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

    <div className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 md:flex-row md:items-center">

      {/* ID */}

      <div className="w-16 shrink-0">

        <p className="text-xs font-medium text-slate-400">
          SAK
        </p>

        <p className="font-mono text-sm font-semibold">
          #{ticket.id}
        </p>

      </div>


      {/* Main content */}

      <div className="min-w-0 flex-1">

        <div className="mb-1 flex flex-wrap items-center gap-2">

          <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
            {ticket.category}
          </span>

          <PriorityBadge priority={ticket.priority} />

        </div>

        <p className="truncate text-sm font-medium text-slate-800">
          {ticket.content}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Opprettet{" "}
          {new Date(ticket.created_at).toLocaleDateString("nb-NO")}
        </p>

      </div>


      {/* Status */}

      <StatusBadge status={ticket.status} />


      {/* Action */}

      <button
        className="shrink-0 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-white"
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
      <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
        Høy
      </span>
    );

  }


  if (isMedium) {

    return (
      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
        Medium
      </span>
    );

  }


  return (
    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
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
      <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
        Pågår
      </span>
    );

  }


  if (
    status === "completed" ||
    status === "finished"
  ) {

    return (
      <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        Ferdig
      </span>
    );

  }


  return (
    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
      Åpen
    </span>
  );
}