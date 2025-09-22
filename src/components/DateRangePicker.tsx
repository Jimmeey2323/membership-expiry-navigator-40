import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, X, Calendar as CalendarIconLucide } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "@/contexts/FilterContext";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  className?: string;
}

export const DateRangePicker = ({ value, onChange, className }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    value.start ? new Date(value.start) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    value.end ? new Date(value.end) : undefined
  );

  const formatDate = (date: Date | undefined) => {
    return date ? format(date, "yyyy-MM-dd") : "";
  };

  const handleDateSelect = (date: Date | undefined, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartDate(date);
      onChange({
        start: formatDate(date),
        end: value.end
      });
    } else {
      setEndDate(date);
      onChange({
        start: value.start,
        end: formatDate(date)
      });
    }
  };

  const handleQuickSelect = (range: string) => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date();

    switch (range) {
      case 'today':
        start = new Date();
        end = new Date();
        break;
      case 'yesterday':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        end = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last7days':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90days':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'next30days':
        start = new Date();
        end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'next90days':
        start = new Date();
        end = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        return;
    }

    setStartDate(start);
    setEndDate(end);
    onChange({
      start: formatDate(start),
      end: formatDate(end)
    });
    setIsOpen(false);
  };

  const clearDates = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onChange({ start: '', end: '' });
  };

  const hasDateRange = value.start || value.end;
  const displayText = hasDateRange 
    ? `${value.start || 'Start'} - ${value.end || 'End'}`
    : 'Select date range';

  return (
    <div className={className}>
      <Label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
        <CalendarIconLucide className="h-4 w-4" />
        Date Range Filter
      </Label>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-between text-left font-normal ${
              hasDateRange ? 'bg-primary/5 border-primary/20' : ''
            }`}
          >
            <span className={hasDateRange ? 'text-foreground' : 'text-muted-foreground'}>
              {displayText}
            </span>
            <div className="flex items-center gap-2">
              {hasDateRange && (
                <X 
                  className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    clearDates();
                  }}
                />
              )}
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 space-y-6">
              
              {/* Quick Date Ranges */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Quick Ranges</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Today', value: 'today' },
                    { label: 'Yesterday', value: 'yesterday' },
                    { label: 'Last 7 days', value: 'last7days' },
                    { label: 'Last 30 days', value: 'last30days' },
                    { label: 'Last 90 days', value: 'last90days' },
                    { label: 'This Month', value: 'thisMonth' },
                    { label: 'Last Month', value: 'lastMonth' },
                    { label: 'This Year', value: 'thisYear' },
                    { label: 'Next 30 days', value: 'next30days' },
                    { label: 'Next 90 days', value: 'next90days' },
                  ].map((range) => (
                    <Button
                      key={range.value}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 hover:bg-primary/10"
                      onClick={() => handleQuickSelect(range.value)}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Manual Date Inputs */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Custom Range</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                    <Input
                      type="date"
                      value={value.start}
                      onChange={(e) => onChange({ ...value, start: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">End Date</Label>
                    <Input
                      type="date"
                      value={value.end}
                      onChange={(e) => onChange({ ...value, end: e.target.value })}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-3 border-t">
                <Button variant="outline" size="sm" onClick={clearDates}>
                  Clear
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setIsOpen(false)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Apply
                </Button>
              </div>

              {/* Active Range Display */}
              {hasDateRange && (
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Active Range:</Label>
                    <Badge variant="secondary" className="text-xs">
                      {value.start || 'Start'} → {value.end || 'End'}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
};