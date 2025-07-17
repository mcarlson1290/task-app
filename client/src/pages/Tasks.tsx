import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Filter, Search } from "lucide-react";
import TaskCard from "@/components/TaskCard";
import TaskModal from "@/components/TaskModal";
import { Task } from "@shared/schema";
import { TaskFilters, TaskType } from "@/types";
import { getStoredAuth } from "@/lib/auth";

const Tasks: React.FC = () => {
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filters, setFilters] = React.useState<TaskFilters>({});
  const [activeFilter, setActiveFilter] = React.useState<string>("all");
  
  const auth = getStoredAuth();

  const { data: tasks = [], isLoading, refetch } = useQuery<Task[]>({
    queryKey: ["/api/tasks", { userId: auth.user?.id }],
    enabled: !!auth.user,
  });

  const taskTypes = [
    { value: "all", label: "All Tasks", emoji: "📋" },
    { value: "seeding", label: "Seeding", emoji: "🌱" },
    { value: "moving", label: "Growing", emoji: "🌿" },
    { value: "harvesting", label: "Harvest", emoji: "🥬" },
    { value: "packing", label: "Packing", emoji: "📦" },
    { value: "cleaning", label: "Cleaning", emoji: "🧹" },
    { value: "inventory", label: "Inventory", emoji: "📋" },
  ];

  const filteredTasks = React.useMemo(() => {
    let filtered = tasks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (activeFilter !== "all") {
      filtered = filtered.filter(task => task.type === activeFilter);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    return filtered;
  }, [tasks, searchTerm, activeFilter, filters]);

  const handleTaskStart = (task: Task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleTaskContinue = (task: Task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    refetch();
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTask(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#203B17] mb-2">Today's Tasks</h1>
          <p className="text-gray-600">Complete your daily farm operations</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Button className="bg-[#2D8028] hover:bg-[#203B17] text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filters.status || ""} onValueChange={(value) => setFilters({ ...filters, status: value || undefined })}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Type Filters */}
      <div className="flex flex-wrap gap-2">
        {taskTypes.map((type) => (
          <Button
            key={type.value}
            variant={activeFilter === type.value ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(type.value)}
            className={activeFilter === type.value 
              ? "bg-[#2D8028] text-white hover:bg-[#203B17]" 
              : "text-gray-600 hover:text-[#2D8028]"
            }
          >
            <span className="mr-1">{type.emoji}</span>
            {type.label}
          </Button>
        ))}
      </div>

      {/* Task Grid */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🌱</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600">
            {searchTerm || filters.status || activeFilter !== "all" 
              ? "Try adjusting your filters or search term"
              : "You're all caught up! No tasks available right now."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStart={handleTaskStart}
              onContinue={handleTaskContinue}
              onViewDetails={handleTaskDetails}
            />
          ))}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  );
};

export default Tasks;
