import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Search,
  Calendar,
  MapPin,
  Users,
  Activity
} from "lucide-react";

interface FilterState {
  search: string;
  status: string[];
  location: string[];
  membershipType: string[];
  expiryRange: string;
  sessionsRange: string;
  hasAnnotations: boolean;
}

interface TopFilterSectionProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  data: any[];
}

export const TopFilterSection = ({ filters, onFiltersChange, data }: TopFilterSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Extract unique values for filter options
  const uniqueStatuses = [...new Set(data.map(item => item.status).filter(Boolean))];
  const uniqueLocations = [...new Set(data.map(item => item.location).filter(Boolean))];
  const uniqueMembershipTypes = [...new Set(data.map(item => item.membershipName).filter(Boolean))];

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const addArrayFilter = (key: 'status' | 'location' | 'membershipType', value: string) => {
    if (!filters[key].includes(value)) {
      updateFilter(key, [...filters[key], value]);
    }
  };

  const removeArrayFilter = (key: 'status' | 'location' | 'membershipType', value: string) => {
    updateFilter(key, filters[key].filter(item => item !== value));
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      status: [],
      location: [],
      membershipType: [],
      expiryRange: 'all',
      sessionsRange: 'all',
      hasAnnotations: false
    });
  };

  const hasActiveFilters = () => {
    return filters.search || 
           filters.status.length > 0 || 
           filters.location.length > 0 || 
           filters.membershipType.length > 0 || 
           filters.expiryRange !== 'all' || 
           filters.sessionsRange !== 'all' || 
           filters.hasAnnotations;
  };

  const activeFilterCount = [
    ...filters.status,
    ...filters.location,
    ...filters.membershipType,
    filters.expiryRange !== 'all' ? 1 : 0,
    filters.sessionsRange !== 'all' ? 1 : 0,
    filters.hasAnnotations ? 1 : 0
  ].length + (filters.search ? 1 : 0);

  return (
    <div className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="backdrop-blur-xl bg-white/95 border-white/30 shadow-lg">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-white/50 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Filter className="h-5 w-5 text-slate-600" />
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    Advanced Filters
                  </CardTitle>
                  {hasActiveFilters() && (
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                      {activeFilterCount} active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasActiveFilters() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAllFilters();
                      }}
                      className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    >
                      Clear all
                    </Button>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-600" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {/* Enhanced Search Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search members, emails, IDs..."
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="pl-10 h-10 backdrop-blur-sm bg-white/95 border-white/50 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/50 transition-all duration-200 placeholder:text-slate-400"
                  />
                  {filters.search && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateFilter('search', '')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Status
                  </label>
                  <Select onValueChange={(value) => addArrayFilter('status', value)}>
                    <SelectTrigger className="backdrop-blur-sm bg-white/95 border-white/50 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/50 transition-all duration-200">
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {filters.status.map(status => (
                      <Badge key={status} variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors">
                        {status}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-indigo-200"
                          onClick={() => removeArrayFilter('status', status)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </label>
                  <Select onValueChange={(value) => addArrayFilter('location', value)}>
                    <SelectTrigger className="backdrop-blur-sm bg-white/95 border-white/50 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/50 transition-all duration-200">
                      <SelectValue placeholder="Select location..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueLocations.map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {filters.location.map(location => (
                      <Badge key={location} variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors">
                        {location}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-emerald-200"
                          onClick={() => removeArrayFilter('location', location)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Membership Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Membership Type
                  </label>
                  <Select onValueChange={(value) => addArrayFilter('membershipType', value)}>
                    <SelectTrigger className="backdrop-blur-sm bg-white/95 border-white/50 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/50 transition-all duration-200">
                      <SelectValue placeholder="Select membership..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueMembershipTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {filters.membershipType.map(type => (
                      <Badge key={type} variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors">
                        {type}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-purple-200"
                          onClick={() => removeArrayFilter('membershipType', type)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Expiry Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Expiry Range
                  </label>
                  <Select value={filters.expiryRange} onValueChange={(value) => updateFilter('expiryRange', value)}>
                    <SelectTrigger className="backdrop-blur-sm bg-white/80 border-white/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="expiring-soon">Expiring Soon (30 days)</SelectItem>
                      <SelectItem value="expiring-this-month">This Month</SelectItem>
                      <SelectItem value="active">Active (Not Expiring)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sessions Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Sessions Remaining</label>
                  <Select value={filters.sessionsRange} onValueChange={(value) => updateFilter('sessionsRange', value)}>
                    <SelectTrigger className="backdrop-blur-sm bg-white/80 border-white/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                      <SelectItem value="high">10+ Sessions</SelectItem>
                      <SelectItem value="medium">5-10 Sessions</SelectItem>
                      <SelectItem value="low">1-5 Sessions</SelectItem>
                      <SelectItem value="none">No Sessions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Has Annotations Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Special Filters</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.hasAnnotations}
                      onChange={(e) => updateFilter('hasAnnotations', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-slate-600">Has Notes/Comments</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};