import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, formatDate, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, month, year, addMonths, subMonths } from 'date-fns';
import { cn } from '../../lib/utils';

const Calendar = React.forwardRef(
  ({ className, selected, onSelect, minDate, maxDate, ...props }, ref) => {
    const [displayDate, setDisplayDate] = React.useState(
      selected ? new Date(selected) : new Date()
    );

    const viewMonth = month(displayDate);
    const viewYear = year(displayDate);

    const firstOfMonth = startOfMonth(new Date(viewYear, viewMonth));
    const lastOfMonth = endOfMonth(new Date(viewYear, viewMonth));

    const days = eachDayOfInterval({
      start: startOfWeek(firstOfMonth, { weekStartsOn: 1 }),
      end: endOfWeek(lastOfMonth, { weekStartsOn: 1 }),
    });

    const isDisabled = (date) => {
      if (minDate && date < new Date(minDate)) return true;
      if (maxDate && date > new Date(maxDate)) return true;
      return false;
    };

    const isSelected = (date) => {
      if (!selected) return false;
      return format(date, 'yyyy-MM-dd') === format(new Date(selected), 'yyyy-MM-dd');
    };

    const isToday = (date) => {
      return format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    };

    const isSameMonth = (date) => {
      return format(date, 'yyyy-MM') === format(new Date(viewYear, viewMonth), 'yyyy-MM');
    };

    const handleDayClick = (date) => {
      if (!isDisabled(date)) {
        onSelect?.(date);
      }
    };

    return (
      <div ref={ref} className={cn('p-4', className)} {...props}>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setDisplayDate((d) => subMonths(d, 1))}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            aria-label="Previous month"
            disabled={!displayDate}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center text-lg font-medium">
            {formatDate(new Date(viewYear, viewMonth), 'MMMM yyyy')}
          </div>
          <button
            type="button"
            onClick={() => setDisplayDate((d) => addMonths(d, 1))}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            aria-label="Next month"
            disabled={!displayDate}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid w-full grid-cols-7 text-center text-sm">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div
          className="grid w-full grid-cols-7"
          role="grid"
          aria-label="Calendar"
        >
          {days.map((day) => {
            const disabled = isDisabled(day);
            const selected = isSelected(day);
            const today = isToday(day);
            const outsideMonth = !isSameMonth(day);

            return (
              <button
                key={format(day, 'yyyy-MM-dd')}
                type="button"
                role="gridcell"
                onClick={() => handleDayClick(day)}
                disabled={disabled || outsideMonth}
                aria-selected={selected || undefined}
                aria-disabled={disabled || undefined}
                className={cn(
                  'aspect-square rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  disabled && 'pointer-events-none opacity-50 line-through',
                  outsideMonth && 'text-muted-foreground',
                  today && 'border border-primary/50',
                  selected &&
                    'bg-primary text-primary-foreground shadow-sm',
                  !selected && !disabled && !outsideMonth
                    ? 'bg-background hover:bg-accent'
                    : ''
                )}
              >
                {formatDate(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
Calendar.displayName = 'Calendar';

export { Calendar };
