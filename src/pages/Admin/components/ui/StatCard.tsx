import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  valueClass?: string;
  bgClass?: string;
  labelClass?: string;
}

export function StatCard({ 
  icon, 
  label, 
  value, 
  valueClass = "text-white", 
  bgClass = "bg-white/5 border-white/10", 
  labelClass = "text-white/40" 
}: StatCardProps) {
  // Ensure value is a string and handle currency non-breaking spaces
  const displayValue = typeof value === 'string' ? value.replace(/\s/g, '\u00A0') : value;

  return (
    <div className={`${bgClass} border p-6 rounded-sm shadow-xl transition-all hover:border-white/20 flex flex-col justify-between min-h-[120px]`}>
      <div className="flex items-center gap-4 opacity-40">
        <div className="shrink-0">
          {icon}
        </div>
        <p className={`text-[9px] uppercase tracking-widest ${labelClass} font-bold leading-tight`}>{label}</p>
      </div>
      <p className={`text-xl md:text-2xl font-display ${valueClass} mt-4 whitespace-nowrap overflow-hidden`}>
        {displayValue}
      </p>
    </div>
  );
}
