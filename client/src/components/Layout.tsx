import React from "react";
import { Link, useLocation } from "wouter";
import { Bell, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getStoredAuth, clearStoredAuth } from "@/lib/auth";
import { DashboardAnalytics } from "@/types";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const auth = getStoredAuth();

  const { data: analytics } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics/dashboard"],
    enabled: auth.isAuthenticated,
  });

  const handleLogout = () => {
    clearStoredAuth();
    setLocation("/login");
  };

  const navigationItems = [
    { href: "/", label: "Tasks", icon: "📋" },
    { href: "/inventory", label: "Inventory", icon: "📦" },
    { href: "/education", label: "Education", icon: "🎓" },
    { href: "/analytics", label: "Analytics", icon: "📊" },
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  if (!auth.isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-[#203B17]">🌱 Grow Space</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm text-gray-600">Welcome,</span>
                <span className="text-sm font-medium text-[#203B17]">
                  {auth.user?.name}
                </span>
                <Badge variant="secondary" className="bg-[#2D8028]/20 text-[#203B17]">
                  {auth.user?.role}
                </Badge>
              </div>
              
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                {analytics?.lowStockAlerts && analytics.lowStockAlerts > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                    {analytics.lowStockAlerts}
                  </Badge>
                )}
              </Button>
              
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <User className="h-5 w-5 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 mt-8">
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-[#2D8028] bg-[#2D8028]/10"
                      : "text-gray-600 hover:text-[#2D8028] hover:bg-gray-50"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Quick Stats */}
            {analytics && (
              <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#203B17] mb-4">
                  Today's Progress
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed Tasks</span>
                    <span className="text-sm font-medium text-[#203B17]">
                      {analytics.completedTasks}/{analytics.totalTasks}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#2D8028] rounded-full h-2 transition-all duration-300"
                      style={{ 
                        width: `${analytics.totalTasks > 0 ? (analytics.completedTasks / analytics.totalTasks) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Hours Logged</span>
                    <span className="text-sm font-medium text-[#203B17]">
                      {Math.round(analytics.totalTimeLogged / 60 * 10) / 10}h
                    </span>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1 mt-8">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center p-2 ${
                isActive(item.href) ? "text-[#2D8028]" : "text-gray-600"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
