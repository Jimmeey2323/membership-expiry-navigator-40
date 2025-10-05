import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GlobalFilterPanel } from '@/components/GlobalFilterPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Users,
  X,
  Bell,
  Search,
  ChevronRight,
  Sparkles,
  Filter
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  filterData?: any[];
  showFilterSidebar?: boolean;
}

export const AppLayout = ({ children, filterData, showFilterSidebar = false }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Collapsed by default
  const location = useLocation();

  return (
    <div className="flex h-screen bg-white flex-col">
      {/* Modern Refined Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-white/30 shadow-lg z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            {/* Toggle Filter Sidebar Button */}
            {showFilterSidebar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                title={sidebarCollapsed ? "Show Filters" : "Hide Filters"}
              >
                <Filter className="h-5 w-5" />
              </Button>
            )}
            
            {/* Mobile Filter Sidebar Button */}
            {showFilterSidebar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                title="Show Filters"
              >
                <Filter className="h-5 w-5" />
              </Button>
            )}
            
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl blur-sm opacity-50 animate-pulse"></div>
                <Users className="relative h-6 w-6 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent">
                  Lapsed & Renewals Tracker
                </h1>
                <p className="text-sm text-slate-600 font-medium">Advanced Member Management</p>
              </div>
            </div>
            
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 ml-8">
              <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors duration-200">
                Dashboard
              </Link>
              {location.pathname !== '/' && (
                <>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-900 font-semibold">
                    {location.pathname === '/churn-analytics' ? 'Analytics' : 'Current Page'}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* Header actions */}
          <div className="flex items-center space-x-3">
            {/* Enhanced Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search members..."
                className="pl-10 pr-4 py-2 border border-white/50 rounded-lg bg-white/95 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all duration-200 backdrop-blur-sm shadow-sm"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-xs text-white font-bold">3</span>
              </span>
            </Button>

            {/* User menu */}
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-900">Admin User</p>
                <p className="text-slate-600">admin@company.com</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Filter Sidebar */}
        {showFilterSidebar && filterData && (
          <aside className={`
            fixed inset-y-0 left-0 z-30 bg-slate-50/95 backdrop-blur-sm shadow-2xl border-r border-slate-200
            lg:static lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-80'}
            transition-all duration-300 ease-in-out flex-shrink-0
            top-[5rem] lg:top-0 h-[calc(100vh-5rem)] lg:h-full
            w-80
          `}>
            <div className="flex flex-col h-full bg-white rounded-tr-xl border border-slate-200 shadow-inner">
              {/* Close button for mobile */}
              <div className="flex justify-end p-4 lg:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Filter Panel Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                {!sidebarCollapsed ? (
                  <div className="p-4 h-full">
                    <GlobalFilterPanel data={filterData} className="h-full" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full px-2 py-4">
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => setSidebarCollapsed(false)}
                      className="w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 shadow-sm border border-indigo-200"
                      title="Expand Filters"
                    >
                      <Filter className="h-5 w-5" />
                    </Button>
                    <p className="text-xs text-slate-500 mt-2 text-center font-medium">Filters</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={`border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 ${
                sidebarCollapsed ? 'p-2' : 'p-4'
              }`}>
                {!sidebarCollapsed ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Smart Filters</p>
                      <p className="text-xs text-slate-600">Advanced data refinement</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarCollapsed(true)}
                        className="h-8 w-8 p-0 hover:bg-slate-200 text-slate-500 hover:text-slate-700"
                        title="Collapse Sidebar"
                      >
                        <ChevronRight className="h-4 w-4 transform rotate-180" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <ThemeToggle />
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 p-6 bg-white overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
