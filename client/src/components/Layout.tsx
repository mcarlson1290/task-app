import React from "react";
import { Link, useLocation } from "wouter";
import { Bell, User, MapPin, ChevronDown, Home, Package, GraduationCap, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { getStoredAuth, clearStoredAuth, setStoredAuth } from "@/lib/auth";
import { DashboardAnalytics } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { LocationSelector } from "@/components/LocationSelector";
import { useLocation as useLocationContext } from "@/contexts/LocationContext";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [selectedLocation, setSelectedLocation] = React.useState("grow-space");
  const auth = getStoredAuth();
  const isMobile = useIsMobile();
  const { currentLocation } = useLocationContext();

  const { data: analytics } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics/dashboard"],
    enabled: auth.isAuthenticated,
  });

  const handleLogout = () => {
    clearStoredAuth();
    setLocation("/login");
  };

  const testUsers = [
    { id: 1, name: "Alex Martinez", role: "Staff", username: "alex" },
    { id: 2, name: "Dan Wilson", role: "Manager", username: "sarah" },
    { id: 3, name: "Matt Carlson", role: "Corporate", username: "mike" },
  ];

  const handleUserSwitch = (username: string) => {
    const user = testUsers.find(u => u.username === username);
    if (user) {
      const mockUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role.toLowerCase(),
        approved: true,
        password: "password",
        createdAt: new Date()
      };
      setStoredAuth(mockUser);
      window.location.reload(); // Refresh to update the UI
    }
  };

  const navigationItems = [
    { href: "/", label: "Tasks", icon: "📋", lucideIcon: Home, requiresRole: null },
    { href: "/account", label: "Account", icon: "👤", lucideIcon: User, requiresRole: null },
    { href: "/inventory", label: "Inventory", icon: "📦", lucideIcon: Package, requiresRole: null },
    { href: "/education", label: "Education", icon: "🎓", lucideIcon: GraduationCap, requiresRole: null },
    { href: "/analytics", label: "Analytics", icon: "📊", lucideIcon: Settings, requiresRole: null },
  ];

  const managerItems = [
    { href: "/recurring-tasks", label: "Recurring Tasks", icon: "🔄", requiresRole: "manager" },
    { href: "/task-data", label: "Task Data", icon: "📊", requiresRole: "manager" },
    { href: "/staff-data", label: "Staff Data", icon: "👥", requiresRole: "manager" },
    { href: "/production-data", label: "Production Data", icon: "🌱", requiresRole: "manager" },
    { href: "/tray-tracking", label: "Tray Tracking", icon: "📦", requiresRole: "manager" },
  ];

  const currentUser = testUsers.find(u => u.username === auth.user?.username) || testUsers[0];
  
  // Ensure currentUser has a valid username
  if (!currentUser.username) {
    currentUser.username = "alex";
  }
  const isManager = currentUser.role === "Manager" || currentUser.role === "Corporate";

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  if (!auth.isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
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
              {testUsers.map((user) => (
                <DropdownMenuItem
                  key={user.username}
                  onClick={() => handleUserSwitch(user.username)}
                  className={currentUser.username === user.username ? "bg-green-50" : ""}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-gray-500">{user.role}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Fixed Left Sidebar - Hidden on mobile */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-[#203B17] text-white flex flex-col z-50 ${isMobile ? 'hidden' : ''}`}>
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
              </>
            )}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-[#2D8028] space-y-4">
          {/* Location Display */}
          <div className="space-y-2">
            <div className="flex items-center text-gray-300">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="text-sm">Location:</span>
            </div>
            <div className="bg-[#2D8028] px-3 py-2 rounded-md text-white text-sm">
              {currentLocation.name}
            </div>
          </div>

          {/* User Selector */}
          <div className="space-y-2">
            <div className="flex items-center text-gray-300">
              <User className="h-4 w-4 mr-2" />
              <span className="text-sm">Current User:</span>
            </div>
            <div className="space-y-1">
              <Button
                variant={currentUser.username === "alex" ? "default" : "ghost"}
                onClick={() => handleUserSwitch("alex")}
                className="w-full justify-start text-sm py-2 h-auto"
              >
                Alex Martinez (Staff)
              </Button>
              <Button
                variant={currentUser.username === "sarah" ? "default" : "ghost"}
                onClick={() => handleUserSwitch("sarah")}
                className="w-full justify-start text-sm py-2 h-auto"
              >
                Dan Wilson (Manager)
              </Button>
              <Button
                variant={currentUser.username === "mike" ? "default" : "ghost"}
                onClick={() => handleUserSwitch("mike")}
                className="w-full justify-start text-sm py-2 h-auto"
              >
                Matt Carlson (Corporate)
              </Button>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#2D8028]/50"
          >
            <User className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 ${isMobile ? 'ml-0' : 'ml-64'}`}>
        {/* Top Header - Hidden on mobile */}
        {!isMobile && (
          <header className="bg-white shadow-sm sticky top-0 z-40">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-[#203B17]">
                    {navigationItems.find(item => isActive(item.href))?.label || 
                     managerItems.find(item => isActive(item.href))?.label || 
                     "Dashboard"}
                  </h2>
                  <Badge variant="secondary" className="bg-[#2D8028]/20 text-[#203B17]">
                    {currentUser.role}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4">
                  <LocationSelector />
                  <span className="text-sm text-gray-600">Welcome, {currentUser.name}</span>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {analytics?.lowStockAlerts && analytics.lowStockAlerts > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                        {analytics.lowStockAlerts}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className={`p-6 ${isMobile ? 'pt-20 pb-20' : ''}`}>
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
