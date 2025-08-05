import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, User, MapPin, ChevronDown, Home, Package, GraduationCap, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useUser } from "@/contexts/UserContext";
import { DashboardAnalytics } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";

import { useLocation as useLocationContext } from "@/contexts/LocationContext";
import { Notification } from "@shared/schema";
import NotificationDropdown from "@/components/NotificationDropdown";
import { AdminResetButton } from "@/utils/dataCleanup";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [selectedLocation, setSelectedLocation] = React.useState("grow-space");
  const [showNotifications, setShowNotifications] = useState(false);
  const { currentUser } = useUser();
  const isMobile = useIsMobile();
  const { currentLocation } = useLocationContext();

  const { data: analytics } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics/dashboard"],
    enabled: !!currentUser,
  });

  // Query for user notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Production: Single authenticated user, no test users

  const navigationItems = [
    { href: "/", label: "Tasks", icon: "📋", lucideIcon: Home, requiresRole: null },
    { href: "/account", label: "Account", icon: "👤", lucideIcon: User, requiresRole: null },
    { href: "/inventory", label: "Inventory", icon: "📦", lucideIcon: Package, requiresRole: null },
    { href: "/education", label: "Education", icon: "🎓", lucideIcon: GraduationCap, requiresRole: null },
  ];

  const managerItems = [
    { href: "/recurring-tasks", label: "Recurring Tasks", icon: "🔄", requiresRole: "manager", enabled: true },
    { href: "/task-data", label: "Task Data", icon: "📊", requiresRole: "manager", enabled: false, comingSoon: true },
    { href: "/staff-data", label: "Staff Data", icon: "👥", requiresRole: "manager", enabled: true },
    { href: "/production-data", label: "Production Data", icon: "🌱", requiresRole: "manager", enabled: false, comingSoon: true },
  ];

  // Use Microsoft authenticated user
  
  const isManager = currentUser?.role === "Manager" || currentUser?.role === "Corporate";

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  if (!currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="app-container bg-[#F5F5F5]">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#203B17]">Grow Space</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <span className="text-sm font-medium">{currentUser.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <div className="flex flex-col">
                  <span className="font-medium">{currentUser.name}</span>
                  <span className="text-xs text-gray-500">{currentUser.role}</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Fixed Left Sidebar - Hidden on mobile */}
      <aside className={`sidebar ${isMobile ? 'hidden' : ''}`}>
        {/* Logo/Header */}
        <div className="p-6 border-b border-[#2D8028]">
          <h1 className="text-xl font-bold text-white">🌱 Grow Space</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6">
          <div className="space-y-2 px-4">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-[#2D8028] text-white"
                    : "text-gray-300 hover:text-white hover:bg-[#2D8028]/50"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            
            {/* Manager-only items */}
            {isManager && (
              <>
                <div className="border-t border-[#2D8028] my-4"></div>
                {managerItems.map((item) => (
                  <div key={item.href} className="relative">
                    {item.enabled ? (
                      <Link
                        href={item.href}
                        className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                          isActive(item.href)
                            ? "bg-[#2D8028] text-white"
                            : "text-gray-300 hover:text-white hover:bg-[#2D8028]/50"
                        }`}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.label}
                      </Link>
                    ) : (
                      <div 
                        className="flex items-center px-4 py-3 rounded-lg font-medium text-gray-500 cursor-not-allowed opacity-60 relative group"
                        title="Coming Soon"
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.label}
                        <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Soon</span>
                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                          Coming Soon
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-[#2D8028]">
          {/* Simple Location Display */}
          <div className="flex items-center text-gray-300 mb-4">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="text-sm">{currentLocation.name}</span>
          </div>

          {/* Logout Button */}
          <div className="w-full">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Header - Hidden on mobile */}
        {!isMobile && (
          <header className="app-header">
            {/* Left side - Just the page title with emoji */}
            <div className="header-left">
              {(() => {
                const pageTitle: { [key: string]: string } = {
                  '/': '📋 Tasks',
                  '/account': '👤 Account',
                  '/inventory': '📦 Inventory',
                  '/education': '🎓 Education',
                  '/recurring-tasks': '🔄 Recurring Tasks',
                  '/task-data': '📊 Task Data',
                  '/staff-data': '👥 Staff Data',
                  '/production-data': '🌱 Production Data'
                };
                
                return (
                  <div className="page-title">
                    {pageTitle[location] || '📋 Tasks'}
                  </div>
                );
              })()}
            </div>
            
            {/* Right side - Location dropdown, notifications, and user info */}
            <div className="header-right">
              {/* Simple Location Display */}
              <div className="flex items-center text-gray-600 mr-4">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{currentLocation.name}</span>
              </div>
              
              {/* Notification Bell */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleNotifications}
                  className="relative p-2 hover:bg-gray-100 rounded-full"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
                
                {showNotifications && (
                  <NotificationDropdown
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </div>
              
              <div className="user-info">
                <User size={14} />
                <span className="user-name">Welcome, {currentUser?.name}</span>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className={`${isMobile ? 'pt-20 pb-20' : ''}`}>
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Only visible on mobile */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 h-16">
          <div className="flex justify-around items-center h-full">
            {navigationItems.slice(0, 4).map((item) => {
              const IconComponent = item.lucideIcon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center min-h-[44px] px-3 ${
                    isActive(item.href) ? "text-[#2D8028]" : "text-gray-600"
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
