import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface Alert {
  id: string;
  title: string;
  message: string;
  variant: 'danger' | 'warning' | 'info' | 'success';
}

interface AlertCenterProps {
  alerts: Alert[];
  onClose: (id: string) => void;
}

export function AlertCenter({ alerts, onClose }: AlertCenterProps) {
  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 max-w-sm w-full">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`p-5 rounded-sm shadow-2xl flex items-start gap-4 border-l-4 backdrop-blur-md ${
              alert.variant === 'danger' 
                ? 'bg-red-500/10 border-red-500 text-red-500' 
                : alert.variant === 'warning'
                ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
                : 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
            }`}
          >
            <div className="mt-0.5">
              {alert.variant === 'danger' && <XCircle className="w-5 h-5" />}
              {alert.variant === 'warning' && <AlertTriangle className="w-5 h-5" />}
              {(alert.variant === 'info' || alert.variant === 'success') && <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[10px] uppercase tracking-widest font-bold mb-1">{alert.title}</h4>
              <p className="text-sm font-sans opacity-80 leading-relaxed">{alert.message}</p>
            </div>
            <button 
              onClick={() => onClose(alert.id)}
              className="opacity-40 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
