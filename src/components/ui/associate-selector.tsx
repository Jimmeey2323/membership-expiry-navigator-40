import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ASSOCIATES = [
  "Akshay",
  "Zaheer", 
  "Vahishta",
  "Saniya",
  "Deesha",
  "Imran",
  "Shipra",
  "Nadiya",
  "Zahur"
] as const;

export type Associate = typeof ASSOCIATES[number];

interface AssociateSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

export const AssociateSelector = ({
  value,
  onValueChange,
  placeholder = "Select associate",
  required = false,
  className,
  label,
  error
}: AssociateSelectorProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} required={required}>
        <SelectTrigger className={cn(
          "w-full",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500"
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {ASSOCIATES.map((associate) => (
            <SelectItem key={associate} value={associate}>
              {associate}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export { ASSOCIATES };