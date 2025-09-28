import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
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
  Sparkles
} from "lucide-react";

interface GlobalFilterPanelProps {
  data: any[];
  className?: string;
}

export const GlobalFilterPanel = ({ data, className }: GlobalFilterPanelProps) => {
  const { filters, updateFilter, clearAllFilters, hasActiveFilters, getActiveFilterCount } = useFilters();
  const [isOpen, setIsOpen] = useState(false);

  if (!data || data.length === 0) {
    return null;
  }

  // Extract unique values from data safely
  const uniqueStatuses = [...new Set(data.map(item => item?.status).filter(Boolean))];
  const uniqueLocations = [...new Set(data.map(item => item?.location).filter(Boolean))];
  const uniqueMembershipTypes = [...new Set(data.map(item => item?.membershipName).filter(Boolean))];

  const handleArrayFilter = (key: 'status' | 'location' | 'membershipType', value: string) => {
    try {
      const currentArray = filters[key] as string[] || [];
      const isSelected = currentArray.includes(value);
      
      if (isSelected) {
        updateFilter(key, currentArray.filter(item => item !== value));
      } else {
        updateFilter(key, [...currentArray, value]);
      }
    } catch (error) {
      console.warn('Filter update error:', error);
    }
  };

  return (
    <div className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="relative overflow-hidden backdrop-blur-xl bg-white/95 border-white/20 shadow-2xl">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5 animate-pulse opacity-50"></div>
          
          <CollapsibleTrigger asChild>
            <CardHeader className="relative cursor-pointer hover:bg-white/50 transition-all duration-300 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur-md opacity-30 animate-pulse"></div>
                    <div className="relative p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-xl">
                      <Filter className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                      Global Filters
                      <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
                    </CardTitle>
                    <p className="text-slate-600 font-medium">
                      {hasActiveFilters() 
                        ? `${getActiveFilterCount()} active filter${getActiveFilterCount() > 1 ? 's' : ''} applied` 
                        : 'Click to apply advanced filters across all data'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasActiveFilters() && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 shadow-lg">
                        {getActiveFilterCount()} Active
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAllFilters();
                        }}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-200"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-slate-700" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-700" />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="relative p-6 space-y-6">
              
              {/* Search Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Search className="h-4 w-4 text-indigo-600" />
                  Global Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search members, emails, IDs, membership types..."
                    value={filters.search || ''}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="pl-10 backdrop-blur-sm bg-white/90 border-indigo-200 focus:border-indigo-400 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Status Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    Member Status
                  </Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uniqueStatuses.map(status => (
                      <div key={status} className="flex items-center space-x-2 p-2 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                        <Checkbox
                          id={`status-${status}`}
                          checked={(filters.status || []).includes(status)}
                          onCheckedChange={() => handleArrayFilter('status', status)}
                          className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                        <Label htmlFor={`status-${status}`} className="text-sm flex items-center justify-between w-full cursor-pointer">
                          <span className="font-medium">{status}</span>
                          <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                            {data.filter(m => m?.status === status).length}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    Location
                  </Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uniqueLocations.map(location => (
                      <div key={location} className="flex items-center space-x-2 p-2 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                        <Checkbox
                          id={`location-${location}`}
                          checked={(filters.location || []).includes(location)}
                          onCheckedChange={() => handleArrayFilter('location', location)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <Label htmlFor={`location-${location}`} className="text-sm flex items-center justify-between w-full cursor-pointer">
                          <span className="font-medium">{location}</span>
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {data.filter(m => m?.location === location).length}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Membership Type Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    Membership Type
                  </Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uniqueMembershipTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2 p-2 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                        <Checkbox
                          id={`membership-${type}`}
                          checked={(filters.membershipType || []).includes(type)}
                          onCheckedChange={() => handleArrayFilter('membershipType', type)}
                          className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <Label htmlFor={`membership-${type}`} className="text-sm flex items-center justify-between w-full cursor-pointer">
                          <span className="font-medium truncate">{type}</span>
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            {data.filter(m => m?.membershipName === type).length}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  Date Range Filter
                </Label>
                <DateRangePicker
                  value={filters.dateRange || { start: '', end: '' }}
                  onChange={(dateRange) => updateFilter('dateRange', dateRange)}
                  className="w-full"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <div className="text-sm text-slate-600">
                  Showing {data.length} total members
                </div>
                {hasActiveFilters() && (
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="bg-white/80 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};