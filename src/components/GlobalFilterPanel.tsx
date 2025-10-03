import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangePicker } from "@/components/DateRangePicker";
import { AITagsFilter } from "@/components/AITagsFilter";
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

              {/* Enhanced Filter Grid with better organization */}
              <div className="space-y-8">
                
                {/* Quick Status Filters - More prominent display */}
                <div className="space-y-4">
                  <Label className="text-lg font-bold text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Users className="h-5 w-5 text-emerald-700" />
                    </div>
                    Member Status
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {uniqueStatuses.map(status => {
                      const count = data.filter(m => m?.status === status).length;
                      const isSelected = (filters.status || []).includes(status);
                      const statusConfig = {
                        'Active': { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-white', hoverBg: 'hover:bg-emerald-600' },
                        'Frozen': { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-white', hoverBg: 'hover:bg-blue-600' },
                        'Trial': { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-white', hoverBg: 'hover:bg-purple-600' },
                        'Pending': { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-white', hoverBg: 'hover:bg-orange-600' },
                        'Suspended': { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-white', hoverBg: 'hover:bg-gray-600' },
                        'Churned': { bg: 'bg-red-500', border: 'border-red-500', text: 'text-white', hoverBg: 'hover:bg-red-600' }
                      };
                      const config = statusConfig[status] || statusConfig['Churned'];
                      
                      return (
                        <button
                          key={status}
                          onClick={() => handleArrayFilter('status', status)}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-xl
                            ${isSelected 
                              ? `${config.bg} ${config.border} ${config.text} shadow-lg` 
                              : `bg-white border-gray-200 text-gray-700 hover:border-gray-300 shadow-md`
                            }
                            ${isSelected ? '' : config.hoverBg}
                          `}
                        >
                          <div className="text-center space-y-2">
                            <div className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                              {count}
                            </div>
                            <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                              {status}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Secondary Filters Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Location Filter - Improved */}
                  <div className="space-y-4">
                    <Label className="text-lg font-bold text-slate-800 flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="h-5 w-5 text-blue-700" />
                      </div>
                      Locations
                    </Label>
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {uniqueLocations.map(location => {
                          const count = data.filter(m => m?.location === location).length;
                          const isSelected = (filters.location || []).includes(location);
                          
                          return (
                            <div key={location} className={`
                              flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
                              ${isSelected 
                                ? 'bg-blue-500 border-blue-500 text-white shadow-md' 
                                : 'bg-white border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                              }
                            `} onClick={() => handleArrayFilter('location', location)}>
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  checked={isSelected}
                                  className="data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-blue-500"
                                />
                                <span className="font-medium text-sm">{location}</span>
                              </div>
                              <Badge 
                                variant={isSelected ? "outline" : "secondary"} 
                                className={`text-xs font-bold ${
                                  isSelected 
                                    ? 'bg-white text-blue-500 border-white' 
                                    : 'bg-blue-100 text-blue-700 border-blue-200'
                                }`}
                              >
                                {count}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>

                  {/* Membership Type Filter - Improved */}
                  <div className="space-y-4">
                    <Label className="text-lg font-bold text-slate-800 flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <CreditCard className="h-5 w-5 text-purple-700" />
                      </div>
                      Membership Types
                    </Label>
                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {uniqueMembershipTypes.map(type => {
                          const count = data.filter(m => m?.membershipName === type).length;
                          const isSelected = (filters.membershipType || []).includes(type);
                          
                          return (
                            <div key={type} className={`
                              flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
                              ${isSelected 
                                ? 'bg-purple-500 border-purple-500 text-white shadow-md' 
                                : 'bg-white border-purple-200 hover:border-purple-300 hover:bg-purple-50'
                              }
                            `} onClick={() => handleArrayFilter('membershipType', type)}>
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  checked={isSelected}
                                  className="data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-purple-500"
                                />
                                <span className="font-medium text-sm truncate max-w-[200px]">{type}</span>
                              </div>
                              <Badge 
                                variant={isSelected ? "outline" : "secondary"} 
                                className={`text-xs font-bold ${
                                  isSelected 
                                    ? 'bg-white text-purple-500 border-white' 
                                    : 'bg-purple-100 text-purple-700 border-purple-200'
                                }`}
                              >
                                {count}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>

                {/* AI Tags Filter - Enhanced */}
                <div className="space-y-4">
                  <Label className="text-lg font-bold text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Sparkles className="h-5 w-5 text-pink-700" />
                    </div>
                    AI-Generated Insights
                  </Label>
                  <Card className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
                    <AITagsFilter
                      data={data}
                      selectedTags={filters.aiTags || []}
                      onTagsChange={(tags) => updateFilter('aiTags', tags)}
                      className="border-0 shadow-none bg-transparent"
                    />
                  </Card>
                </div>

                {/* Date Range Filter - Enhanced */}
                <div className="space-y-4">
                  <Label className="text-lg font-bold text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-indigo-700" />
                    </div>
                    Date Filters
                  </Label>
                  <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
                    <DateRangePicker
                      value={filters.dateRange || { start: '', end: '' }}
                      onChange={(dateRange) => updateFilter('dateRange', dateRange)}
                      className="w-full"
                    />
                  </Card>
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