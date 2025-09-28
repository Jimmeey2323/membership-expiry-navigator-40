import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  Home,
  Activity,
  TrendingUp,
  FileText,
  Bell,
  Search,
  Plus,
  Download,
  Upload,
  RefreshCw,
  ChevronRight,
  Building2,
  Calendar,
  Crown,
  Sparkles
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Collapsed by default
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      current: location.pathname === '/',
      badge: null
    },
    {
      name: 'Members',
      href: '/',
      icon: Users,
      current: location.pathname === '/members',
      badge: { text: '2,845', variant: 'secondary' as const }
    },
    {
      name: 'Analytics',
      href: '/churn-analytics',
      icon: BarChart3,
      current: location.pathname === '/churn-analytics',
      badge: { text: 'Live', variant: 'default' as const }
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: FileText,
      current: location.pathname === '/reports',
      badge: null
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: location.pathname === '/settings',
      badge: null
    }
  ];

  const quickActions = [
    { name: 'Add Member', icon: Plus, action: () => {} },
    { name: 'Export', icon: Download, action: () => {} },
    { name: 'Import', icon: Upload, action: () => {} },
    { name: 'Refresh', icon: RefreshCw, action: () => {} }
  ];

  const stats = [
    { name: 'Active Members', value: '2,845', icon: Users },
    { name: 'Pending Renewals', value: '127', icon: Calendar },
    { name: 'Revenue Today', value: '$12.4k', icon: TrendingUp },
    { name: 'Churn Risk', value: '8.2%', icon: Activity }
  ];

  return (
    <div className="flex h-screen bg-white flex-col">
      {/* Modern Refined Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-white/30 shadow-lg z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            {/* Toggle Sidebar Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Mobile Sidebar Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent">MembershipPro</h1>
                <p className="text-sm text-slate-600 font-medium">Management System</p>
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
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-75 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 bg-white shadow-xl border-r border-gray-200 lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarCollapsed ? 'w-16 lg:w-16' : 'w-72 lg:w-72'}
          transition-all duration-300 ease-in-out lg:flex lg:flex-shrink-0
          top-20 lg:top-20
        `}>
          <div className="flex flex-col h-full">
            {/* Close button for mobile */}
            {sidebarOpen && (
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
            )}

            {/* Quick Stats */}
            {!sidebarCollapsed && (
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-2 gap-3">
                  {stats.map((stat) => (
                    <Card key={stat.name} className="p-3 bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-2">
                        <stat.icon className="h-4 w-4 text-white" />
                        <div>
                          <p className="text-xs text-white opacity-80">{stat.name}</p>
                          <p className="text-sm font-semibold text-white">{stat.value}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 bg-white">
              {!sidebarCollapsed && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Navigation
                  </h3>
                </div>
              )}
              <div className={sidebarCollapsed ? 'space-y-2' : ''}>
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      title={sidebarCollapsed ? item.name : ''}
                      className={`
                        flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-300
                        ${sidebarCollapsed ? 'justify-center' : 'justify-between'}
                        ${item.current 
                          ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className={`flex items-center ${sidebarCollapsed ? '' : 'space-x-3'}`}>
                        <Icon className={`h-5 w-5 ${item.current ? 'text-white' : 'text-gray-500'}`} />
                        {!sidebarCollapsed && <span>{item.name}</span>}
                      </div>
                      {!sidebarCollapsed && item.badge && (
                        <Badge variant={item.badge.variant} className={`text-xs ${item.current ? 'bg-white/20 text-white border-white/30' : 'bg-gray-200 text-gray-700'}`}>
                          {item.badge.text}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>

              {!sidebarCollapsed && <Separator className="bg-gray-200" />}

              {/* Quick Actions */}
              {!sidebarCollapsed && (
                <div className="mt-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={action.name}
                          variant="outline"
                          size="sm"
                          onClick={action.action}
                          className="flex flex-col items-center gap-1 h-auto py-3 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-xs">{action.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              {!sidebarCollapsed ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Premium Plan</p>
                      <p className="text-xs text-gray-600">All features unlocked</p>
                    </div>
                  </div>
                  <ThemeToggle />
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                  <ThemeToggle />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 p-6 bg-white overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
