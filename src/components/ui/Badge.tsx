import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  className?: string;
}

export default function Badge({ children, variant = 'blue', className }: BadgeProps) {
  const variants = {
    blue: 'bg-primary/20 text-primary-light border-primary/30',
    green: 'bg-success/20 text-success border-success/30',
    red: 'bg-danger/20 text-danger border-danger/30',
    yellow: 'bg-warning/20 text-warning border-warning/30',
    gray: 'bg-muted/20 text-muted border-muted/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
