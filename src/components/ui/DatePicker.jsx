import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from './Calendar';
import { cn } from '../../lib/utils';

const DatePicker = React.forwardRef(
  ({ className, value, onValueChange, placeholder, minDate, maxDate, open, onOpenChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(!!open);
    const [displayValue, setDisplayValue] = React.useState(value ? formatDate(value) : '');
    const [focusedDate, setFocusedDate] = React.useState(value ? new Date(value) : new Date());

    const handleValueChange = (date) => {
      setDisplayValue(formatDate(date));
      setIsOpen(false);
      onValueChange?.(date);
    };

    const handleInputChange = (e) => {
      const date = new Date(e.target.value);
      if (!isNaN(date.getTime())) {
        setDisplayValue(e.target.value);
        onValueChange?.(date);
      }
    };

    return (
      <div className={cn('relative inline-block w-full', className)} ref={ref} {...props}>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={displayValue || ''}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:text-transparent file:mr-2 file:pt-0 file:pb-0 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              minDate ? 'min:' + minDate : '',
              maxDate ? 'max:' + maxDate : ''
            )}
            min={minDate}
            max={maxDate}
          />
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Open calendar picker"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-64 rounded-md border bg-popover p-1 text-popover-foreground shadow-lg outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Calendar
              selected={value || focusedDate}
              onSelect={handleValueChange}
              minDate={minDate}
              maxDate={maxDate}
            />
          </div>
        )}
      </div>
    );
  }
);
DatePicker.displayName = 'DatePicker';

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

export { DatePicker };
