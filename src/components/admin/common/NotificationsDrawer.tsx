import React, { useState, useEffect } from "react";
import {
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Info,
  Trash2,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import {
  getStoredAdminNotifications,
  markAllNotificationsRead,
  clearAllNotifications,
  markNotificationAsRead,
} from "../../../features/admin/store/admin-store.ts";
import type { AdminNotification } from "../../../types/admin.ts";

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  open,
  onClose,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>(() =>
    getStoredAdminNotifications()
  );

  const loadNotifs = () => {
    setNotifications(getStoredAdminNotifications());
  };

  useEffect(() => {
    loadNotifs();
    const handleUpdate = () => loadNotifs();
    window.addEventListener("notifications_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("notifications_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    loadNotifs();
  };

  const handleClearAll = () => {
    clearAllNotifications();
    loadNotifs();
  };

  const handleClickItem = (n: AdminNotification) => {
    markNotificationAsRead(n.id);
    loadNotifs();
    if (n.link) {
      onClose();
      onNavigate(n.link);
    }
  };

  const getIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "ORDER":
        return <ShoppingBag className="h-4 w-4 text-[#8B6D43]" />;
      case "STOCK":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "SECURITY":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF9F6] border-l border-[#E8E1D5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 border-b border-[#E8E1D5] bg-[#FAF8F5] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#F4EFE6] border border-[#D2C2AD]/50 flex items-center justify-center text-[#8B6D43]">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#2D2A26]">
                  Apothecary Alerts
                </h3>
                <p className="text-[11px] text-[#8B6D43] font-medium">
                  {unreadCount > 0 ? `${unreadCount} unread notices` : "All notifications read"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#2D2A26]/50 hover:text-[#2D2A26] hover:bg-[#F4EFE6] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Action Bar */}
          {notifications.length > 0 && (
            <div className="px-5 py-2.5 bg-[#FAF8F5] border-b border-[#E8E1D5] flex items-center justify-between text-xs text-[#2D2A26]/70">
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 hover:text-[#8B6D43] transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear all</span>
              </button>
            </div>
          )}

          {/* Notification Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E8E1D5]/60">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-[#2D2A26]/40">
                <Bell className="h-8 w-8 mx-auto mb-2 text-[#8B6D43]/30" />
                <p className="font-serif text-sm text-[#2D2A26]">No notifications</p>
                <p className="text-[11px] text-[#2D2A26]/40 mt-1">
                  You're fully up to date with dispensary operations.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleClickItem(notif)}
                  className={`p-4 transition-colors cursor-pointer flex gap-3.5 ${
                    notif.read
                      ? "hover:bg-[#F4EFE6]/40 bg-[#FAF9F6]"
                      : "bg-[#F4EFE6]/50 hover:bg-[#F4EFE6]/80"
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-[#FFFFFF] border border-[#D2C2AD]/50 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-[#2D2A26] truncate">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-[#8B6D43] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#2D2A26]/80 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#8B6D43]">
                      <span>{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {notif.link && (
                        <span className="inline-flex items-center gap-1 hover:underline font-semibold">
                          View details <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
