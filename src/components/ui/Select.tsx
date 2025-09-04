import React from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    options = [], 
    placeholder,
    id, 
    children,
    ...props 
  }, ref) => {
    // Solo usar el ID si se proporciona, no generar uno aleatorio
    const selectId = id;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={selectId} 
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          className={cn(
            "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {/* Si hay options, renderizarlas */}
          {options && options.length > 0 && options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {/* Si hay children (opciones manuales), renderizarlas */}
          {children}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-900">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
