import React from 'react';

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }>(
  ({ children, className, ...props }, ref) => (
    <button ref={ref} className={className} {...props}>
      {children}
    </button>
  )
);
Button.displayName = 'Button';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={className} {...props} />
);
Input.displayName = 'Input';

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ children, className, ...props }, ref) => (
    <label ref={ref} className={className} {...props}>
      {children}
    </label>
  )
);
Label.displayName = 'Label';

export const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} type="checkbox" className={className} {...props} />
);
Checkbox.displayName = 'Checkbox';

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`overflow-hidden ${className || ''}`}>{children}</div>
);

export const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

export const cn = (...args: (string | undefined | null | false)[]) => args.filter(Boolean).join(' ');

export const LoadingSpinner = ({ size }: { size?: string }) => (
  <div data-testid="loading-spinner" data-size={size}>Loading...</div>
);

export const Avatar = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

export const AvatarFallback = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={className}>{children}</span>
);

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const SelectContext = React.createContext<SelectContextValue>({});

export const Select = ({ children, value, onValueChange, disabled }: { children: React.ReactNode; value?: string; onValueChange?: (value: string) => void; disabled?: boolean }) => (
  <SelectContext.Provider value={{ value, onValueChange, disabled }}>
    <div data-testid="select">{children}</div>
  </SelectContext.Provider>
);

export const SelectTrigger = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { disabled } = React.useContext(SelectContext);
  return (
    <button type="button" className={className} disabled={disabled} aria-label="select">
      {children}
    </button>
  );
};

export const SelectContent = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

export const SelectItem = ({ children, value }: { children: React.ReactNode; value: string }) => {
  const { onValueChange } = React.useContext(SelectContext);
  return (
    <div data-value={value} onClick={() => onValueChange?.(value)}>
      {children}
    </div>
  );
};

export const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <span>{placeholder}</span>
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={className} {...props} />
);
Textarea.displayName = 'Textarea';

export const Modal = ({ children, open, onOpenChange: _onOpenChange, title, description, size: _size }: { children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; size?: string }) => {
  if (!open) return null;
  return (
    <div data-testid="modal">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
};

export const DatePicker = ({ value, onChange: _onChange, placeholder, className }: { value?: Date; onChange?: (date: Date | undefined) => void; placeholder?: string; className?: string }) => (
  <button type="button" className={className}>
    {value ? value.toLocaleDateString() : placeholder}
  </button>
);

export const DateRangePicker = ({ value: _value, onChange: _onChange, placeholder, className }: { value?: unknown; onChange?: (range: unknown) => void; placeholder?: string; className?: string }) => (
  <button type="button" className={className}>
    {placeholder}
  </button>
);

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

export const DropdownMenuTrigger = ({ children, asChild: _asChild }: { children: React.ReactNode; asChild?: boolean }) => (
  <>{children}</>
);

export const DropdownMenuContent = ({ children, align: _align }: { children: React.ReactNode; align?: string }) => (
  <div>{children}</div>
);

export const DropdownMenuItem = ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
  <div onClick={onClick} className={className} role="menuitem">
    {children}
  </div>
);

export const DropdownMenuSeparator = () => <hr />;

export const StatusBadge = ({ status, variant }: { status: string; variant?: string }) => (
  <span data-variant={variant}>{status}</span>
);

export const DataTable = ({ columns, data, sorting: _sorting, onSort: _onSort, pagination: _pagination, onPageChange: _onPageChange, emptyMessage }: {
  columns: unknown[];
  data: unknown[];
  sorting: unknown;
  onSort: (sorting: unknown) => void;
  pagination: { pageIndex: number; pageSize: number; totalCount: number };
  onPageChange: (page: number) => void;
  emptyMessage?: string;
}) => {
  if (data.length === 0) {
    return <div>{emptyMessage}</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          {(columns as { id: string; header: string }[]).map((col) => (
            <th key={col.id}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(data as Record<string, unknown>[]).map((row, i) => (
          <tr key={i}>
            {(columns as { id: string; cell?: (row: unknown) => React.ReactNode }[]).map((col) => (
              <td key={col.id}>{col.cell ? col.cell(row) : String(row[col.id] || '')}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export type ColumnDef<T> = {
  id: string;
  header: string;
  accessorKey?: string;
  sortable?: boolean;
  cell?: (row: T) => React.ReactNode;
};

export type SortingState = {
  id: string;
  desc: boolean;
} | null;

export type StatusBadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
