import React from 'react';
import { CalendarRange } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface ChartDateRangePickerProps {
  value?: DateRange;
  onChange: (value: DateRange | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  label?: string;
  className?: string;
}

const formatRangeLabel = (range?: DateRange) => {
  if (!range?.from && !range?.to) {
    return 'All time';
  }

  if (range.from && !range.to) {
    return `${format(range.from, 'LLL d, yyyy')} – …`;
  }

  if (range.from && range.to) {
    return `${format(range.from, 'LLL d, yyyy')} – ${format(range.to, 'LLL d, yyyy')}`;
  }

  return 'Select range';
};

const ChartDateRangePicker: React.FC<ChartDateRangePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  label = 'Date range',
  className,
}) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    onChange(range);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          type="button"
          className={cn('flex items-center gap-2', className)}
        >
          <CalendarRange className="h-4 w-4" />
          <span className="hidden sm:inline">{label}:</span>
          <span className="text-xs sm:text-sm font-medium">
            {formatRangeLabel(value)}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={value}
          onSelect={handleSelect}
          defaultMonth={value?.from ?? value?.to ?? maxDate ?? new Date()}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
        />
        <div className="flex items-center justify-between px-3 py-2 border-t">
          <Button variant="ghost" size="sm" type="button" onClick={() => handleSelect(undefined)}>
            Clear
          </Button>
          <Button variant="default" size="sm" type="button" onClick={() => setOpen(false)}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ChartDateRangePicker;
