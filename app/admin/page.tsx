"use client";

import { useEffect, useMemo, useState } from "react";
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

  sender_id: string;
  receiver_id: string | null;

  content: string;
  category: string;
  subcategory: string;

  status: string;
  priority: string;

  due_date: string | null;
  created_at: string;

  sender?: {
    id: string;
    name: string;
    email: string;
  } | null;

  receiver?: {
    id: string;
    name: string;
    email: string;
  } | null;
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

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [priorityFilter, setPriorityFilter] =
    useState("all");


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
      // LOAD ALL TICKETS
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
  // FILTER TICKETS
  // ==================================================

  const filteredTickets =
    useMemo(() => {

      return tickets.filter(ticket => {

        const searchText =
          search.toLowerCase();


        const matchesSearch =
          !search ||
          ticket.content
            ?.toLowerCase()
            .includes(searchText) ||
          ticket.category
            ?.toLowerCase()
            .includes(searchText) ||
          ticket.subcategory
            ?.toLowerCase()
            .includes(searchText) ||
          ticket.sender?.name
            ?.toLowerCase()
            .includes(searchText) ||
          ticket.receiver?.name
            ?.toLowerCase()
            .includes(searchText) ||
          String(ticket.id)
            .includes(searchText);


        const matchesStatus =
          statusFilter === "all" ||
          ticket.status ===
            statusFilter;


        const matchesPriority =
          priorityFilter === "all" ||
          ticket.priority ===
            priorityFilter;


        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority
        );

      });

    }, [
      tickets,
      search,
      statusFilter,
      priorityFilter,
    ]);


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
              className="w-full cursor-pointer rounded-lg bg-blue-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
            >

              Dashboard

            </button>


            {/* USER TICKETS */}

            <button
              onClick={() =>
                router.push("/my-tickets")
              }
              className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >

              Mine saker

            </button>


            {/* ADMIN SECTION */}

            <div className="px-3 pb-2 pt-6">

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">

                Admin

              </p>

            </div>


            {/* ALL TICKETS */}

            <button
              onClick={() => {

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });

              }}
              className="w-full cursor-pointer rounded-lg bg-slate-100 px-3 py-2.5 text-left text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200"
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
              Oversikt over alle støttesaker og deres status.
            </p>

          </div>


          {/* NOTIFICATIONS */}

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

              <div className="mb-4">

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
                  description="Alle saker"
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
                TICKETS
            ================================================== */}

            <section>


              <div className="mb-5">

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">

                  Alle saker

                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  Velg en sak for å se detaljer og administrere den.

                </p>

              </div>


              {/* ==================================================
                  FILTERS
              ================================================== */}

              <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row">


                {/* SEARCH */}

                <div className="relative min-w-0 flex-1">

                  <input
                    type="text"
                    value={search}
                    onChange={e =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Søk etter sak, bruker eller problem..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
                  />

                </div>


                {/* STATUS */}

                <select
                  value={statusFilter}
                  onChange={e =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >

                  <option value="all">
                    Alle statuser
                  </option>

                  <option value="not_started">
                    Nye
                  </option>

                  <option value="started">
                    Pågår
                  </option>

                  <option value="completed">
                    Ferdige
                  </option>

                  <option value="cancelled">
                    Avbrutte
                  </option>

                </select>


                {/* PRIORITY */}

                <select
                  value={priorityFilter}
                  onChange={e =>
                    setPriorityFilter(
                      e.target.value
                    )
                  }
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >

                  <option value="all">
                    Alle prioriteter
                  </option>

                  <option value="høy">
                    Høy
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="lav">
                    Lav
                  </option>

                </select>

              </div>


              {/* ==================================================
                  RESULT COUNT
              ================================================== */}

              <div className="mb-3 flex items-center justify-between px-1">

                <p className="text-xs text-slate-500 dark:text-slate-400">

                  Viser{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {filteredTickets.length}
                  </span>{" "}
                  av{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {tickets.length}
                  </span>{" "}
                  saker

                </p>

              </div>


              {/* ==================================================
                  TICKET LIST
              ================================================== */}

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">


                {filteredTickets.length === 0 ? (

                  <div className="p-10 text-center">

                    <p className="font-medium text-slate-700 dark:text-slate-200">

                      Ingen saker funnet

                    </p>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                      Prøv å endre søket eller filtrene.

                    </p>

                  </div>

                ) : (

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">

                    {filteredTickets.map(
                      ticket => (

                        <TicketRow
                          key={ticket.id}
                          ticket={ticket}
                          onOpen={() =>
                            router.push(
                              `/tickets/${ticket.id}`
                            )
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


// ====================================================
// TICKET ROW
// ====================================================

function TicketRow({
  ticket,
  onOpen,
}: {
  ticket: Ticket;
  onOpen: () => void;
}) {

  return (

    <button
      type="button"
      onClick={onOpen}
      className="group block w-full cursor-pointer p-5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
    >

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">


        {/* ==================================================
            TICKET ID
        ================================================== */}

        <div className="shrink-0 lg:w-20">

          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">

            Sak

          </p>

          <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">

            #{ticket.id}

          </p>

        </div>


        {/* ==================================================
            MAIN INFORMATION
        ================================================== */}

        <div className="min-w-0 flex-1">


          {/* BADGES */}

          <div className="mb-2 flex flex-wrap items-center gap-2">

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

          <p className="line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-200">

            {ticket.content}

          </p>


          {/* META */}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 dark:text-slate-500">


            <span>

              Opprettet{" "}

              {formatDate(
                ticket.created_at
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


            <span>

              {ticket.receiver
                ? `Ansvarlig: ${ticket.receiver.name}`
                : "Ikke tildelt"}

            </span>

          </div>

        </div>


        {/* ==================================================
            RIGHT SIDE
        ================================================== */}

        <div className="flex shrink-0 items-center justify-between gap-4 lg:w-36 lg:flex-col lg:items-end">


          {/* STATUS */}

          <StatusBadge
            status={ticket.status}
          />


          {/* OPEN */}

          <span className="text-sm font-semibold text-blue-600 transition group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">

            Åpne sak →

          </span>

        </div>

      </div>

    </button>

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


  if (
    priority === "medium"
  ) {

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
// STATUS BADGE
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