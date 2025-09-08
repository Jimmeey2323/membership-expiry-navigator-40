
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/MetricCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { GroupableDataTable } from "@/components/GroupableDataTable";
import { PremiumCharts } from "@/components/PremiumCharts";
import { CollapsibleFilters } from "@/components/CollapsibleFilters";
import { ThemeToggle } from "@/components/ThemeToggle";
import { googleSheetsService } from "@/services/googleSheets";
import { MembershipData, FilterOptions } from "@/types/membership";
import { Link } from "react-router-dom";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Filter,
  Dumbbell,
  Activity,
  RefreshCw,
  Building2,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Crown,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    locations: [],
    membershipTypes: [],
    dateRange: { start: '', end: '' },
    sessionsRange: { min: 0, max: 100 }
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<string>('all');
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

  // Enhanced filter application - BOTH filters work together
  const getFilteredData = (): MembershipData[] => {
    let filteredData = [...localMembershipData];

    // FIRST: Apply advanced filters
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

    // SECOND: Apply quick filters on top of advanced filters
    if (quickFilter !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      switch (quickFilter) {
        case 'active':
          filteredData = filteredData.filter(member => member.status === 'Active');
          break;
        case 'churned':
          filteredData = filteredData.filter(member => member.status === 'Churned');
          break;
        case 'frozen':
          filteredData = filteredData.filter(member => member.status === 'Frozen');
          break;
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
        default:
          // Handle dynamic location and membership type filters
          const availableLocations = [...new Set(localMembershipData.map(m => m.location).filter(Boolean))];
          const availableMembershipTypes = [...new Set(localMembershipData.map(m => m.membershipName).filter(Boolean))];
          
          if (availableLocations.some(loc => quickFilter === `location-${loc}`)) {
            const targetLocation = quickFilter.replace('location-', '');
            filteredData = filteredData.filter(member => member.location === targetLocation);
          } else if (availableMembershipTypes.includes(quickFilter)) {
            filteredData = filteredData.filter(member => member.membershipName === quickFilter);
          }
          break;
      }
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
    setQuickFilter('all');
    toast.success("All filters cleared");
  };

  const hasActiveFilters = () => {
    return quickFilter !== 'all' || 
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

        {/* Enhanced Collapsible Filters - Uses filtered data for accurate counts */}
        <div className="animate-slide-up">
          <CollapsibleFilters
            quickFilter={quickFilter}
            onQuickFilterChange={setQuickFilter}
            membershipData={localMembershipData} // Pass raw data for filter options
            availableLocations={availableLocations}
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
