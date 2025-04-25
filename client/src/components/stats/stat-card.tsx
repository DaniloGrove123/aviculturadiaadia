import { motion } from "framer-motion";
import { ReactNode } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: {
    value: string | number;
    isPositive: boolean;
    label: string;
  };
  icon: ReactNode;
  iconBgClass: string;
  iconTextClass: string;
  details?: {
    label1: string;
    value1: string | number;
    label2: string;
    value2: string | number;
    label3?: string;
    value3?: string | number;
  };
}

export default function StatCard({
  title,
  value,
  unit,
  change,
  icon,
  iconBgClass,
  iconTextClass,
  details,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card hover:bg-card/50 rounded-xl p-6 shadow-lg border border-gray-800 transition duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <div className="mt-2 flex items-baseline">
            <h3 className="text-3xl font-bold">{value}</h3>
            {unit && <span className="ml-2 text-gray-400 text-sm">{unit}</span>}
          </div>
          {change && (
            <div className="mt-1 flex items-center text-xs">
              <span
                className={`font-medium flex items-center ${
                  change.isPositive ? "text-green-500" : "text-red-500"
                }`}
              >
                {change.isPositive ? (
                  <ArrowUp className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowDown className="w-3 h-3 mr-1" />
                )}
                {change.value}
              </span>
              <span className="ml-1 text-gray-500">{change.label}</span>
            </div>
          )}
        </div>
        <div className={`${iconBgClass} bg-opacity-10 p-3 rounded-lg`}>
          <div className={`${iconTextClass} w-6 h-6`}>{icon}</div>
        </div>
      </div>
      {details && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-400 text-xs">{details.label1}</span>
              <p className="font-medium">{details.value1}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">{details.label2}</span>
              <p className="font-medium">{details.value2}</p>
            </div>
            {details.label3 && (
              <div>
                <span className="text-gray-400 text-xs">{details.label3}</span>
                <p className="font-medium text-green-500">{details.value3}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
