import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Filter, Search, ChevronDown, X, Calendar } from "lucide-react";
import { format } from "date-fns";
import { filterTasks, getTodayString, isTaskOverdue, debugFiltering, type TaskFilters as FilterOptions } from "@/utils/taskFiltering";
import TaskCard from "@/components/TaskCard";
import TaskModal from "@/components/TaskModal";
import { AddTaskModal } from "@/components/AddTaskModal";
import TaskActionModal from "@/components/TaskActionModal";
import { Task } from "@shared/schema";
import { getStoredAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import confetti from "canvas-confetti";
import { TrayService } from "@/services/trayService";
import { TaskCompletionService } from "@/services/taskCompletionService";
import { useLocation } from "@/contexts/LocationContext";

const Tasks: React.FC = () => {
  // State management using new clean filtering system
  const [filters, setFilters] = React.useState<FilterOptions>(() => ({
    selectedDate: getTodayString(),
    selectedCategory: 'all',
    selectedStatus: 'all',
    selectedPriority: 'all',
    searchTerm: ''
  }));

  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = React.useState(false);
  const [taskActionModalOpen, setTaskActionModalOpen] = React.useState(false);
  
  // Dropdown states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = React.useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = React.useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = React.useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = React.useState(false);
  
  // Refs for dropdowns
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);
  const priorityDropdownRef = React.useRef<HTMLDivElement>(null);
  const dateDropdownRef = React.useRef<HTMLDivElement>(null);
  const filtersRef = React.useRef<HTMLDivElement>(null);
  
  // Scroll indicators
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  
  const auth = getStoredAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentLocation, isViewingAllLocations } = useLocation();

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setPriorityDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setDateDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll indicators functionality
  React.useEffect(() => {
    const checkScroll = () => {
      if (filtersRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = filtersRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
      }
    };
    
    checkScroll();
    const resizeObserver = new ResizeObserver(checkScroll);
    if (filtersRef.current) {
      resizeObserver.observe(filtersRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [filters]);

  // Fetch tasks with overdue status
  const { data: tasks = [], isLoading, refetch } = useQuery<Task[]>({
    queryKey: ["/api/tasks", { userId: auth.user?.id, location: currentLocation.name }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (auth.user?.role === 'technician') {
        params.append('userId', auth.user.id.toString());
      }
      if (!isViewingAllLocations) {
        params.append('location', currentLocation.name);
      }
      const url = `/api/tasks?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      
      // Add overdue status to tasks
      return data.map((task: Task) => ({
        ...task,
        description: task.description || undefined, // Convert null to undefined
        isOverdue: isTaskOverdue(task)
      }));
    },
    enabled: !!auth.user,
  });

  // Clean filtering using the new system
  const filteredTasks = React.useMemo(() => {
    // Apply location filter first
    let locationFiltered = tasks;
    if (!isViewingAllLocations) {
      locationFiltered = locationFiltered.filter(task => task.location === currentLocation.name);
    }

    // Apply the clean filtering system
    const filtered = filterTasks(locationFiltered, filters);

    // Debug the new system
    debugFiltering(locationFiltered, filters);

    return filtered;
  }, [tasks, filters, currentLocation.name, isViewingAllLocations]);

  // Task types configuration
  const taskTypes = [
    { value: "all", label: "All Tasks", emoji: "📋" },
    { value: "seeding-microgreens", label: "Seeding - Microgreens", emoji: "🌱" },
    { value: "seeding-leafy-greens", label: "Seeding - Leafy Greens", emoji: "🌿" },
    { value: "harvest-microgreens", label: "Harvest - Microgreens", emoji: "🌾" },
    { value: "harvest-leafy-greens", label: "Harvest - Leafy Greens", emoji: "🥬" },
    { value: "blackout-tasks", label: "Blackout Tasks", emoji: "🌑" },
    { value: "moving", label: "Moving", emoji: "📦" },
    { value: "packing", label: "Packing", emoji: "📦" },
    { value: "cleaning", label: "Cleaning", emoji: "🧹" },
    { value: "inventory", label: "Inventory", emoji: "📊" },
    { value: "equipment-maintenance", label: "Equipment Maintenance", emoji: "🔧" },
    { value: "other", label: "Other", emoji: "📝" },
  ];

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Assigned" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "approved", label: "Approved" },
    { value: "paused", label: "Paused" },
    { value: "skipped", label: "Skipped" },
    { value: "overdue", label: "Overdue" }
  ];

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" }
  ];

  // Calculate task counts
  const taskCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    taskTypes.forEach(type => {
      if (type.value === "all") {
        counts[type.value] = tasks.length;
      } else {
        counts[type.value] = tasks.filter(task => task.type === type.value).length;
      }
    });
    return counts;
  }, [tasks]);

  // Task update mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: number; updates: Partial<Task> }) => {
      return await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  // Filter update functions
  const updateFilter = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      selectedDate: undefined,
      selectedCategory: 'all',
      selectedStatus: 'all',
      selectedPriority: 'all',
      searchTerm: ''
    });
  };

  const clearDateFilter = () => {
    updateFilter('selectedDate', undefined);
  };

  // Task action handlers
  const handleTaskAction = (taskId: number, action: 'start' | 'collaborate' | 'complete' | 'pause' | 'skip' | 'view' | 'resume', reason?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    switch (action) {
      case 'start':
        updateTaskMutation.mutate({
          taskId,
          updates: { 
            status: 'in_progress', 
            startedAt: new Date().toISOString() as any 
          }
        });
        setSelectedTask({ ...task, status: 'in_progress' });
        setModalOpen(true);
        break;
      case 'view':
        setSelectedTask(task);
        setModalOpen(true);
        break;
      // Add other cases as needed
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track your daily tasks
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setAddTaskModalOpen(true)}
            className="flex items-center gap-2"
            data-testid="button-add-task"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Clean Filter Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={filters.searchTerm || ''}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-10"
              data-testid="input-search-tasks"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4">
            {/* Date Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.selectedDate || ''}
                  onChange={(e) => updateFilter('selectedDate', e.target.value)}
                  className="w-auto"
                  data-testid="input-date-filter"
                />
                {filters.selectedDate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDateFilter}
                    data-testid="button-clear-date"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <Select value={filters.selectedCategory} onValueChange={(value) => updateFilter('selectedCategory', value)}>
                <SelectTrigger className="w-48" data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.emoji} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <Select value={filters.selectedStatus} onValueChange={(value) => updateFilter('selectedStatus', value)}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
              <Select value={filters.selectedPriority} onValueChange={(value) => updateFilter('selectedPriority', value)}>
                <SelectTrigger className="w-48" data-testid="select-priority-filter">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear All Filters */}
            <div className="flex flex-col gap-1 justify-end">
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="flex items-center gap-2"
                data-testid="button-clear-all-filters"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Task Results */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'}
            {filters.selectedDate && (
              <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">
                for {format(new Date(filters.selectedDate), 'MMMM d, yyyy')}
              </span>
            )}
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tasks found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {Object.values(filters).some(v => v && v !== 'all') 
                ? 'Try adjusting your filters to see more tasks.'
                : 'Create your first task to get started.'
              }
            </p>
            {Object.values(filters).some(v => v && v !== 'all') && (
              <Button variant="outline" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onTaskAction={handleTaskAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modalOpen && selectedTask && (
        <TaskModal
          task={selectedTask}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedTask(null);
          }}
          onTaskUpdate={(updatedTask) => {
            queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
            setSelectedTask(updatedTask);
          }}
        />
      )}

      <AddTaskModal
        open={addTaskModalOpen}
        onClose={() => setAddTaskModalOpen(false)}
        onTaskAdded={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
          setAddTaskModalOpen(false);
        }}
      />

      <TaskActionModal
        open={taskActionModalOpen}
        onClose={() => setTaskActionModalOpen(false)}
        task={selectedTask}
        onTaskUpdate={(updatedTask) => {
          queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
          setSelectedTask(updatedTask);
          setTaskActionModalOpen(false);
        }}
      />
    </div>
  );
};

export default Tasks;