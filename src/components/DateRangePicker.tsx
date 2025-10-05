import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
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
    <div className={className}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">Date Range</span>
          {(value.start || value.end) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDates}
              className="h-4 w-4 p-0 text-slate-400 hover:text-red-500"
            >
              <X className="h-2.5 w-2.5" />
            </Button>
          )}
        </div>
        
        <div className="space-y-1">
          <div>
            <Label htmlFor="start-date" className="text-xs text-slate-500">From</Label>
            <Input
              id="start-date"
              type="date"
              value={value.start}
              onChange={handleStartDateChange}
              className="text-xs h-7"
            />
          </div>
          <div>
            <Label htmlFor="end-date" className="text-xs text-slate-500">To</Label>
            <Input
              id="end-date"
              type="date"
              value={value.end}
              onChange={handleEndDateChange}
              className="text-xs h-7"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickRange(7)}
            className="text-xs h-6 px-1"
          >
            7d
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickRange(30)}
            className="text-xs h-6 px-1"
          >
            30d
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickRange(90)}
            className="text-xs h-6 px-1"
          >
            90d
          </Button>
        </div>
      </div>
    </div>
  );
};