import React from 'react';
import { CalendarRange } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

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
    return null;
  }

  if (range.from && !range.to) {
    return `${format(range.from, 'LLL d, yyyy')} – …`;
  }

  if (range.from && range.to) {
    return `${format(range.from, 'LLL d, yyyy')} – ${format(range.to, 'LLL d, yyyy')}`;
  }

  return null;
};

const ChartDateRangePicker: React.FC<ChartDateRangePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const { t } = useLanguage();

  const handleSelect = (range: DateRange | undefined) => {
    onChange(range);
  };

  const rangeLabel =
    formatRangeLabel(value) ||
    (value?.from && value?.to
      ? `${format(value.from, 'LLL d, yyyy')} – ${format(value.to, 'LLL d, yyyy')}`
      : value?.from
      ? `${format(value.from, 'LLL d, yyyy')} – …`
      : t('therapistDashboard.range.allTime'));

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
          <span className="hidden sm:inline">{label || t('therapistDashboard.range.label')}:</span>
          <span className="text-xs sm:text-sm font-medium">
            {rangeLabel || t('therapistDashboard.range.select')}
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
            {t('therapistDashboard.range.clear')}
          </Button>
          <Button variant="default" size="sm" type="button" onClick={() => setOpen(false)}>
            {t('therapistDashboard.range.apply')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ChartDateRangePicker;
