import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className, hover }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-2xl p-6',
        hover && 'hover:border-primary/50 transition-colors duration-200 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
