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
      current: location.pathname === '/',
      badge: { text: 'Active', variant: 'default' as const }
    },
    {
      name: 'Analytics',
      href: '/churn-analytics',
      icon: BarChart3,
      current: location.pathname === '/churn-analytics',
      badge: { text: 'New', variant: 'secondary' as const }
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
    { name: 'Export Data', icon: Download, action: () => {} },
    { name: 'Import Data', icon: Upload, action: () => {} },
    { name: 'Refresh', icon: RefreshCw, action: () => {} }
  ];

  const stats = [
    { name: 'Total Members', value: '2,847', icon: Users, color: 'text-blue-600' },
    { name: 'Active Today', value: '431', icon: Activity, color: 'text-green-600' },
    { name: 'Revenue', value: '$84.2K', icon: TrendingUp, color: 'text-purple-600' },
    { name: 'Renewals Due', value: '23', icon: Calendar, color: 'text-orange-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl border-r border-slate-200 lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        transition-transform duration-300 ease-in-out
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">MembershipPro</h1>
                  <p className="text-sm text-slate-500">Management System</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-4 border-b border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat) => (
                <Card key={stat.name} className="p-3 bg-gradient-to-r from-slate-50 to-white border-slate-200">
                  <div className="flex items-center space-x-2">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    <div>
                      <p className="text-xs text-slate-600">{stat.name}</p>
                      <p className="text-sm font-semibold text-slate-900">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Navigation
              </h3>
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                      ${item.current 
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200' 
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-5 w-5 ${item.current ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <Badge variant={item.badge.variant} className="text-xs">
                        {item.badge.text}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
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
                      className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-slate-50"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{action.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Premium Plan</p>
                  <p className="text-xs text-slate-500">All features unlocked</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-72">
        {/* Top header */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Breadcrumbs */}
              <nav className="flex items-center space-x-2">
                <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
                  Dashboard
                </Link>
                {location.pathname !== '/' && (
                  <>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-900 font-medium">
                      {location.pathname === '/churn-analytics' ? 'Analytics' : 'Current Page'}
                    </span>
                  </>
                )}
              </nav>
            </div>

            {/* Header actions */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">3</span>
                </span>
              </Button>

              {/* User menu */}
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-slate-900">Admin User</p>
                  <p className="text-slate-500">admin@company.com</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};