"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Info,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";

import { apiFetch } from "@/lib/api";

/*
 * Backend controller contract:
 *   GET  /notifications
 *   ... read one notification
 *   ... read all notifications
 *
 * The exact route registration was not included with the controller, so the
 * endpoint constants below are kept together for easy adjustment if your
 * Express routes use different paths/methods.
 */
const NOTIFICATIONS_ENDPOINT = "/admin/notifications";
const READ_ENDPOINT = (id: number | string) =>
  `/admin/notifications/${id}/read`;

const READ_ALL_ENDPOINT = "/admin/notifications/read-all";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: unknown;
  read_at: string | null;
  created_at: string;
};

type NotificationsResponse = {
  success: boolean;
  data: NotificationItem[];
  unread_count: number;
};

function typeConfig(type: string) {
  const normalized = type.toLowerCase();

  if (
    normalized.includes("order") ||
    normalized.includes("purchase") ||
    normalized.includes("payment")
  ) {
    return {
      icon: ShoppingBag,
      iconClass: "bg-blue-50 text-blue-600",
      label: "Order",
    };
  }

  if (
    normalized.includes("ship") ||
    normalized.includes("delivery") ||
    normalized.includes("dispatch")
  ) {
    return {
      icon: Truck,
      iconClass: "bg-violet-50 text-violet-600",
      label: "Delivery",
    };
  }

  if (
    normalized.includes("stock") ||
    normalized.includes("inventory") ||
    normalized.includes("product")
  ) {
    return {
      icon: Package,
      iconClass: "bg-orange-50 text-orange-600",
      label: "Inventory",
    };
  }

  if (
    normalized.includes("alert") ||
    normalized.includes("warning") ||
    normalized.includes("error")
  ) {
    return {
      icon: AlertCircle,
      iconClass: "bg-red-50 text-red-600",
      label: "Alert",
    };
  }

  return {
    icon: Info,
    iconClass: "bg-gray-100 text-gray-600",
    label: "General",
  };
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diff = Math.max(0, now.getTime() - date.getTime());

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }).format(date);
}

function formatFullDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      setError("");

      const response = await apiFetch(NOTIFICATIONS_ENDPOINT);
      const payload = (await response.json()) as Partial<NotificationsResponse>;

      if (!response.ok) {
        throw new Error(
          (payload as { message?: string }).message ||
            "Unable to load notifications.",
        );
      }

      setNotifications(Array.isArray(payload.data) ? payload.data : []);
      setUnreadCount(Number(payload.unread_count || 0));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the server.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((notification) => !notification.read_at);
    }

    return notifications;
  }, [filter, notifications]);

  const markAsRead = async (notification: NotificationItem) => {
    if (notification.read_at || busyId === notification.id) return;

    try {
      setBusyId(notification.id);

      const response = await apiFetch(READ_ENDPOINT(notification.id), {
        method: "PATCH",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Unable to mark as read.");
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, read_at: new Date().toISOString() }
            : item,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update notification.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;

    try {
      setMarkingAll(true);

      const response = await apiFetch(READ_ALL_ENDPOINT, {
        method: "PATCH",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Unable to mark all as read.");
      }

      const now = new Date().toISOString();

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read_at: item.read_at || now,
        })),
      );
      setUnreadCount(0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update notifications.",
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadInList = notifications.filter((item) => !item.read_at).length;

  return (
    <div className="min-w-0 pb-10">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
            <BellRing size={13} className="text-gray-700" />
            Notifications
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Stay updated with orders, inventory and store activity.
          </p>
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => loadNotifications(true)}
            disabled={refreshing}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60 sm:flex-none"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || markingAll}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
          >
            <CheckCheck size={16} />
            {markingAll ? "Updating..." : "Mark all read"}
          </button>
        </div>
      </header>

      {/* Summary */}
      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <Bell size={18} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-950">
                {notifications.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BellRing size={18} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Unread</p>
              <p className="text-xl font-bold text-gray-950">{unreadCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Check size={18} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Read</p>
              <p className="text-xl font-bold text-gray-950">
                {Math.max(0, notifications.length - unreadCount)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main card */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-semibold text-gray-950">Recent activity</h2>
            <p className="mt-1 text-xs text-gray-500">
              Showing the latest 50 notifications.
            </p>
          </div>

          <div className="flex w-full rounded-xl bg-gray-100 p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition sm:flex-none ${
                filter === "all"
                  ? "bg-white text-gray-950 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              All
              <span className="ml-1.5 text-gray-400">
                {notifications.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition sm:flex-none ${
                filter === "unread"
                  ? "bg-white text-gray-950 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Unread
              {unreadInList > 0 && (
                <span className="ml-1.5 rounded-full bg-gray-950 px-1.5 py-0.5 text-[9px] text-white">
                  {unreadInList}
                </span>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="m-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:m-5">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-0.5 text-xs">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 hover:bg-red-100"
              aria-label="Dismiss error"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex gap-4 p-5">
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-gray-100" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Bell size={25} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-gray-800">
              {filter === "unread"
                ? "You're all caught up"
                : "No notifications yet"}
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-gray-400">
              {filter === "unread"
                ? "There are no unread notifications at the moment."
                : "New order, inventory and store updates will appear here."}
            </p>

            {filter === "unread" && (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-5 text-xs font-semibold text-gray-700 hover:underline"
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => {
              const config = typeConfig(notification.type);
              const Icon = config.icon;
              const isUnread = !notification.read_at;

              return (
                <div
                  key={notification.id}
                  className={`group relative p-4 transition sm:p-5 ${
                    isUnread ? "bg-blue-50/30" : "bg-white hover:bg-gray-50/60"
                  }`}
                >
                  {isUnread && (
                    <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-blue-600" />
                  )}

                  <div className="flex items-start gap-3 sm:gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={`text-sm ${
                                isUnread
                                  ? "font-bold text-gray-950"
                                  : "font-semibold text-gray-800"
                              }`}
                            >
                              {notification.title}
                            </h3>

                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-500">
                              {config.label}
                            </span>

                            {isUnread && (
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                            )}
                          </div>

                          <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-gray-500">
                            {notification.message}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-gray-400">
                          <Clock3 size={12} />
                          <span title={formatFullDate(notification.created_at)}>
                            {formatRelativeDate(notification.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {isUnread ? (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification)}
                            disabled={busyId === notification.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-950 disabled:opacity-50"
                          >
                            <Check size={13} />
                            {busyId === notification.id
                              ? "Marking..."
                              : "Mark as read"}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                            <CheckCheck size={13} />
                            Read
                          </span>
                        )}

                        <span className="hidden text-[10px] text-gray-300 sm:inline">
                          #{notification.id}
                        </span>
                      </div>
                    </div>

                    {isUnread && (
                      <div className="hidden shrink-0 items-center text-gray-300 transition group-hover:text-gray-500 sm:flex">
                        <ChevronRight size={17} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <Clock3 size={12} />
        Notifications are automatically loaded when you open this page.
      </div>

      <Link
        href="/admin"
        className="mx-auto mt-3 flex w-fit items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-950"
      >
        Back to dashboard
        <ChevronRight size={13} />
      </Link>
    </div>
  );
}
