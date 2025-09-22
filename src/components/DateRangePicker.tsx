import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, X } from "lucide-react";
import { DateRange } from "@/contexts/FilterContext";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  className?: string;
}

export const DateRangePicker = ({ value, onChange, className }: DateRangePickerProps) => {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      start: e.target.value,
      end: value.end
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      start: value.start,
      end: e.target.value
    });
  };

  const clearDates = () => {
    onChange({
      start: '',
      end: ''
    });
  };

  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    onChange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          <Label className="text-sm font-medium">Date Range</Label>
          {(value.start || value.end) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDates}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="start-date" className="text-xs">From</Label>
            <Input
              id="start-date"
              type="date"
              value={value.start}
              onChange={handleStartDateChange}
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="end-date" className="text-xs">To</Label>
            <Input
              id="end-date"
              type="date"
              value={value.end}
              onChange={handleEndDateChange}
              className="text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickRange(7)}
            className="text-xs h-7"
          >
            Last 7 days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickRange(30)}
            className="text-xs h-7"
          >
            Last 30 days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickRange(90)}
            className="text-xs h-7"
          >
            Last 90 days
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};