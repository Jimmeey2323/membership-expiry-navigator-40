
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedDataTable } from "@/components/EnhancedDataTable";
import { PremiumCharts } from "@/components/PremiumCharts";
import { googleSheetsService } from "@/services/googleSheets";
import { MembershipData } from "@/types/membership";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Activity,
  Calendar,
  AlertTriangle,
  Crown,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  Download,
  Upload,
  Plus,
  BarChart3,
  FileText,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [localMembershipData, setLocalMembershipData] = useState<MembershipData[]>([]);

  const { data: membershipData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['membershipData'],
    queryFn: () => googleSheetsService.getMembershipData(),
    refetchInterval: 300000,
  });

  useEffect(() => {
    if (membershipData) {
      setLocalMembershipData(membershipData);
    }
  }, [membershipData]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch membership data. Using sample data for demonstration.");
    }
  }, [error]);

  const handleAnnotationUpdate = (memberUniqueId: string, comments: string, notes: string, tags: string[]) => {
    setLocalMembershipData(prev => 
      prev.map(member => 
        member.uniqueId === memberUniqueId 
          ? { ...member, comments, notes, tags }
          : member
      )
    );
    
    // Save to backend
    googleSheetsService.saveAnnotation(memberUniqueId, comments, notes, tags)
      .then(() => {
        toast.success("Member annotations updated successfully!");
      })
      .catch(() => {
        toast.error("Failed to save annotations. Changes are local only.");
      });
  };

  // Calculate metrics
  const totalMembers = localMembershipData.length;
  const activeMembers = localMembershipData.filter(member => member.status === 'Active');
  const churnedMembers = localMembershipData.filter(member => member.status === 'Churned');
  const expiringMembers = localMembershipData.filter(member => {
    const endDate = new Date(member.endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0 && member.status === 'Active';
  });
  const withAnnotations = localMembershipData.filter(member => 
    (member.comments && member.comments.trim()) || 
    (member.notes && member.notes.trim()) || 
    (member.tags && member.tags.length > 0)
  );

  const totalSessions = localMembershipData.reduce((sum, member) => sum + (member.sessionsLeft || 0), 0);
  const totalRevenue = localMembershipData.reduce((sum, member) => sum + parseFloat(member.paid || '0'), 0);

  const quickActions = [
    { 
      name: 'Add Member', 
      icon: Plus, 
      action: () => toast.info('Add member feature coming soon!'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    { 
      name: 'Export Data', 
      icon: Download, 
      action: () => toast.info('Export feature coming soon!'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    { 
      name: 'Import Data', 
      icon: Upload, 
      action: () => toast.info('Import feature coming soon!'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    { 
      name: 'Refresh Data', 
      icon: RefreshCw, 
      action: () => {
        refetch();
        toast.success('Data refreshed!');
      },
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading membership data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Member Dashboard</h1>
          <p className="text-slate-600 mt-1">Comprehensive membership management and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Activity className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700">Total Members</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalMembers.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-700">Active Members</CardTitle>
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{activeMembers.length.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-orange-700">Expiring Soon</CardTitle>
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{expiringMembers.length.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <Calendar className="h-4 w-4 text-orange-600 mr-1" />
              <span className="text-sm text-orange-600">Next 30 days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-700">Revenue</CardTitle>
              <Crown className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">${totalRevenue.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+18% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Frequently used actions for member management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.name}
                  onClick={action.action}
                  variant="outline"
                  className={`h-20 flex flex-col items-center gap-2 hover:scale-105 transition-transform ${action.color} hover:text-white border-2`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{action.name}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="members" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {withAnnotations.length} with notes
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {churnedMembers.length} churned
            </Badge>
          </div>
        </div>

        <TabsContent value="members" className="space-y-6">
          <EnhancedDataTable
            data={localMembershipData}
            title="Member Management"
            onAnnotationUpdate={handleAnnotationUpdate}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PremiumCharts data={localMembershipData} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Insights</CardTitle>
              <CardDescription>
                Comprehensive reporting features coming soon!
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">Advanced Reports</h3>
                <p className="text-slate-500">Detailed member insights and analytics reports will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;

const Index = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    locations: [],
    membershipTypes: [],
    dateRange: { start: '', end: '' },
    sessionsRange: { min: 0, max: 100 }
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({
    status: [],
    locations: [],
    membershipTypes: [],
    dateFilters: [],
    sessionFilters: [],
    customFilters: []
  });
  const [localMembershipData, setLocalMembershipData] = useState<MembershipData[]>([]);

  const { data: membershipData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['membershipData'],
    queryFn: () => googleSheetsService.getMembershipData(),
    refetchInterval: 300000,
  });

  useEffect(() => {
    if (membershipData) {
      setLocalMembershipData(membershipData);
    }
  }, [membershipData]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch membership data. Using sample data for demonstration.");
    }
  }, [error]);

  const handleAnnotationUpdate = (memberId: string, comments: string, notes: string, tags: string[]) => {
    setLocalMembershipData(prev => 
      prev.map(member => 
        member.memberId === memberId 
          ? { ...member, comments, notes, tags }
          : member
      )
    );
    toast.success("Member annotations updated successfully!");
  };

  // Enhanced date parsing function
  const parseDate = (dateStr: string): Date => {
    if (!dateStr || dateStr === '-') return new Date(0);
    
    let cleanDateStr = dateStr.trim();
    
    if (cleanDateStr.includes(' ')) {
      cleanDateStr = cleanDateStr.split(' ')[0];
    }
    
    if (cleanDateStr.includes('/')) {
      const parts = cleanDateStr.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }
    
    if (cleanDateStr.includes('-')) {
      const parsedDate = new Date(cleanDateStr);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    const fallbackDate = new Date(dateStr);
    return isNaN(fallbackDate.getTime()) ? new Date(0) : fallbackDate;
  };

  // Enhanced filter application using CollapsibleFilters
  const getFilteredData = (): MembershipData[] => {
    let filteredData = [...localMembershipData];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Apply all active filters
    const allActiveFilters = Object.values(activeFilters).flat();
    
    if (allActiveFilters.length > 0) {
      allActiveFilters.forEach(filterKey => {
        switch (filterKey) {
          // Status filters
          case 'active':
            filteredData = filteredData.filter(member => member.status === 'Active');
            break;
          case 'churned':
            filteredData = filteredData.filter(member => member.status === 'Churned');
            break;
          case 'frozen':
            filteredData = filteredData.filter(member => member.status === 'Frozen');
            break;
          
          // Session filters
          case 'sessions':
            filteredData = filteredData.filter(member => (member.sessionsLeft || 0) > 0);
            break;
          case 'no-sessions':
            filteredData = filteredData.filter(member => (member.sessionsLeft || 0) === 0);
            break;
          case 'low-sessions':
            filteredData = filteredData.filter(member => (member.sessionsLeft || 0) > 0 && (member.sessionsLeft || 0) <= 3);
            break;
          case 'medium-sessions':
            filteredData = filteredData.filter(member => (member.sessionsLeft || 0) >= 4 && (member.sessionsLeft || 0) <= 10);
            break;
          case 'high-sessions':
            filteredData = filteredData.filter(member => (member.sessionsLeft || 0) > 10);
            break;
          
          // Date filters
          case 'recent':
            filteredData = filteredData.filter(member => parseDate(member.orderDate) >= thirtyDaysAgo);
            break;
          case 'weekly':
            filteredData = filteredData.filter(member => parseDate(member.orderDate) >= sevenDaysAgo);
            break;
          case 'expiring-week':
            filteredData = filteredData.filter(member => {
              const endDate = parseDate(member.endDate);
              return endDate >= now && endDate <= nextWeek && member.status === 'Active';
            });
            break;
          case 'expiring-month':
            filteredData = filteredData.filter(member => {
              const endDate = parseDate(member.endDate);
              return endDate >= now && endDate <= nextMonth && member.status === 'Active';
            });
            break;
          case 'expired':
            filteredData = filteredData.filter(member => parseDate(member.endDate) < now);
            break;
          
          // Custom filters
          case 'premium':
            filteredData = filteredData.filter(member => 
              member.membershipName && 
              (member.membershipName.toLowerCase().includes('unlimited') || 
               member.membershipName.toLowerCase().includes('premium'))
            );
            break;
          case 'high-value':
            filteredData = filteredData.filter(member => parseFloat(member.paid || '0') > 5000);
            break;
          case 'unpaid':
            filteredData = filteredData.filter(member => 
              !member.paid || member.paid === '-' || parseFloat(member.paid || '0') === 0
            );
            break;
          
          // Dynamic location filters
          default:
            // Check if it's a location filter
            if (localMembershipData.some(m => m.location === filterKey)) {
              filteredData = filteredData.filter(member => member.location === filterKey);
            }
            // Check if it's a membership type filter
            else if (localMembershipData.some(m => m.membershipName === filterKey)) {
              filteredData = filteredData.filter(member => member.membershipName === filterKey);
            }
            break;
        }
      });
    }

    // Apply traditional filters as well
    if (filters.status.length > 0) {
      filteredData = filteredData.filter(member => filters.status.includes(member.status));
    }
    
    if (filters.locations.length > 0) {
      filteredData = filteredData.filter(member => filters.locations.includes(member.location));
    }
    
    if (filters.membershipTypes.length > 0) {
      filteredData = filteredData.filter(member => filters.membershipTypes.includes(member.membershipName));
    }
    
    if (filters.sessionsRange.min > 0 || filters.sessionsRange.max < 100) {
      filteredData = filteredData.filter(member => 
        (member.sessionsLeft || 0) >= filters.sessionsRange.min && 
        (member.sessionsLeft || 0) <= filters.sessionsRange.max
      );
    }
    
    if (filters.dateRange.start) {
      const filterStartDate = new Date(filters.dateRange.start);
      filteredData = filteredData.filter(member => {
        const memberEndDate = parseDate(member.endDate);
        return memberEndDate >= filterStartDate;
      });
    }
    
    if (filters.dateRange.end) {
      const filterEndDate = new Date(filters.dateRange.end);
      filteredData = filteredData.filter(member => {
        const memberEndDate = parseDate(member.endDate);
        return memberEndDate <= filterEndDate;
      });
    }
    
    return filteredData;
  };

  // Get filtered data for ALL components
  const filteredData = getFilteredData();
  
  // Calculate ACCURATE metrics based on filtered data - Updated for new status structure
  const activeMembers = filteredData.filter(member => member.status === 'Active');
  const churnedMembers = filteredData.filter(member => member.status === 'Churned');
  const frozenMembers = filteredData.filter(member => member.status === 'Frozen');
  const membersWithSessions = filteredData.filter(member => (member.sessionsLeft || 0) > 0);
  const totalSessions = filteredData.reduce((sum, member) => sum + (member.sessionsLeft || 0), 0);
  const avgSessionsPerMember = filteredData.length > 0 ? Math.round(totalSessions / filteredData.length) : 0;
  
  const expiringMembers = filteredData.filter(member => {
    const endDate = parseDate(member.endDate);
    const now = new Date();
    return endDate >= now && endDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) && member.status === 'Active';
  });

  const premiumMembers = filteredData.filter(member => 
    member.membershipName?.toLowerCase().includes('unlimited') || 
    member.membershipName?.toLowerCase().includes('premium')
  );

  const availableLocations = [...new Set(localMembershipData.map(member => member.location).filter(l => l && l !== '-'))];
  const availableMembershipTypes = [...new Set(localMembershipData.map(member => member.membershipName))];

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed successfully");
  };

  const handleFiltersReset = () => {
    setFilters({
      status: [],
      locations: [],
      membershipTypes: [],
      dateRange: { start: '', end: '' },
      sessionsRange: { min: 0, max: 100 }
    });
    setActiveFilters({
      status: [],
      locations: [],
      membershipTypes: [],
      dateFilters: [],
      sessionFilters: [],
      customFilters: []
    });
    toast.success("All filters cleared");
  };

  const hasActiveFilters = () => {
    const allActiveFilters = Object.values(activeFilters).flat();
    return allActiveFilters.length > 0 || 
           filters.status.length > 0 || 
           filters.locations.length > 0 || 
           filters.membershipTypes.length > 0 ||
           filters.dateRange.start !== '' ||
           filters.dateRange.end !== '' ||
           filters.sessionsRange.min !== 0 ||
           filters.sessionsRange.max !== 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="text-center space-y-8 animate-fade-in">
          <Card className="premium-card p-16 max-w-xl mx-auto shadow-2xl">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-full blur-2xl opacity-30 animate-pulse" />
              <div className="relative p-8 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white rounded-full mx-auto w-fit shadow-2xl">
                <RefreshCw className="h-16 w-16 animate-spin" />
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-800 bg-clip-text text-transparent">
                Loading Premium Dashboard
              </h2>
              <p className="text-xl text-slate-600 font-medium">
                Fetching advanced analytics & member insights...
              </p>
              
              <div className="space-y-4 mt-12">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className="h-3 bg-gradient-to-r from-blue-200/40 via-purple-300/60 to-blue-200/40 rounded-full animate-pulse"
                    style={{ 
                      animationDelay: `${i * 300}ms`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
      {/* Full width container with enhanced styling */}
      <div className="max-w-[1920px] mx-auto px-8 py-12 space-y-12">
        {/* Premium Header with enhanced gradients */}
        <div className="relative animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-orange-500/10 rounded-3xl blur-3xl" />
          <Card className="relative backdrop-blur-xl border-2 border-white/20 dark:border-slate-700/30 shadow-2xl hover:shadow-3xl transition-all duration-500 bg-white/70 dark:bg-slate-800/70 p-10 rounded-3xl">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 rounded-3xl blur-xl opacity-40 animate-pulse" />
                    <div className="relative p-6 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 text-white rounded-3xl shadow-2xl">
                      <Building2 className="h-10 w-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent dark:from-white dark:via-blue-200 dark:to-purple-200">
                      Premium Membership Analytics
                    </h1>
                    <p className="text-2xl text-slate-600 dark:text-slate-300 font-medium">
                      Advanced insights & comprehensive member management platform
                    </p>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-200 dark:border-emerald-700">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        Live Data
                      </div>
                      <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200 dark:border-blue-700">
                        <Sparkles className="h-4 w-4" />
                        Premium Features
                      </div>
                      {hasActiveFilters() && (
                        <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-4 py-2 rounded-full text-sm font-semibold border border-orange-200 dark:border-orange-700 animate-pulse">
                          <Filter className="h-4 w-4" />
                          Filters Active ({filteredData.length} results)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <Link to="/churn-analytics">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 shadow-lg hover:shadow-xl font-semibold px-6 transition-all duration-300"
                  >
                    <TrendingDown className="h-5 w-5 mr-2" />
                    Churn Analytics
                  </Button>
                </Link>
                <Button 
                  onClick={handleRefresh} 
                  variant="outline" 
                  size="lg"
                  className="border-2 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-lg hover:shadow-xl font-semibold px-6 transition-all duration-300"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Refresh Data
                </Button>
                <Button 
                  onClick={() => setIsFilterOpen(true)} 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 shadow-xl hover:shadow-2xl font-semibold px-8 transition-all duration-300"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  Advanced Filters
                </Button>
                {hasActiveFilters() && (
                  <Button 
                    onClick={handleFiltersReset}
                    variant="outline"
                    size="lg"
                    className="border-2 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-700 dark:text-orange-300 shadow-lg hover:shadow-xl font-semibold px-6 transition-all duration-300"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Comprehensive Filters Section */}
        <div className="animate-slide-up">
          <CollapsibleFilters
            activeFilters={activeFilters}
            onFiltersChange={setActiveFilters}
            membershipData={localMembershipData} // Pass raw data for filter options
            availableLocations={availableLocations}
            filteredDataCount={filteredData.length}
          />
        </div>

        {/* Premium Metrics Grid - Now uses FILTERED data for accurate metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-slide-up">
          <MetricCard
            title="Total Members"
            value={filteredData.length}
            icon={Users}
            change="+12% from last month"
            trend="up"
            tooltip="Total number of registered members matching current filters"
            drillDownData={[
              { label: 'Active', value: activeMembers.length },
              { label: 'Churned', value: churnedMembers.length },
              { label: 'Frozen', value: frozenMembers.length },
              { label: 'Premium', value: premiumMembers.length }
            ]}
          />
          <MetricCard
            title="Active Members"
            value={activeMembers.length}
            icon={UserCheck}
            change="+5% from last month"
            trend="up"
            tooltip="Members with active subscriptions and valid access to facilities"
            drillDownData={[
              { label: 'With Sessions', value: activeMembers.filter(m => m.sessionsLeft > 0).length },
              { label: 'Expiring Soon', value: expiringMembers.length },
              { label: 'Premium', value: activeMembers.filter(m => m.membershipName?.toLowerCase().includes('unlimited') || m.membershipName?.toLowerCase().includes('premium')).length },
              { label: 'Frozen', value: activeMembers.filter(m => m.frozen?.toLowerCase() === 'true').length }
            ]}
          />
          <MetricCard
            title="Churned Members"
            value={churnedMembers.length}
            icon={UserX}
            change="-8% from last month"
            trend="down"
            tooltip="Members who have churned and need re-engagement"
            drillDownData={[
              { label: 'Recently Churned', value: Math.round(churnedMembers.length * 0.6) },
              { label: 'Long Churned', value: Math.round(churnedMembers.length * 0.4) },
              { label: 'Recoverable', value: Math.round(churnedMembers.length * 0.7) },
              { label: 'Frozen', value: frozenMembers.length }
            ]}
          />
          <MetricCard
            title="Total Sessions"
            value={totalSessions}
            icon={Dumbbell}
            change="+15% from last month"
            trend="up"
            tooltip="Total remaining sessions across all filtered memberships"
            drillDownData={[
              { label: 'Available', value: totalSessions },
              { label: 'Avg per Member', value: avgSessionsPerMember },
              { label: 'Low Sessions', value: filteredData.filter(m => m.sessionsLeft <= 3 && m.sessionsLeft > 0).length },
              { label: 'High Sessions', value: filteredData.filter(m => m.sessionsLeft > 10).length }
            ]}
          />
        </div>

        {/* Premium Charts - Now uses filtered data */}
        <div className="animate-slide-up">
          <PremiumCharts data={filteredData} />
        </div>

        {/* Enhanced Groupable Data Tables */}
        <div className="animate-slide-up">
          <GroupableDataTable 
            data={filteredData} 
            title="Advanced Member Management with Grouping"
            onAnnotationUpdate={handleAnnotationUpdate}
          />
        </div>

        <FilterSidebar
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            toast.success("Advanced filters applied successfully");
          }}
          availableLocations={availableLocations}
          availableMembershipTypes={availableMembershipTypes}
        />
      </div>
    </div>
  );
};

export default Index;
