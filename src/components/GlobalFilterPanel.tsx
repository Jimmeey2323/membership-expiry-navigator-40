import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangePicker } from "@/components/DateRangePicker";
import { useFilters } from "@/contexts/FilterContext";
import { 
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
    <div className={`${className} flex flex-col h-full`}>
      {/* Enhanced Header */}
      <div className="pb-3 mb-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50 -mx-4 px-4 pt-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            Smart Filters
            {hasActiveFilters() && (
              <Badge className="bg-indigo-500 text-white text-xs h-5 px-2 rounded-full shadow-sm">
                {getActiveFilterCount()}
              </Badge>
            )}
          </h3>
          {hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 rounded-full transition-all duration-200"
              title="Clear all filters"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
              
              {/* Enhanced Search */}
              <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search members..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10 h-9 text-sm border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-lg bg-white shadow-sm transition-all duration-200"
                />
              </div>

              {/* Filter Sections */}
              <div className="flex-1 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent pr-2">
                
                {/* Status Grid */}
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                  <Label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Membership Status
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {uniqueStatuses.map(status => {
                      const count = data.filter(m => m?.status === status).length;
                      const isSelected = (filters.status || []).includes(status);
                      const statusConfig = {
                        'Active': { bg: 'bg-emerald-500', dot: 'bg-emerald-500' },
                        'Frozen': { bg: 'bg-blue-500', dot: 'bg-blue-500' },
                        'Trial': { bg: 'bg-purple-500', dot: 'bg-purple-500' },
                        'Pending': { bg: 'bg-orange-500', dot: 'bg-orange-500' },
                        'Suspended': { bg: 'bg-gray-500', dot: 'bg-gray-500' },
                        'Churned': { bg: 'bg-red-500', dot: 'bg-red-500' }
                      };
                      const config = statusConfig[status] || statusConfig['Churned'];
                      
                      return (
                        <button
                          key={status}
                          onClick={() => handleArrayFilter('status', status)}
                          className={`
                            flex flex-col items-center p-3 rounded-xl border transition-all text-center hover:scale-105 transform
                            ${isSelected 
                              ? `${config.bg} border-transparent text-white shadow-lg shadow-${config.bg.split('-')[1]}-200` 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md'
                            }
                          `}
                        >
                          <div className={`w-3 h-3 rounded-full mb-2 ${
                            isSelected ? 'bg-white shadow-sm' : config.dot
                          }`}></div>
                          <span className="text-xs font-semibold leading-tight">{status}</span>
                          <span className={`text-xs mt-1 px-1.5 py-0.5 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Locations */}
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                  <Label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Locations
                  </Label>
                  <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 scrollbar-thin scrollbar-thumb-slate-300">
                    {uniqueLocations.map(location => {
                      const count = data.filter(m => m?.location === location).length;
                      const isSelected = (filters.location || []).includes(location);
                      
                      return (
                        <button
                          key={location}
                          onClick={() => handleArrayFilter('location', location)}
                          className={`
                            w-full flex items-center justify-between p-2.5 border-b border-slate-200 last:border-0 transition-all text-left hover:transform hover:scale-[1.02]
                            ${isSelected 
                              ? 'bg-blue-500 text-white shadow-sm' 
                              : 'bg-white hover:bg-blue-50 text-slate-700'
                            }
                          `}
                        >
                          <span className="text-sm font-medium truncate flex-1">{location}</span>
                          <span className={`text-xs ml-2 px-2 py-1 rounded-full font-semibold ${
                            isSelected 
                              ? 'bg-white/20 text-white' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Membership Types */}
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                  <Label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Membership Types
                  </Label>
                  <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 scrollbar-thin scrollbar-thumb-slate-300">
                    {uniqueMembershipTypes.map(type => {
                      const count = data.filter(m => m?.membershipName === type).length;
                      const isSelected = (filters.membershipType || []).includes(type);
                      
                      return (
                        <button
                          key={type}
                          onClick={() => handleArrayFilter('membershipType', type)}
                          className={`
                            w-full flex items-center justify-between p-2.5 border-b border-slate-200 last:border-0 transition-all text-left hover:transform hover:scale-[1.02]
                            ${isSelected 
                              ? 'bg-purple-500 text-white shadow-sm' 
                              : 'bg-white hover:bg-purple-50 text-slate-700'
                            }
                          `}
                        >
                          <span className="text-sm font-medium truncate flex-1">{type}</span>
                          <span className={`text-xs ml-2 px-2 py-1 rounded-full font-semibold ${
                            isSelected 
                              ? 'bg-white/20 text-white' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                <Label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </Label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <DateRangePicker
                    value={filters.dateRange || { start: '', end: '' }}
                    onChange={(dateRange) => updateFilter('dateRange', dateRange)}
                    className="w-full"
                  />
                </div>
              </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 -mx-4 px-4 pb-2 rounded-b-lg">
        <div className="text-sm text-slate-600 text-center font-semibold">
          <span className="text-indigo-600">{data.length}</span> members total
        </div>
      </div>
    </div>
  );
};