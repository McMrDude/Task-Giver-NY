"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  title: string,
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

  const [user, setUser] = useState<User | null>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [employees, setEmployees] = useState<User[]>([]);

  const [assigningTicketId, setAssigningTicketId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [priorityFilter, setPriorityFilter] = useState("all");

  const [assignmentFilter, setAssignmentFilter] =
    useState("all");

  // ==================================================
  // MOBILE UI STATE
  // ==================================================

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const priority = params.get("priority");

    const unassigned = params.get("unassigned");

    // /admin/tickets?priority=high
    if (priority === "high") {
      setPriorityFilter("høy");
    }

    // /admin/tickets?unassigned=true
    if (unassigned === "true") {
      setAssignmentFilter("unassigned");
    }

    loadAdmin();
  }, []);

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
  // MOBILE NAVIGATION
  // ==================================================

  function navigateMobile(path: string) {
    setMobileMenuOpen(false);
    router.push(path);
  }

  // ==================================================
  // LOAD ADMIN DATA
  // ==================================================

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
      // LOAD ALL TICKETS
      // ----------------------------------------------

      const ticketResponse =
        await fetch("/api/admin/tasks");

      const ticketResult =
        await ticketResponse.json();

      if (!ticketResult.success) {
        setError(
          ticketResult.error ||
            "Kunne ikke hente saker."
        );

        return;
      }

      setTickets(ticketResult.data || []);

      // ----------------------------------------------
      // LOAD EMPLOYEES
      // ----------------------------------------------

      const employeeResponse =
        await fetch("/api/admin/users");

      const employeeResult =
        await employeeResponse.json();

      if (!employeeResult.success) {
        setError(
          employeeResult.error ||
            "Kunne ikke hente ansatte."
        );

        return;
      }

      setEmployees(employeeResult.data || []);
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
      const response = await fetch(
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

      const employee = receiverId
        ? employees.find(
            employee =>
              String(employee.id) ===
              String(receiverId)
          )
        : null;

      setTickets(currentTickets =>
        currentTickets.map(ticket => {
          if (ticket.id !== ticketId) {
            return ticket;
          }

          return {
            ...ticket,

            receiver_id:
              receiverId,

            receiver: employee
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
    try {
      setLoggingOut(true);

      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );

      router.push("/login");
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

      setLoggingOut(false);
    }
  }

  // ==================================================
  // FILTER TICKETS
  // ==================================================

  const filteredTickets = useMemo(() => {
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
        (assignmentFilter ===
          "unassigned" &&
          !ticket.receiver_id) ||
        (assignmentFilter ===
          "assigned" &&
          !!ticket.receiver_id);

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

    router.replace(
      "/admin/tickets"
    );
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
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
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 px-5 py-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 sm:px-6">
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
                Administrasjon
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

            <div className="flex h-10 w-10 items-center justify-center">
              <NotificationBell />
            </div>

            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              aria-label="Logg ut"
              title="Logg ut"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 17l5-5-5-5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3" />
              </svg>
              <span className="hidden sm:inline">{loggingOut ? "Logger ut..." : "Logg ut"}</span>
            </button>

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
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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

                {/* DASHBOARD */}

                <button
                  type="button"
                  onClick={() =>
                    navigateMobile(
                      "/admin"
                    )
                  }
                  className="flex min-h-11 w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
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
                  className="flex min-h-11 w-full cursor-pointer items-center rounded-xl bg-blue-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
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
          DESKTOP + MAIN CONTENT
      ================================================== */}

      <div className="flex min-h-screen w-full">

        {/* ==================================================
            SIDEBAR
        ================================================== */}

        <aside className="fixed left-0 top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:flex">

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
                router.push(
                  "/admin/tickets"
                )
              }
              className="w-full cursor-pointer rounded-lg bg-blue-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
            >
              Alle saker
            </button>

            {/* EMPLOYEES */}

            <button
              onClick={() =>
                router.push(
                  "/admin/employees"
                )
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

        <section className="min-w-0 w-full flex-1 pt-16 lg:ml-64 lg:pt-0">

          {/* ==================================================
              HEADER
          ================================================== */}

          <header className="border-b border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900 sm:px-5 sm:py-6 lg:px-8 lg:py-6">

            <div className="flex min-w-0 items-start justify-between gap-4">

              <div className="min-w-0">

                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Administrasjon
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Alle saker
                </h1>

                <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                  Se, søk og administrer alle registrerte støttesaker.
                </p>

              </div>

              <div className="hidden lg:block">
                <NotificationBell />
              </div>

            </div>

          </header>

          {/* ==================================================
              CONTENT
          ================================================== */}

          <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-5 sm:py-6 lg:space-y-8 lg:p-8">

            {/* ==================================================
                FILTERS
            ================================================== */}

            <section>

              <div className="mb-4 sm:mb-5">

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Saker
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Velg en sak for å se detaljer og administrere den.
                </p>

              </div>

              {/* FILTER BAR */}

              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">

                {/* SEARCH */}

                <div className="relative min-w-0 w-full">

                  <input
                    type="text"
                    value={search}
                    onChange={e =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Søk etter sak, bruker eller problem..."
                    className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
                  />

                </div>

                {/* SELECTS */}

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">

                  {/* STATUS */}

                  <select
                    value={statusFilter}
                    onChange={e =>
                      setStatusFilter(
                        e.target.value
                      )
                    }
                    className="min-h-11 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                    className="min-h-11 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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

                  {/* ASSIGNMENT */}

                  <select
                    value={assignmentFilter}
                    onChange={e =>
                      setAssignmentFilter(
                        e.target.value
                      )
                    }
                    className="min-h-11 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                  statusFilter !==
                    "all" ||
                  priorityFilter !==
                    "all" ||
                  assignmentFilter !==
                    "all") && (

                  <div className="mt-3 flex justify-start sm:justify-end">

                    <button
                      type="button"
                      onClick={
                        clearFilters
                      }
                      className="min-h-10 cursor-pointer px-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
                TICKET TABLE
            ================================================== */}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                {filteredTickets.length === 0 ? (
                    <div className="p-8 text-center sm:p-12">
                        <p className="font-medium text-slate-700 dark:text-slate-200">
                            Ingen saker funnet
                        </p>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Prøv å endre søket eller filtrene.
                        </p>
                    </div>
            ) : (
                <>
                {/* ==================================================
                    DESKTOP TABLE HEADER
                ================================================== */}

                <div className="hidden border-b border-slate-200 bg-slate-50/80 px-4 py-3 xl:block dark:border-slate-800 dark:bg-slate-950/40">

                    <div className="grid grid-cols-[8px_58px_105px_minmax(150px,1fr)_minmax(200px,1.5fr)_95px_85px_200px_100px] items-stretch text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">

                    {/* COLOR */}
                    <div />

                    {/* ID */}
                    <div className="flex items-center px-3">
                        ID
                    </div>

                    {/* DATE */}
                    <div className="flex items-center border-l border-slate-200 px-3 dark:border-slate-800"
                    >
                        Opprettet
                    </div>

                    {/* CATEGORY */}
                    <div className="flex items-center border-l border-slate-200 px-3 dark:border-slate-800"
                    >
                        Kategori
                    </div>

                    {/* DESCRIPTION */}
                    <div className="flex items-center border-l border-slate-200 px-3 dark:border-slate-800"
                    >
                        Tittel
                    </div>

                    {/* STATUS */}
                    <div className="flex items-center border-l border-slate-200 px-3 dark:border-slate-800"
                    >
                        Status
                    </div>

                    {/* PRIORITY */}
                    <div className="flex items-center border-l border-slate-200 px-3 dark:border-slate-800"
                    >
                        Prioritet
                    </div>

                    {/* ASSIGNMENT */}
                    <div className="flex items-center border-l border-slate-200 px-3 dark:border-slate-800"
                    >
                        Tildelt
                    </div>

                    {/* ACTION */}
                    <div className="flex items-center border-l border-slate-200 px-3 dark:border-slate-800"
                    >
                        Handling
                    </div>

                    </div>

                </div>

                {/* ==================================================
                    TICKETS
                ================================================== */}

                <div className="divide-y divide-slate-100 dark:divide-slate-800">

                    {filteredTickets.map(ticket => (
                    <div
                        key={ticket.id}
                        className="relative min-w-0 overflow-visible bg-white transition-colors hover:bg-slate-50/70 dark:bg-slate-900 dark:hover:bg-slate-800/40"
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

                {/* ==================================================
                    FOOTER
                ================================================== */}

                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">

                    <span>
                    Viser{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {filteredTickets.length}
                    </span>{" "}
                    av{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {tickets.length}
                    </span>{" "}
                    saker
                    </span>

                    <span className="text-slate-400 dark:text-slate-500">
                    Velg en sak for å se detaljer
                    </span>

                </div>

                </>
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
  const isUnassigned = !ticket.receiver_id;

  const [assignmentOpen, setAssignmentOpen] =
    useState(false);

  const [assignmentMenuPosition, setAssignmentMenuPosition] =
    useState<{
      top: number;
      left: number;
      width: number;
    } | null>(null);

  const desktopAssignmentRef =
    useRef<HTMLDivElement>(null);

  const mobileAssignmentRef =
    useRef<HTMLDivElement>(null);
  // ==================================================
  // PRIORITY ACCENT
  // ==================================================

  const priorityAccent =
    ticket.priority === "høy" ||
    ticket.priority === "high"
      ? "bg-red-500"
      : ticket.priority === "medium"
      ? "bg-amber-400"
      : "bg-green-400";

  // ==================================================
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // ==================================================

    useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        const target = event.target as Node;

        const clickedDesktop =
        desktopAssignmentRef.current?.contains(target);

        const clickedMobile =
        mobileAssignmentRef.current?.contains(target);

        if (!clickedDesktop && !clickedMobile) {
        setAssignmentOpen(false);
        }
    }

    document.addEventListener(
        "mousedown",
        handleClickOutside
    );

    return () => {
        document.removeEventListener(
        "mousedown",
        handleClickOutside
        );
    };
    }, []);


  // ==================================================
  // CLOSE DROPDOWN WHEN SCROLLING
  // ==================================================

  useEffect(() => {
    function handleScroll() {
        setAssignmentOpen(false);
    }

    window.addEventListener("scroll", handleScroll);

    return () => {
        window.removeEventListener("scroll", handleScroll);
    };
  }, []);


  function updateAssignmentMenuPosition(
    ref: React.RefObject<HTMLDivElement | null>
  ) {
    if (!ref.current) {
      return;
    }

    const button =
      ref.current.querySelector(
        "button"
      );

    if (!button) {
      return;
    }

    const rect =
      button.getBoundingClientRect();

    const gap = 8;

    const isMobile =
      window.innerWidth < 640;

    const viewportPadding =
      isMobile ? 12 : 8;

    const menuWidth = isMobile
      ? Math.min(
          window.innerWidth -
            viewportPadding * 2,
          360
        )
      : Math.max(rect.width, 230);

    const menuHeight = 300;

    const spaceBelow =
      window.innerHeight -
      rect.bottom;

    const spaceAbove =
      rect.top;

    let top;

    if (
      spaceBelow >= menuHeight ||
      spaceBelow >= spaceAbove
    ) {
      top =
        rect.bottom + gap;
    } else {
      top =
        rect.top -
        menuHeight -
        gap;
    }

    top = Math.max(
      viewportPadding,
      Math.min(
        top,
        window.innerHeight -
          viewportPadding -
          menuHeight
      )
    );

    let left;

    if (isMobile) {
      left =
        (window.innerWidth -
          menuWidth) /
        2;
    } else {
      left = rect.left;

      if (
        left + menuWidth >
        window.innerWidth -
          viewportPadding
      ) {
        left =
          window.innerWidth -
          viewportPadding -
          menuWidth;
      }

      left = Math.max(
        viewportPadding,
        left
      );
    }

    setAssignmentMenuPosition({
      top,
      left,
      width: menuWidth,
    });
  }

  // ==================================================
  // HANDLE ASSIGNMENT
  // ==================================================

  function handleAssign(
    receiverId: string | null
  ) {
    setAssignmentOpen(false);

    onAssign(
      ticket.id,
      receiverId
    );
  }

  // ==================================================
  // DESKTOP ROW
  // ==================================================

  return (
    <div className="relative">

      {/* ==================================================
          DESKTOP
      ================================================== */}

      <div className="hidden xl:grid xl:grid-cols-[8px_58px_105px_minmax(150px,1fr)_minmax(200px,1.5fr)_95px_85px_200px_100px] xl:items-stretch xl:px-4 xl:py-0">

        {/* ==================================================
            PRIORITY COLOR STRIPE
        ================================================== */}

        <div
            className={`my-3.5 h-10 w-1.5 self-center rounded-full ${priorityAccent}`}
            title={`Prioritet: ${ticket.priority}`}

        />

        {/* ==================================================
            ID
        ================================================== */}

        <div className="flex items-center px-3">
          <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
            #{ticket.id}
          </span>
        </div>

        {/* ==================================================
            CREATED
        ================================================== */}

        <div className="flex min-w-0 flex-col justify-center border-l border-slate-100 px-3 py-3.5 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
            {formatDate(ticket.created_at)}
          </p>

          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
            {formatTime(ticket.created_at)}
          </p>
        </div>

        {/* ==================================================
            CATEGORY
        ================================================== */}

        <div className="flex min-w-0 flex-col justify-center border-l border-slate-100 px-3 py-3.5 dark:border-slate-800">

          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {ticket.category}
          </p>

          {ticket.subcategory && (
            <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
              {ticket.subcategory}
            </p>
          )}

        </div>

        {/* ==================================================
            DESCRIPTION
        ================================================== */}

        <div className="flex min-w-0 flex-col justify-center border-l border-slate-100 px-3 py-3.5 dark:border-slate-800">

          <p className="line-clamp-2 text-sm leading-5 text-slate-700 dark:text-slate-200">
            {ticket.title}
          </p>

          {ticket.sender && (
            <p className="mt-1 truncate text-[11px] text-slate-400 dark:text-slate-500">
              Fra {ticket.sender.name}
            </p>
          )}

        </div>

        {/* ==================================================
            STATUS
        ================================================== */}

        <div className="flex items-center border-l border-slate-100 px-3 py-3.5 dark:border-slate-800">
          <StatusBadge
            status={ticket.status}
          />
        </div>

        {/* ==================================================
            PRIORITY
        ================================================== */}

        <div className="flex items-center border-l border-slate-100 px-3 py-3.5 dark:border-slate-800">
          <PriorityBadge
            priority={ticket.priority}
          />
        </div>

        {/* ==================================================
            ASSIGNMENT
        ================================================== */}

        <div
          ref={desktopAssignmentRef}
          className="relative flex min-w-0 items-center border-l border-slate-100 px-3 py-3.5 dark:border-slate-800"
        >

          <button
            type="button"
            disabled={assigning}
            onClick={() => {
              if (assignmentOpen) {
                setAssignmentOpen(false);
                return;
              }

              updateAssignmentMenuPosition(
                desktopAssignmentRef
              );

              setAssignmentOpen(true);
            }}
            className={`flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${
              isUnassigned
                ? "border-amber-200 bg-amber-50 hover:border-amber-300 dark:border-amber-900/60 dark:bg-amber-950/20 dark:hover:border-amber-800"
                : "border-slate-200 bg-slate-50 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-blue-800"
            } ${
              assigning
                ? "cursor-wait opacity-70"
                : ""
            }`}
          >

            {/* AVATAR */}

            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                isUnassigned
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
              }`}
            >
              {isUnassigned
                ? "+"
                : ticket.receiver?.name
                    ?.charAt(0)
                    .toUpperCase()}
            </div>

            {/* NAME */}

            <span
              className={`min-w-0 flex-1 truncate text-xs font-medium ${
                isUnassigned
                  ? "text-amber-800 dark:text-amber-300"
                  : "text-slate-700 dark:text-slate-200"
              }`}
            >
              {assigning
                ? "Oppdaterer..."
                : isUnassigned
                ? "Ikke tildelt"
                : ticket.receiver?.name}
            </span>

            {/* CHEVRON */}

            <span
              className={`shrink-0 text-[10px] text-slate-400 transition-transform dark:text-slate-500 ${
                assignmentOpen
                  ? "rotate-180"
                  : ""
              }`}
            >
              ▼
            </span>

          </button>

          {/* ==================================================
              ASSIGNMENT DROPDOWN
          ================================================== */}

          {assignmentOpen &&
            assignmentMenuPosition && (
              <div
                style={{
                  position: "fixed",
                  top:
                    assignmentMenuPosition.top,
                  left:
                    assignmentMenuPosition.left,
                  width:
                    assignmentMenuPosition.width,
                }}
                className="z-[100] max-h-[min(300px,60dvh)] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              >

                <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Tildel ansvarlig
                  </p>
                </div>

                {/* UNASSIGNED */}

                <button
                  type="button"
                  disabled={assigning}
                  onClick={() =>
                    handleAssign(null)
                  }
                  className={`flex min-h-12 w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    isUnassigned
                      ? "bg-amber-50 dark:bg-amber-950/30"
                      : ""
                  }`}
                >

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                    +
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Ikke tildelt
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ingen ansvarlig valgt
                    </p>
                  </div>

                  {isUnassigned && (
                    <span className="text-xs font-bold text-amber-600">
                      ✓
                    </span>
                  )}

                </button>

                {/* EMPLOYEES */}

                {employees.map(employee => {
                  const isSelected =
                    String(employee.id) ===
                    String(ticket.receiver_id);

                  return (
                    <button
                      key={employee.id}
                      type="button"
                      disabled={assigning}
                      onClick={() =>
                        handleAssign(
                          employee.id
                        )
                      }
                      className={`flex min-h-12 w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/30"
                          : ""
                      }`}
                    >

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                        {employee.name
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {employee.name}
                        </p>

                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {employee.email}
                        </p>
                      </div>

                      {isSelected && (
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          ✓
                        </span>
                      )}

                    </button>
                  );
                })}

              </div>
            )}

        </div>

        {/* ==================================================
            ACTION
        ================================================== */}

        <div className="flex items-center border-l border-slate-100 px-3 py-3.5 dark:border-slate-800">
          <button
            type="button"
            onClick={onOpen}
            className="w-full min-w-[100px] cursor-pointer whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-800 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
          >
            Åpne sak →
          </button>
        </div>

      </div>


      {/* ==================================================
          MOBILE / TABLET
      ================================================== */}

      <div className="xl:hidden">

        <div className="relative p-4 sm:p-5">

          {/* PRIORITY STRIPE */}

          <div
            className={`absolute inset-y-4 left-0 w-1 rounded-r-full sm:inset-y-5 ${priorityAccent}`}
          />

          {/* ==================================================
              TOP
          ================================================== */}

          <div className="flex min-w-0 items-start justify-between gap-3 pl-3">

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                  #{ticket.id}
                </span>

                <span className="truncate rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {ticket.category}
                </span>

              </div>

              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                Opprettet {formatDate(ticket.created_at)}
              </p>

            </div>

            <PriorityBadge
              priority={ticket.priority}
            />

          </div>

          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          <div className="mt-4 pl-3">

            <p className="line-clamp-3 text-sm font-semibold leading-5 text-slate-800 dark:text-slate-100">
              {ticket.content}
            </p>

            {ticket.subcategory && (
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {ticket.subcategory}
              </p>
            )}

          </div>

          {/* ==================================================
              STATUS + ASSIGNMENT
          ================================================== */}

          <div className="mt-4 flex flex-col gap-3 pl-3 sm:flex-row sm:items-center">

            <div className="shrink-0">
              <StatusBadge
                status={ticket.status}
              />
            </div>

            <div
              ref={mobileAssignmentRef}
              className="relative min-w-0 flex-1"
            >

              <button
                type="button"
                disabled={assigning}
                onClick={() => {
                  if (assignmentOpen) {
                    setAssignmentOpen(false);
                    return;
                  }

                  updateAssignmentMenuPosition(
                    mobileAssignmentRef
                  );

                  setAssignmentOpen(true);
                }}
                className={`flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left transition ${
                  isUnassigned
                    ? "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20"
                    : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
                }`}
              >

                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isUnassigned
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                  }`}
                >
                  {isUnassigned
                    ? "+"
                    : ticket.receiver?.name
                        ?.charAt(0)
                        .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Tildelt
                  </p>

                  <p
                    className={`truncate text-xs font-semibold ${
                      isUnassigned
                        ? "text-amber-800 dark:text-amber-300"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {assigning
                      ? "Oppdaterer..."
                      : isUnassigned
                      ? "Ikke tildelt"
                      : ticket.receiver?.name}
                  </p>

                </div>

                <span
                  className={`text-[10px] text-slate-400 transition-transform ${
                    assignmentOpen
                      ? "rotate-180"
                      : ""
                  }`}
                >
                  ▼
                </span>

              </button>

              {/* MOBILE DROPDOWN */}

              {assignmentOpen &&
                assignmentMenuPosition && (
                  <div
                    style={{
                      position: "fixed",
                      top:
                        assignmentMenuPosition.top,
                      left:
                        assignmentMenuPosition.left,
                      width:
                        assignmentMenuPosition.width,
                    }}
                    className="z-[100] max-h-[min(300px,60dvh)] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                  >

                    <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Tildel ansvarlig
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={assigning}
                      onClick={() =>
                        handleAssign(null)
                      }
                      className={`flex min-h-12 w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        isUnassigned
                          ? "bg-amber-50 dark:bg-amber-950/30"
                          : ""
                      }`}
                    >

                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                        +
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          Ikke tildelt
                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Ingen ansvarlig valgt
                        </p>
                      </div>

                      {isUnassigned && (
                        <span className="font-bold text-amber-600">
                          ✓
                        </span>
                      )}

                    </button>

                    {employees.map(employee => {
                      const isSelected =
                        String(employee.id) ===
                        String(ticket.receiver_id);

                      return (
                        <button
                          key={employee.id}
                          type="button"
                          disabled={assigning}
                          onClick={() =>
                            handleAssign(
                              employee.id
                            )
                          }
                          className={`flex min-h-12 w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-950/30"
                              : ""
                          }`}
                        >

                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                            {employee.name
                              ?.charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                              {employee.name}
                            </p>

                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {employee.email}
                            </p>
                          </div>

                          {isSelected && (
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              ✓
                            </span>
                          )}

                        </button>
                      );
                    })}

                  </div>
                )}

            </div>

          </div>

          {/* ==================================================
              BOTTOM
          ================================================== */}

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 pl-3 dark:border-slate-800">

            <div className="min-w-0">

              {ticket.sender && (
                <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                  Fra{" "}
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {ticket.sender.name}
                  </span>
                </p>
              )}

            </div>

            <button
              type="button"
              onClick={onOpen}
              className="shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400 dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
            >
              Åpne sak →
            </button>

          </div>

        </div>

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
      <span className="inline-flex shrink-0 items-center rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-700 dark:bg-red-950/50 dark:text-red-400">
        Høy
      </span>
    );
  }

  if (priority === "medium") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
        Medium
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold text-green-700 dark:bg-green-950/50 dark:text-green-400">
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
      <span className="inline-flex shrink-0 items-center rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
        Pågår
      </span>
    );
  }

  if (
    status === "completed" ||
    status === "finished"
  ) {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold text-green-700 dark:bg-green-950/50 dark:text-green-400">
        Ferdig
      </span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-700 dark:bg-red-950/50 dark:text-red-400">
        Avbrutt
      </span>
    );
  }

  if (
    status === "not_started"
  ) {
    return (
        <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
            Ikke startet
        </span>
    )
  }


  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      Ny
    </span>
  );
}

// ====================================================
// DATE
// ====================================================

function formatDate(value: string) {
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

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(
    "nb-NO",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}