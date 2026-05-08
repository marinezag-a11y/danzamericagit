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
  return (
    <div className={`${bgClass} border p-6 rounded-sm shadow-xl transition-all hover:border-white/20`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="p-2 bg-black/20 rounded-sm">
          {icon}
        </div>
        <p className={`text-[10px] uppercase tracking-widest ${labelClass} font-bold`}>{label}</p>
      </div>
      <p className={`text-3xl font-display ${valueClass}`}>{value}</p>
    </div>
  );
}
