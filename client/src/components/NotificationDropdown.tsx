import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Clock, 
  Package, 
  User,
  Check
} from "lucide-react";
import { Notification } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'task_overdue':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'task_assigned':
      return <User className="h-4 w-4 text-blue-500" />;
    case 'course_assigned':
      return <BookOpen className="h-4 w-4 text-green-600" />;
    case 'task_acknowledged':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'urgent_task':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'course_due_soon':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'inventory_low':
      return <Package className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'task_overdue':
    case 'urgent_task':
      return 'border-l-red-500';
    case 'task_assigned':
      return 'border-l-blue-500';
    case 'course_assigned':
      return 'border-l-green-600';
    case 'task_acknowledged':
      return 'border-l-green-500';
    case 'course_due_soon':
      return 'border-l-yellow-500';
    case 'inventory_low':
      return 'border-l-purple-500';
    default:
      return 'border-l-gray-300';
  }
};

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onClose
}) => {
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      apiRequest('PATCH', `/api/notifications/${notificationId}`, { isRead: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      apiRequest('PATCH', '/api/notifications/mark-all-read', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    onClose();
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="absolute top-12 right-0 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            className="text-xs"
          >
            <Check className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification List */}
      <ScrollArea className="max-h-96">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${getNotificationColor(notification.type)} ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-medium truncate ${
                        !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(notification.createdAt!), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Close notifications
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;