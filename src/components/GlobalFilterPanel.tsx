import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { DateRangePicker } from "@/components/DateRangePicker";
import { useFilters } from "@/contexts/FilterContext";
import { 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Search,
  Users,
  MapPin,
  CreditCard,
  Calendar,
  Activity,
  Target,
  Settings,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Star
} from "lucide-react";

interface GlobalFilterPanelProps {
  data: any[];
  className?: string;
}

export const GlobalFilterPanel = ({ data, className }: GlobalFilterPanelProps) => {
  const { filters, updateFilter, clearAllFilters, hasActiveFilters, getActiveFilterCount } = useFilters();
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Extract unique values from data
  const uniqueStatuses = [...new Set(data.map(item => item.status).filter(Boolean))];
  const uniqueLocations = [...new Set(data.map(item => item.location).filter(Boolean))];
  const uniqueMembershipTypes = [...new Set(data.map(item => item.membershipName).filter(Boolean))];

  const handleArrayFilter = (key: 'status' | 'location' | 'membershipType', value: string) => {
    const currentArray = filters[key] as string[];
    const isSelected = currentArray.includes(value);
    
    if (isSelected) {
      updateFilter(key, currentArray.filter(item => item !== value));
    } else {
      updateFilter(key, [...currentArray, value]);
    }
  };

  const handleCustomFilter = (filterType: string) => {
    const currentFilters = filters.customFilters;
    const isActive = currentFilters.includes(filterType);
    
    if (isActive) {
      updateFilter('customFilters', currentFilters.filter(f => f !== filterType));
    } else {
      updateFilter('customFilters', [...currentFilters, filterType]);
    }
  };

  // Calculate metrics for filter options
  const activeMembers = data.filter(m => m.status === 'Active').length;
  const churnedMembers = data.filter(m => m.status === 'Churned').length;
  const highValueMembers = data.filter(m => parseFloat(m.paid) > 5000).length;
  const lowSessionMembers = data.filter(m => (m.sessionsLeft || 0) <= 3).length;
  
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const expiringThisWeek = data.filter(m => {
    if (!m.endDate) return false;
    const endDate = new Date(m.endDate);
    return endDate >= now && endDate <= nextWeek && m.status === 'Active';
  }).length;
  
  const expiringThisMonth = data.filter(m => {
    if (!m.endDate) return false;
    const endDate = new Date(m.endDate);
    return endDate >= now && endDate <= nextMonth && m.status === 'Active';
  }).length;

  const customFilterOptions = [
    { key: 'high-value', label: 'High Value (>₹5000)', count: highValueMembers, icon: TrendingUp, color: 'bg-emerald-100 text-emerald-800' },
    { key: 'low-sessions', label: 'Low Sessions (≤3)', count: lowSessionMembers, icon: AlertCircle, color: 'bg-red-100 text-red-800' },
    { key: 'expiring-week', label: 'Expiring This Week', count: expiringThisWeek, icon: Calendar, color: 'bg-orange-100 text-orange-800' },
    { key: 'expiring-month', label: 'Expiring This Month', count: expiringThisMonth, icon: Calendar, color: 'bg-amber-100 text-amber-800' },
    { key: 'premium', label: 'Premium Members (>₹10k)', count: data.filter(m => parseFloat(m.paid) > 10000).length, icon: Star, color: 'bg-purple-100 text-purple-800' },
  ];

  return (
    <div className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-white/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-lg opacity-50 animate-pulse" />
                    <div className="relative p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg">
                      <Filter className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      Global Filters
                      <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
                    </CardTitle>
                    <p className="text-slate-600 text-sm">
                      {hasActiveFilters() 
                        ? `${getActiveFilterCount()} filter(s) active - Comprehensive filtering` 
                        : 'Apply filters across all dashboard elements'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasActiveFilters() && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        {getActiveFilterCount()} Active
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAllFilters();
                        }}
                        className="h-8 px-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-600" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              
              {/* Search Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search members, emails, IDs, membership types..."
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="pl-10 backdrop-blur-sm bg-white/80 border-white/30"
                  />
                </div>
              </div>

              {/* Main Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Status Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Status
                  </Label>
                  <div className="space-y-2">
                    {uniqueStatuses.map(status => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.status.includes(status)}
                          onCheckedChange={() => handleArrayFilter('status', status)}
                        />
                        <Label htmlFor={`status-${status}`} className="text-sm flex items-center justify-between w-full">
                          <span>{status}</span>
                          <Badge variant="outline" className="text-xs">
                            {data.filter(m => m.status === status).length}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  <Select
                    value={filters.location.length > 0 ? filters.location[0] : ''}
                    onValueChange={(value) => updateFilter('location', value ? [value] : [])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Locations</SelectItem>
                      {uniqueLocations.map(location => (
                        <SelectItem key={location} value={location}>
                          {location} ({data.filter(m => m.location === location).length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filters.location.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {filters.location.map(location => (
                        <Badge key={location} variant="secondary" className="bg-blue-100 text-blue-800">
                          {location}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => handleArrayFilter('location', location)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Membership Type Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Membership Type
                  </Label>
                  <Select
                    value={filters.membershipType.length > 0 ? filters.membershipType[0] : ''}
                    onValueChange={(value) => updateFilter('membershipType', value ? [value] : [])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      {uniqueMembershipTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type} ({data.filter(m => m.membershipName === type).length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filters.membershipType.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {filters.membershipType.map(type => (
                        <Badge key={type} variant="secondary" className="bg-purple-100 text-purple-800">
                          {type}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => handleArrayFilter('membershipType', type)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Date Range Filter */}
              <DateRangePicker
                value={filters.dateRange}
                onChange={(dateRange) => updateFilter('dateRange', dateRange)}
              />

              {/* Advanced Filters Toggle */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Advanced Filters
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {hasActiveFilters() && (
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="text-red-600 hover:bg-red-50 hover:border-red-200"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>

              {/* Advanced Filters Section */}
              {showAdvanced && (
                <div className="space-y-6 p-4 bg-slate-50 rounded-lg border">
                  
                  {/* Sessions Range */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Sessions Range
                    </Label>
                    <div className="px-3">
                      <Slider
                        value={[filters.sessionsRange.min, filters.sessionsRange.max]}
                        onValueChange={([min, max]) => updateFilter('sessionsRange', { min, max })}
                        max={100}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>{filters.sessionsRange.min} sessions</span>
                        <span>{filters.sessionsRange.max} sessions</span>
                      </div>
                    </div>
                  </div>

                  {/* Expiry Range */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Expiry Range
                    </Label>
                    <Select
                      value={filters.expiryRange}
                      onValueChange={(value) => updateFilter('expiryRange', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Members</SelectItem>
                        <SelectItem value="expired">Already Expired</SelectItem>
                        <SelectItem value="expiring-week">Expiring This Week</SelectItem>
                        <SelectItem value="expiring-month">Expiring This Month</SelectItem>
                        <SelectItem value="future">Future Expiry (&gt;30 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Filter Chips */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Quick Filters
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {customFilterOptions.map(option => {
                        const isActive = filters.customFilters.includes(option.key);
                        const Icon = option.icon;
                        return (
                          <Button
                            key={option.key}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCustomFilter(option.key)}
                            className={`h-auto py-2 px-3 ${isActive ? option.color : 'hover:bg-slate-100'}`}
                          >
                            <Icon className="h-3 w-3 mr-2" />
                            {option.label}
                            <Badge variant="secondary" className="ml-2">
                              {option.count}
                            </Badge>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Special Toggles */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">Special Filters</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hasAnnotations"
                          checked={filters.hasAnnotations}
                          onCheckedChange={(checked) => updateFilter('hasAnnotations', !!checked)}
                        />
                        <Label htmlFor="hasAnnotations" className="text-sm">
                          Has Notes/Comments/Tags
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="highValue"
                          checked={filters.highValue}
                          onCheckedChange={(checked) => updateFilter('highValue', !!checked)}
                        />
                        <Label htmlFor="highValue" className="text-sm">
                          High Value Members (&gt;₹5000)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="lowSessions"
                          checked={filters.lowSessions}
                          onCheckedChange={(checked) => updateFilter('lowSessions', !!checked)}
                        />
                        <Label htmlFor="lowSessions" className="text-sm">
                          Low Sessions (≤3)
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};