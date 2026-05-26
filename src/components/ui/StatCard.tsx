import { ReactNode } from 'react';
import { Card } from './Card';

interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
}

export function StatCard({ icon, label, value, unit, className }: StatCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-center gap-2 text-accent mb-3">
        {icon}
        <span className="text-[11px] text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight">
        {value}
        {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
      </p>
    </Card>
  );
}
