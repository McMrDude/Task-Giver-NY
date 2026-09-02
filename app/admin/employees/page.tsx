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
  phone_number: string | null;
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
// EMPLOYEE WITH TASK INFORMATION
// ====================================================

type EmployeeData = {
  employee: User;
  currentTasks: Ticket[];
  completedTasks: Ticket[];
};


// ====================================================
// PAGE
// ====================================================

export default function EmployeesPage() {

  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [employees, setEmployees] =
    useState<User[]>([]);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [expandedEmployee, setExpandedEmployee] =
    useState<string | null>(null);


  // ==================================================
  // LOAD
  // ==================================================

  useEffect(() => {

    loadEmployees();

  }, []);


  async function loadEmployees() {

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


      // ----------------------------------------------
      // LOAD TASKS
      // ----------------------------------------------

      const taskResponse =
        await fetch("/api/admin/tasks");


      const taskResult =
        await taskResponse.json();


      if (
        !taskResult.success
      ) {

        setError(
          taskResult.error ||
          "Kunne ikke hente saker."
        );

        return;

      }


      setEmployees(
        employeeResult.data || []
      );

      setTickets(
        taskResult.data || []
      );


    } catch (err) {

      console.error(err);

      setError(
        "Kunne ikke laste ansattoversikten."
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
  // EMPLOYEE DATA
  // ==================================================

  const employeeData =
    useMemo<EmployeeData[]>(() => {

      return employees.map(employee => {

        const employeeTasks =
          tickets.filter(
            ticket =>
              ticket.receiver_id ===
              employee.id
          );


        const currentTasks =
          employeeTasks.filter(
            ticket =>
              ticket.status !== "completed" &&
              ticket.status !== "cancelled"
          );


        const completedTasks =
          employeeTasks.filter(
            ticket =>
              ticket.status === "completed"
          );


        return {
          employee,
          currentTasks,
          completedTasks,
        };

      });

    }, [
      employees,
      tickets,
    ]);


  // ==================================================
  // SEARCH
  // ==================================================

  const filteredEmployees =
    useMemo(() => {

      const searchText =
        search
          .trim()
          .toLowerCase();


      if (!searchText) {

        return employeeData;

      }


      return employeeData.filter(
        data =>

            data.employee.name
            .toLowerCase()
            .includes(searchText) ||

            data.employee.email
            .toLowerCase()
            .includes(searchText) ||

            data.employee.phone_number
            ?.toLowerCase()
            .includes(searchText)
       );

    }, [
      employeeData,
      search,
    ]);


  // ==================================================
  // STATISTICS
  // ==================================================

  const totalEmployees =
    employees.length;


  const totalCurrentTasks =
    employeeData.reduce(
      (sum, employee) =>
        sum +
        employee.currentTasks.length,
      0
    );


  const totalCompletedTasks =
    employeeData.reduce(
      (sum, employee) =>
        sum +
        employee.completedTasks.length,
      0
    );


  const employeesWithTasks =
    employeeData.filter(
      employee =>
        employee.currentTasks.length > 0
    ).length;


  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

        <div className="text-sm text-slate-500 dark:text-slate-400">

          Laster ansatte...

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
              onClick={() =>
                router.push("/admin")
              }
              className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >

              Alle saker

            </button>


            {/* EMPLOYEES */}

            <button
              className="w-full cursor-pointer rounded-lg bg-blue-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
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


          {/* HEADER */}

          <header className="border-b border-slate-200 bg-white px-6 py-6 dark:border-slate-800 dark:bg-slate-900 lg:px-8">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">

                  Administrasjon

                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">

                  Ansatte

                </h1>

                <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">

                  Oversikt over ansatte og deres aktive saker.

                </p>

              </div>


              <NotificationBell />

            </div>

          </header>


          {/* CONTENT */}

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

                  Status for arbeidsmengden blant ansatte.

                </p>

              </div>


              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <StatCard
                  title="Ansatte"
                  value={totalEmployees}
                  description="Totalt antall ansatte"
                />

                <StatCard
                  title="Aktive saker"
                  value={totalCurrentTasks}
                  description="Totalt tildelt ansatte"
                />

                <StatCard
                  title="Ansatte med saker"
                  value={employeesWithTasks}
                  description="Har minst én aktiv sak"
                />

                <StatCard
                  title="Ferdigbehandlet"
                  value={totalCompletedTasks}
                  description="Totalt fullførte saker"
                />

              </div>

            </section>


            {/* ==================================================
                EMPLOYEES
            ================================================== */}

            <section>

              <div className="mb-5">

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">

                  Ansatte

                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  Se arbeidsmengde, aktive saker og historikk per ansatt.

                </p>

              </div>


              {/* SEARCH */}

              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                <input
                  type="text"
                  value={search}
                  onChange={e =>
                    setSearch(e.target.value)
                  }
                  placeholder="Søk etter ansatt, e-post eller telefon..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
                />

              </div>


              {/* EMPLOYEE LIST */}

              <div className="space-y-3">

                {filteredEmployees.length === 0 ? (

                  <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">

                    <p className="font-medium text-slate-700 dark:text-slate-200">

                      Ingen ansatte funnet

                    </p>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                      Prøv å endre søket.

                    </p>

                  </div>

                ) : (

                  filteredEmployees.map(
                    data => (

                      <EmployeeCard
                        key={data.employee.id}
                        data={data}
                        expanded={
                          expandedEmployee ===
                          data.employee.id
                        }
                        onToggle={() => {

                          setExpandedEmployee(
                            current =>
                              current ===
                              data.employee.id
                                ? null
                                : data.employee.id
                          );

                        }}
                        onOpenTask={id =>
                          router.push(
                            `/tickets/${id}`
                          )
                        }
                      />

                    )
                  )

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
// WORKLOAD BAR
// ====================================================

function WorkloadBar({ taskCount }: { taskCount: number }) {

  const maxTasks = 8;

  const percentage =
    Math.min(
      (taskCount / maxTasks) * 100,
      100
    );

  return (

    <div className="w-56 shrink-0">

      <div className="mb-2 flex items-center justify-between">

        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">

          Arbeidsmengde

        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400">

          {taskCount}{" "}
          {taskCount === 1
            ? "sak"
            : "saker"}

        </p>

      </div>


      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">

        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>

  );

}

// ====================================================
// EMPLOYEE CARD
// ====================================================

function EmployeeCard({
  data,
  expanded,
  onToggle,
  onOpenTask,
}: {
  data: EmployeeData;
  expanded: boolean;
  onToggle: () => void;
  onOpenTask: (id: number) => void;
}) {

  const {
    employee,
    currentTasks,
    completedTasks,
  } = data;


  const highPriorityTasks =
    currentTasks.filter(
      task =>
        task.priority === "høy" ||
        task.priority === "high"
    ).length;


  return (

    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">


      {/* ==================================================
          EMPLOYEE HEADER
      ================================================== */}

      <button
        type="button"
        onClick={onToggle}
        className="group w-full cursor-pointer p-5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
      >

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">


          {/* AVATAR */}

          <div className="flex shrink-0 items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">

              {employee.name
                .charAt(0)
                .toUpperCase()}

            </div>


            <div className="min-w-0">

                <p className="font-semibold text-slate-900 dark:text-white">

                    {employee.name}

                </p>

                <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">

                    {employee.email}

                </p>

                {employee.phone_number && (

                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">

                    {employee.phone_number}

                    </p>

                )}

            </div>

          </div>


          {/* SPACER */}

          <div className="hidden flex-1 lg:block" />

{/* ==================================================
    WORKLOAD / TASK SUMMARY
================================================== */}

<div className="flex shrink-0 items-center gap-5">

  {/* WORKLOAD */}

  <div className="hidden sm:block">

    <WorkloadBar
      taskCount={currentTasks.length}
    />

  </div>


  {/* ACTIVE TASKS */}

  <div className="min-w-[64px] text-center">

    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">

      Aktive

    </p>

    <p className="mt-1 text-2xl font-bold leading-none text-slate-900 dark:text-white">

      {currentTasks.length}

    </p>

  </div>


  {/* HIGH PRIORITY */}

  {highPriorityTasks > 0 && (

    <div className="hidden min-w-[70px] border-l border-slate-200 pl-5 text-center sm:block dark:border-slate-800">

      <p className="text-[11px] font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">

        Høy prioritet

      </p>

      <p className="mt-1 text-lg font-bold leading-none text-red-600 dark:text-red-400">

        {highPriorityTasks}

      </p>

    </div>

  )}


  {/* COMPLETED */}

  <div className="hidden min-w-[64px] border-l border-slate-200 pl-5 text-center md:block dark:border-slate-800">

    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">

      Ferdige

    </p>

    <p className="mt-1 text-lg font-bold leading-none text-emerald-500">

      {completedTasks.length}

    </p>

  </div>

</div>

          {/* ARROW */}

          <div className="text-slate-400 transition group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400">

            {expanded ? "▲" : "▼"}

          </div>

        </div>

      </button>


      {/* ==================================================
          EXPANDED CONTENT
      ================================================== */}

      {expanded && (

        <div className="border-t border-slate-200 dark:border-slate-800">


          {/* ==================================================
              EMPLOYEE INFORMATION
          ================================================== */}

          <div className="border-b border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/40">

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <InfoItem
                    label="Navn"
                    value={employee.name}
                />

                <InfoItem
                    label="E-post"
                    value={employee.email}
                />

                {employee.phone_number && (

                    <InfoItem
                    label="Telefon"
                    value={employee.phone_number}
                    />

                )}

                <InfoItem
                    label="Rolle"
                    value="Ansatt"
                />

            </div>

          </div>


          {/* ==================================================
              CURRENT TASKS
          ================================================== */}

          <div className="p-5">

            <div className="mb-4 flex items-center justify-between gap-4">

              <div>

                <h3 className="font-semibold text-slate-900 dark:text-white">

                  Aktive saker

                </h3>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">

                  Saker som denne ansatte har ansvar for.

                </p>

              </div>


              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">

                {currentTasks.length}

              </span>

            </div>


            {currentTasks.length === 0 ? (

              <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center dark:border-slate-700">

                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">

                  Ingen aktive saker

                </p>

                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">

                  Denne ansatte har ingen saker å behandle akkurat nå.

                </p>

              </div>

            ) : (

              <div className="space-y-2">

                {currentTasks.map(
                  task => (

                    <TaskRow
                      key={task.id}
                      task={task}
                      onOpen={() =>
                        onOpenTask(task.id)
                      }
                    />

                  )
                )}

              </div>

            )}

          </div>


          {/* ==================================================
              COMPLETED TASKS
          ================================================== */}

          {completedTasks.length > 0 && (

            <div className="border-t border-slate-200 p-5 dark:border-slate-800">

              <details>

                <summary className="cursor-pointer list-none">

                  <div className="flex items-center justify-between">

                    <div>

                      <h3 className="font-semibold text-slate-900 dark:text-white">

                        Fullførte saker

                      </h3>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">

                        Historikk over saker denne ansatte har fullført.

                      </p>

                    </div>


                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">

                      {completedTasks.length}

                    </span>

                  </div>

                </summary>


                <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">

                  {completedTasks.map(
                    task => (

                      <TaskRow
                        key={task.id}
                        task={task}
                        onOpen={() =>
                          onOpenTask(task.id)
                        }
                      />

                    )
                  )}

                </div>

              </details>

            </div>

          )}

        </div>

      )}

    </div>

  );

}


// ====================================================
// INFO ITEM
// ====================================================

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div>

      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">

        {label}

      </p>

      <p className="mt-1 truncate text-sm font-medium text-slate-800 dark:text-slate-200">

        {value}

      </p>

    </div>

  );

}


// ====================================================
// TASK ROW
// ====================================================

function TaskRow({
  task,
  onOpen,
}: {
  task: Ticket;
  onOpen: () => void;
}) {

  return (

    <button
      type="button"
      onClick={onOpen}
      className="group w-full cursor-pointer rounded-lg border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-blue-800 dark:hover:bg-slate-800/50"
    >

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">


        {/* ID */}

        <div className="shrink-0">

          <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">

            #{task.id}

          </span>

        </div>


        {/* MAIN */}

        <div className="min-w-0 flex-1">

          <div className="mb-1 flex flex-wrap items-center gap-2">

            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">

              {task.category}

            </span>


            <PriorityBadge
              priority={task.priority}
            />


            <StatusBadge
              status={task.status}
            />

          </div>


          <p className="line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-200">

            {task.content}

          </p>


          {task.due_date && (

            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">

              Frist: {formatDate(task.due_date)}

            </p>

          )}

        </div>


        {/* OPEN */}

        <span className="shrink-0 text-sm font-semibold text-blue-600 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">

          Åpne →

        </span>

      </div>

    </button>

  );

}


// ====================================================
// PRIORITY
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

      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">

        Pågår

      </span>

    );

  }


  if (
    status === "completed" ||
    status === "finished"
  ) {

    return (

      <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400">

        Ferdig

      </span>

    );

  }


  if (status === "cancelled") {

    return (

      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400">

        Avbrutt

      </span>

    );

  }


  return (

    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">

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