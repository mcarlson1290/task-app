import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface GenerationStatus {
  lastGeneration: string | null;
  generatedThrough: string | null;
  health: 'GREEN' | 'YELLOW' | 'RED';
  message: string;
  totalFutureTasks: number;
}

export function GenerationStatusBadge() {
  const { data: status } = useQuery<GenerationStatus>({
    queryKey: ['/api/admin/generation-status'],
    refetchInterval: 30000,
    staleTime: 20000,
  });

  if (!status) return null;

  const statusConfig = {
    GREEN: {
      icon: CheckCircle2,
      bgClass: 'bg-green-100 dark:bg-green-900/20',
      textClass: 'text-green-700 dark:text-green-400',
      iconClass: 'text-green-600 dark:text-green-500',
    },
    YELLOW: {
      icon: Clock,
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/20',
      textClass: 'text-yellow-700 dark:text-yellow-400',
      iconClass: 'text-yellow-600 dark:text-yellow-500',
    },
    RED: {
      icon: AlertCircle,
      bgClass: 'bg-red-100 dark:bg-red-900/20',
      textClass: 'text-red-700 dark:text-red-400',
      iconClass: 'text-red-600 dark:text-red-500',
    },
  };

  const config = statusConfig[status.health];
  const Icon = config.icon;

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}
      title={`Last generation: ${status.lastGeneration || 'Never'}\nGenerated through: ${status.generatedThrough || 'N/A'}\n${status.totalFutureTasks} future tasks`}
      data-testid="generation-status-badge"
    >
      <Icon className={`h-3.5 w-3.5 ${config.iconClass}`} />
      <span>Auto-Gen: {status.health}</span>
    </div>
  );
}
