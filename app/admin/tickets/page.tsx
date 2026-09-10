"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../../components/ThemeToggle";
import NotificationBell from "../../components/NotificationBell";


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
// ADMIN TICKETS PAGE
// ====================================================

export default function AdminTicketsPage() {

  const router = useRouter();


  // ==================================================
  // STATE
  // ==================================================

  const [user, setUser] =
    useState<User | null>(null);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

const [employees, setEmployees] =
  useState<User[]>([]);

const [assigningTicketId, setAssigningTicketId] =
  useState<number | null>(null);

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

  // NEW
  const [assignmentFilter, setAssignmentFilter] =
    useState("all");


  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {

    // NEW
    // Read filters from the URL before loading the page.
    const params =
      new URLSearchParams(
        window.location.search
      );

    const priority =
      params.get("priority");

    const unassigned =
      params.get("unassigned");


    // NEW
    // /admin/tickets?priority=high
    if (priority === "high") {

      setPriorityFilter("høy");

    }


    // NEW
    // /admin/tickets?unassigned=true
    if (unassigned === "true") {

      setAssignmentFilter("unassigned");

    }


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

      // ----------------------------------------------
    // LOAD EMPLOYEES
    // ----------------------------------------------

    const employeeResponse =
    await fetch("/api/admin/users");

    const employeeResult =
    await employeeResponse.json();

    if (
    !employeeResult.success
    ) {
    setError(
        employeeResult.error ||
        "Kunne ikke hente ansatte."
    );

    return;
    }

    setEmployees(
    employeeResult.data || []
    );


    } catch (err) {

      console.error(err);

      setError(
        "Kunne ikke laste sakene."
      );

    } finally {

      setLoading(false);

    }

  }


  // ==================================================
// ASSIGN TICKET
// ==================================================

async function assignTicket(
  ticketId: number,
  receiverId: string | null
) {

  setAssigningTicketId(ticketId);

  try {

    const response =
      await fetch(
        "/api/admin/tasks",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id: ticketId,
            receiver_id: receiverId,
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
        "Kunne ikke tildele saken."
      );

      return;

    }


    // --------------------------------------------
    // UPDATE TICKET LOCALLY
    // --------------------------------------------

    const employee =
      receiverId
        ? employees.find(
            employee =>
              String(employee.id) ===
              String(receiverId)
          )
        : null;


    setTickets(currentTickets =>
      currentTickets.map(ticket => {

        if (
          ticket.id !== ticketId
        ) {
          return ticket;
        }


        return {
          ...ticket,

          receiver_id:
            receiverId,

          receiver:
            employee
              ? {
                  id: employee.id,
                  name: employee.name,
                  email: employee.email,
                }
              : null,
        };

      })
    );


  } catch (error) {

    console.error(error);

    alert(
      "En nettverksfeil oppstod."
    );

  } finally {

    setAssigningTicketId(null);

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


        // --------------------------------------------
        // SEARCH
        // --------------------------------------------

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


        // --------------------------------------------
        // STATUS
        // --------------------------------------------

        const matchesStatus =
          statusFilter === "all" ||
          ticket.status ===
            statusFilter;


        // --------------------------------------------
        // PRIORITY
        // --------------------------------------------

        const matchesPriority =
          priorityFilter === "all" ||
          ticket.priority ===
            priorityFilter;


        // --------------------------------------------
        // ASSIGNMENT
        // --------------------------------------------

        const matchesAssignment =
          assignmentFilter === "all" ||
          (
            assignmentFilter === "unassigned" &&
            !ticket.receiver_id
          ) ||
          (
            assignmentFilter === "assigned" &&
            !!ticket.receiver_id
          );


        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          matchesAssignment
        );

      });

    }, [
      tickets,
      search,
      statusFilter,
      priorityFilter,
      assignmentFilter,
    ]);


  // ==================================================
  // CLEAR FILTERS
  // ==================================================

  function clearFilters() {

    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssignmentFilter("all");

    // NEW
    // Remove URL filters as well.
    router.replace("/admin/tickets");

  }


  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

        <div className="text-sm text-slate-500 dark:text-slate-400">

          Laster saker...

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
              onClick={() =>
                router.push("/admin")
              }
              className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
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
              className="w-full cursor-pointer rounded-lg bg-blue-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
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

                  Alle saker

                </h1>

                <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">

                  Se, søk og administrer alle registrerte støttesaker.

                </p>

              </div>


              <NotificationBell />

            </div>

          </header>


          {/* ==================================================
              CONTENT
          ================================================== */}

          <div className="p-6 lg:p-8">


            {/* ==================================================
                FILTERS
            ================================================== */}

            <section>

              <div className="mb-5">

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">

                  Saker

                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  Velg en sak for å se detaljer og administrere den.

                </p>

              </div>


              {/* FILTER BAR */}

              <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">


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


                {/* SELECTS */}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">


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


                  {/* NEW: ASSIGNMENT */}

                  <select
                    value={assignmentFilter}
                    onChange={e =>
                      setAssignmentFilter(
                        e.target.value
                      )
                    }
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >

                    <option value="all">
                      Alle tildelinger
                    </option>

                    <option value="unassigned">
                      Ikke tildelte
                    </option>

                    <option value="assigned">
                      Tildelte
                    </option>

                  </select>

                </div>


                {/* CLEAR FILTERS */}

                {(search ||
                  statusFilter !== "all" ||
                  priorityFilter !== "all" ||
                  assignmentFilter !== "all") && (

                  <div className="flex justify-end">

                    <button
                      type="button"
                      onClick={clearFilters}
                      className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >

                      Nullstill filtre

                    </button>

                  </div>

                )}

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

                <div>

                    {filteredTickets.length === 0 ? (

                        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">

                        <p className="font-medium text-slate-700 dark:text-slate-200">
                            Ingen saker funnet
                        </p>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Prøv å endre søket eller filtrene.
                        </p>

                        </div>

                    ) : (

                        <div className="space-y-3">

                        {filteredTickets.map(ticket => (

                            <div
                            key={ticket.id}
                            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                            >

                            <TicketRow
                                ticket={ticket}
                                employees={employees}
                                assigning={
                                    assigningTicketId === ticket.id
                                }
                                onAssign={assignTicket}
                                onOpen={() =>
                                    router.push(
                                    `/tickets/${ticket.id}`
                                    )
                                }
                            />

                            </div>

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


// ====================================================
// TICKET ROW
// ====================================================

function TicketRow({
  ticket,
  employees,
  assigning,
  onAssign,
  onOpen,
}: {
  ticket: Ticket;
  employees: User[];
  assigning: boolean;
  onAssign: (
    ticketId: number,
    receiverId: string | null
  ) => void;
  onOpen: () => void;
}) {

  const isUnassigned =
    !ticket.receiver_id;


  return (

    <div
        className="group block w-full text-left"
    >

      <div className="p-5 sm:p-6">


        {/* ==================================================
            TOP ROW
        ================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3">


          {/* LEFT: ID + CATEGORY */}

          <div className="flex min-w-0 items-center gap-3">

            {/* TICKET ID */}

            <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">

              #{ticket.id}

            </span>


            {/* CATEGORY */}

            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">

              {ticket.category}

            </span>


            {/* SUBCATEGORY */}

            {ticket.subcategory && (

              <span className="hidden rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600 sm:inline-block dark:bg-slate-800 dark:text-slate-300">

                {ticket.subcategory}

              </span>

            )}

          </div>


          {/* PRIORITY */}

          <PriorityBadge
            priority={ticket.priority}
          />

        </div>


        {/* ==================================================
            TITLE / DESCRIPTION
        ================================================== */}

        <div className="mt-4">

          <p className="line-clamp-2 text-base font-semibold leading-6 text-slate-900 dark:text-white sm:text-lg">

            {ticket.content}

          </p>

        </div>


        {/* ==================================================
            ASSIGNMENT + STATUS
        ================================================== */}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">


          {/* ASSIGNMENT */}

          <div
            className={`relative flex items-center gap-3 rounded-lg border px-3.5 py-3 transition ${
                isUnassigned
                ? "border-amber-200 bg-amber-50 hover:border-amber-300 dark:border-amber-900/60 dark:bg-amber-950/20 dark:hover:border-amber-800"
                : "border-slate-200 bg-slate-50 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-blue-800"
            }`}
            >

            {/* AVATAR / ICON */}

            <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                isUnassigned
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                }`}
            >

                {isUnassigned
                ? "?"
                : ticket.receiver?.name
                    ?.charAt(0)
                    .toUpperCase()}

            </div>


            {/* ASSIGNMENT TEXT */}

            <div className="min-w-0 flex-1">

                <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                    isUnassigned
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
                >

                {isUnassigned
                    ? "Ikke tildelt"
                    : "Ansvarlig"}

                </p>


                <p
                className={`truncate text-sm font-semibold ${
                    isUnassigned
                    ? "text-amber-900 dark:text-amber-300"
                    : "text-slate-800 dark:text-slate-200"
                }`}
                >

                {assigning
                    ? "Oppdaterer..."
                    : isUnassigned
                    ? "Mangler ansvarlig"
                    : ticket.receiver?.name}

                </p>

            </div>


            {/* EMPLOYEE SELECT */}

            <select
                value={
                ticket.receiver_id ?? ""
                }
                disabled={assigning}
                onChange={event => {

                const value =
                    event.target.value;

                onAssign(
                    ticket.id,
                    value || null
                );

                }}
                onClick={event =>
                event.stopPropagation()
                }
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-wait"
                aria-label={`Tildel sak #${ticket.id}`}
            >

                <option value="">
                Ikke tildelt
                </option>

                {employees.map(employee => (

                <option
                    key={employee.id}
                    value={employee.id}
                >
                    {employee.name}
                </option>

                ))}

            </select>


            {/* DROPDOWN INDICATOR */}

            <span className="pointer-events-none shrink-0 text-slate-400 dark:text-slate-500">
                ▾
            </span>

            </div>

            {/* AVATAR / ICON */}

            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                isUnassigned
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
              }`}
            >

              {isUnassigned
                ? "?"
                : ticket.receiver?.name
                    ?.charAt(0)
                    .toUpperCase()}

            </div>


            {/* ASSIGNMENT TEXT */}

            <div className="min-w-0">

              <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                  isUnassigned
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >

                {isUnassigned
                  ? "Ikke tildelt"
                  : "Ansvarlig"}

              </p>


              <p
                className={`truncate text-sm font-semibold ${
                  isUnassigned
                    ? "text-amber-900 dark:text-amber-300"
                    : "text-slate-800 dark:text-slate-200"
                }`}
              >

                {isUnassigned
                  ? "Mangler ansvarlig"
                  : ticket.receiver?.name}

              </p>

            </div>

          </div>


          {/* STATUS */}

          <div className="flex items-center gap-2">

            <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">

              Status

            </span>

            <StatusBadge
              status={ticket.status}
            />

          </div>

        </div>


        {/* ==================================================
            METADATA
        ================================================== */}

        <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex flex-wrap gap-x-4 gap-y-1">

            <span>

              Opprettet{" "}

              <span className="font-medium text-slate-600 dark:text-slate-300">

                {formatDate(
                  ticket.created_at
                )}

              </span>

            </span>


            {ticket.sender && (

              <span>

                Fra{" "}

                <span className="font-medium text-slate-600 dark:text-slate-300">

                  {ticket.sender.name}

                </span>

              </span>

            )}

          </div>


          {/* OPEN */}

        <button
            type="button"
            onClick={onOpen}
            className="shrink-0 cursor-pointer font-semibold text-blue-600 transition hover:translate-x-0.5 dark:text-blue-400"
          >
            Åpne sak →
        </button>

        </div>

      </div>

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