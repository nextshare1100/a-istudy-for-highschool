import { cn } from '@/lib/utils';

interface CustomCardProps {
  children: React.ReactNode;
  className?: string;
}

export function CustomCard({ children, className }: CustomCardProps) {
  return (
    <div
      className={cn(
        "backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl border border-white/20",
        "transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]",
        className
      )}
    >
      {children}
    </div>
  );
}
