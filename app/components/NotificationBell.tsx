"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";


// ====================================================
// TYPES
// ====================================================

type Notification = {
  id: number;
  user_id: number;
  type: string;
  task_id: number | null;
  message: string;
  is_read: boolean;
  created_at: string;
};


// ====================================================
// COMPONENT
// ====================================================

export default function NotificationBell() {

  const router = useRouter();

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [open, setOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const dropdownRef =
    useRef<HTMLDivElement>(null);


  // ==================================================
  // LOAD NOTIFICATIONS
  // ==================================================

  async function loadNotifications() {

    try {

      setLoading(true);

      const response =
        await fetch("/api/notifications");

      if (!response.ok) {
        return;
      }

      const result =
        await response.json();

      if (!result.success) {
        return;
      }

      setNotifications(
        result.data || []
      );

      setUnreadCount(
        result.unreadCount || 0
      );

    } catch (error) {

      console.error(
        "Kunne ikke hente varslinger:",
        error
      );

    } finally {

      setLoading(false);

    }

  }


  // ==================================================
  // INITIAL LOAD + POLLING
  // ==================================================

  useEffect(() => {

    loadNotifications();


    // Check for new notifications
    // every 10 seconds.

    const interval =
      setInterval(
        loadNotifications,
        10000
      );


    return () => {

      clearInterval(interval);

    };

  }, []);


  // ==================================================
  // CLOSE WHEN CLICKING OUTSIDE
  // ==================================================

  useEffect(() => {

    function handleClickOutside(
      event: MouseEvent
    ) {

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {

        setOpen(false);

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
  // MARK ONE AS READ
  // ==================================================

  async function markAsRead(
    notification: Notification
  ) {

    if (!notification.is_read) {

      try {

        await fetch(
          "/api/notifications",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id: notification.id,
            }),
          }
        );

      } catch (error) {

        console.error(
          "Kunne ikke merke varsling som lest:",
          error
        );

      }


      // Update UI immediately.

      setNotifications(
        previous =>
          previous.map(item =>
            item.id === notification.id
              ? {
                  ...item,
                  is_read: true,
                }
              : item
          )
      );

      setUnreadCount(
        previous =>
          Math.max(0, previous - 1)
      );

    }


    // Close dropdown.

    setOpen(false);


    // Open associated task.

    if (notification.task_id) {

      router.push(
        `/tickets/${notification.task_id}`
      );

    }

  }


  // ==================================================
  // MARK ALL AS READ
  // ==================================================

  async function markAllAsRead() {

    if (unreadCount === 0) {
      return;
    }


    try {

      const response =
        await fetch(
          "/api/notifications",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({}),
          }
        );


      if (!response.ok) {
        return;
      }


      setNotifications(
        previous =>
          previous.map(notification => ({
            ...notification,
            is_read: true,
          }))
      );

      setUnreadCount(0);

    } catch (error) {

      console.error(
        "Kunne ikke merke varslingene som lest:",
        error
      );

    }

  }


  // ==================================================
  // FORMAT TIME
  // ==================================================

  function formatNotificationTime(
    value: string
  ) {

    const date =
      new Date(value);

    const now =
      new Date();

    const difference =
      now.getTime() -
      date.getTime();


    const seconds =
      Math.floor(
        difference / 1000
      );


    if (seconds < 60) {

      return "Akkurat nå";

    }


    const minutes =
      Math.floor(
        seconds / 60
      );


    if (minutes < 60) {

      return `${minutes} min siden`;

    }


    const hours =
      Math.floor(
        minutes / 60
      );


    if (hours < 24) {

      return `${hours} t siden`;

    }


    const days =
      Math.floor(
        hours / 24
      );


    if (days < 7) {

      return `${days} d siden`;

    }


    return date.toLocaleDateString(
      "nb-NO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );

  }


  // ==================================================
  // RENDER
  // ==================================================

  return (

    <div
      ref={dropdownRef}
      className="relative"
    >

      {/* ==================================================
          BELL BUTTON
      ================================================== */}

      <button
        type="button"
        onClick={() =>
          setOpen(
            previous => !previous
          )
        }
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label="Varslinger"
        aria-expanded={open}
      >

        {/* Bell icon */}

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.8"
          stroke="currentColor"
          className="h-5 w-5"
        >

          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 0 0-12 0v.75a8.967 8.967 0 0 1-2.31 6.022c1.733.64 3.56 1.09 5.454 1.31m5.713 0a24.255 24.255 0 0 1-5.713 0m5.713 0a3 3 0 1 1-5.713 0"
          />

        </svg>


        {/* ==================================================
            UNREAD BADGE
        ================================================== */}

        {unreadCount > 0 && (

          <span className="absolute right-0.5 top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900">

            {unreadCount > 99
              ? "99+"
              : unreadCount}

          </span>

        )}

      </button>


      {/* ==================================================
          DROPDOWN
      ================================================== */}

      {open && (

        <div className="absolute right-0 z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">


          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">

            <div>

              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">

                Varslinger

              </h3>

              {unreadCount > 0 && (

                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">

                  {unreadCount} ulest
                  {unreadCount !== 1
                    ? "e"
                    : ""}

                </p>

              )}

            </div>


            {unreadCount > 0 && (

              <button
                type="button"
                onClick={markAllAsRead}
                className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >

                Merk alle som lest

              </button>

            )}

          </div>


          {/* ==================================================
              NOTIFICATIONS
          ================================================== */}

          <div className="max-h-[420px] overflow-y-auto">


            {loading &&
            notifications.length === 0 ? (

              <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">

                Laster varslinger...

              </div>

            ) : notifications.length === 0 ? (

              <div className="px-4 py-10 text-center">

                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.8"
                    stroke="currentColor"
                    className="h-5 w-5"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 0 0-12 0v.75a8.967 8.967 0 0 1-2.31 6.022c1.733.64 3.56 1.09 5.454 1.31M9 21h6"
                    />

                  </svg>

                </div>


                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">

                  Ingen varslinger

                </p>


                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">

                  Du har ingen nye varslinger.

                </p>

              </div>

            ) : (

              notifications.map(
                notification => (

                  <button
                    key={notification.id}
                    type="button"
                    onClick={() =>
                      markAsRead(
                        notification
                      )
                    }
                    className={`block w-full cursor-pointer border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 dark:border-slate-800 ${
                      notification.is_read
                        ? "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50"
                        : "bg-blue-50/60 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40"
                    }`}
                  >

                    <div className="flex gap-3">

                      {/* STATUS DOT */}

                      <div className="pt-1.5">

                        <span
                          className={`block h-2 w-2 rounded-full ${
                            notification.is_read
                              ? "bg-slate-300 dark:bg-slate-600"
                              : "bg-blue-500"
                          }`}
                        />

                      </div>


                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">

                        <p
                          className={`text-sm ${
                            notification.is_read
                              ? "font-medium text-slate-700 dark:text-slate-300"
                              : "font-semibold text-slate-900 dark:text-white"
                          }`}
                        >

                          {notification.message}

                        </p>


                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">

                          {formatNotificationTime(
                            notification.created_at
                          )}

                        </p>

                      </div>


                      {/* ARROW */}

                      {notification.task_id && (

                        <div className="pt-1 text-slate-400 dark:text-slate-500">

                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.8"
                            stroke="currentColor"
                            className="h-4 w-4"
                          >

                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m8.25 4.5 7.5 7.5-7.5 7.5"
                            />

                          </svg>

                        </div>

                      )}

                    </div>

                  </button>

                )
              )

            )}

          </div>

        </div>

      )}

    </div>

  );

}