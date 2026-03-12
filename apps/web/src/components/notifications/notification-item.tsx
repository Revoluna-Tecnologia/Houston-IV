"use client";

import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/lib/date-locale";
import {
  Bell,
  MessageSquare,
  Calendar,
  AlertTriangle,
  Users,
  FileText,
  Clock,
  Check,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Notification, NotificationType } from "@/services/notifications";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  ticket: FileText,
  message: MessageSquare,
  vaga: Calendar,
  candidatura: Users,
  medico: Users,
  comunicado: Bell,
  checkin: Clock,
  checkout: Clock,
  shift: Calendar,
};

function getIcon(type: NotificationType) {
  const prefix = type.split("_")[0];
  return NOTIFICATION_ICONS[prefix] || Bell;
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "urgent":
      return "border-l-red-500";
    case "high":
      return "border-l-orange-500";
    case "normal":
      return "border-l-blue-500";
    case "low":
      return "border-l-gray-400";
    default:
      return "border-l-gray-400";
  }
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const t = useTranslations("Notifications.item");
  const dateLocale = useDateLocale();
  const Icon = getIcon(notification.type);
  const priorityColor = getPriorityColor(notification.priority);
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: dateLocale,
  });

  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    onClick?.(notification);
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 border-l-4 transition-colors cursor-pointer",
        priorityColor,
        notification.read
          ? "bg-background hover:bg-muted/50"
          : "bg-muted/30 hover:bg-muted/50",
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          notification.priority === "urgent"
            ? "bg-red-100 text-red-600"
            : notification.priority === "high"
              ? "bg-orange-100 text-orange-600"
              : "bg-blue-100 text-blue-600",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-medium truncate",
                !notification.read && "font-semibold",
              )}
            >
              {notification.title}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {notification.content}
            </p>
          </div>

          {notification.priority === "urgent" && (
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>

          <div className="flex items-center gap-1">
            {!notification.read && onMarkAsRead && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                title={t("markAsRead")}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                title={t("delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
