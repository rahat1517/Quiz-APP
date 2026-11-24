import * as React from 'react';
import { cn } from '../../lib/utils';

const Field = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('space-y-2 w-full', className)}
      {...props}
    />
  )
);
Field.displayName = 'Field';

const FieldLabel = React.forwardRef(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  )
);
FieldLabel.displayName = 'FieldLabel';

const FieldInput = React.forwardRef(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:text-transparent file:mr-2 file:pt-0 file:pb-0 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
FieldInput.displayName = 'FieldInput';

const FieldDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);
FieldDescription.displayName = 'FieldDescription';

const FieldError = React.forwardRef(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}
    />
  )
);
FieldError.displayName = 'FieldError';

export { Field, FieldLabel, FieldInput, FieldDescription, FieldError };
