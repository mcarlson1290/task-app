import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Filter, Search, ChevronDown, X, Calendar } from "lucide-react";
import { format, isSameDay } from "date-fns";
import TaskCard from "@/components/TaskCard";
import TaskModal from "@/components/TaskModal";
import { AddTaskModal } from "@/components/AddTaskModal";
import TaskActionModal from "@/components/TaskActionModal";
import { Task } from "@shared/schema";
import { TaskFilters, TaskType } from "@/types";
import { getStoredAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import confetti from "canvas-confetti";

const Tasks: React.FC = () => {
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = React.useState(false);
  const [taskActionModalOpen, setTaskActionModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filters, setFilters] = React.useState<TaskFilters>({});
  const [activeFilter, setActiveFilter] = React.useState<string>("all");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = React.useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = React.useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<string>("");
  const [dateDropdownOpen, setDateDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);
  const priorityDropdownRef = React.useRef<HTMLDivElement>(null);
  const dateDropdownRef = React.useRef<HTMLDivElement>(null);
  
  const auth = getStoredAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: tasks = [], isLoading, refetch } = useQuery<Task[]>({
    queryKey: ["/api/tasks", auth.user?.id],
    queryFn: async () => {
      const url = auth.user?.role === 'technician' 
        ? `/api/tasks?userId=${auth.user.id}`
        : '/api/tasks';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
    enabled: !!auth.user,
  });

  // Debug logging
  React.useEffect(() => {
    console.log('Current tasks:', tasks);
    console.log('Date filter:', dateFilter);
    console.log('Filtered tasks:', filteredTasks);
  }, [tasks, dateFilter]);

  // Task update mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: number; updates: Partial<Task> }) => {
      return await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const resetTasksMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/tasks/reset", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tasks Reset",
        description: "All tasks have been reset to their original state.",
      });
    },
    onError: (error) => {
      console.error("Error resetting tasks:", error);
      toast({
        title: "Failed to reset tasks",
        description: "There was an error resetting the tasks. Please try again.",
        variant: "destructive",
      });
    },
  });

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
    { value: "skipped", label: "Skipped" }
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

  const filteredTasks = React.useMemo(() => {
    let filtered = tasks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (activeFilter !== "all") {
      filtered = filtered.filter(task => task.type === activeFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Date filter - smart handling for today vs other dates
    if (dateFilter) {
      const today = new Date().toISOString().split('T')[0];
      const isToday = dateFilter === today;
      
      filtered = filtered.filter(task => {
        if (task.dueDate) {
          const taskDate = new Date(task.dueDate);
          const taskDateString = taskDate.toISOString().split('T')[0];
          
          // If today is selected, show today's tasks AND overdue tasks
          if (isToday) {
            const isOverdue = taskDate < new Date() && task.status !== 'completed';
            return taskDateString === dateFilter || isOverdue;
          }
          
          // For other dates, only show tasks due on that exact date
          return taskDateString === dateFilter;
        }
        return false;
      });
    }

    return filtered;
  }, [tasks, searchTerm, activeFilter, statusFilter, priorityFilter, dateFilter]);

  // Clear all filters function
  const clearAllFilters = () => {
    setActiveFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setDateFilter("");
    setSearchTerm("");
  };

  // Single task action handler
  const handleTaskAction = (taskId: number, action: 'start' | 'collaborate' | 'complete' | 'pause' | 'skip' | 'view', reason?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    switch (action) {
      case 'start':
        // Update task to in-progress and open modal
        updateTaskMutation.mutate({
          taskId,
          updates: { 
            status: 'in_progress', 
            startedAt: new Date().toISOString() 
          }
        });
        setSelectedTask({ ...task, status: 'in_progress' });
        setModalOpen(true);
        break;
        
      case 'collaborate':
        // Just open modal for in-progress tasks
        setSelectedTask(task);
        setModalOpen(true);
        break;
        
      case 'complete':
        // Update task to completed
        updateTaskMutation.mutate({
          taskId,
          updates: { 
            status: 'completed', 
            completedAt: new Date().toISOString(),
            progress: 100
          }
        });
        setModalOpen(false);
        toast({
          title: "🎉 Task completed!",
          description: "Great job! The task has been marked as completed.",
        });
        // Celebrate with confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        break;
        
      case 'view':
        // Just open modal in read-only mode
        setSelectedTask(task);
        setModalOpen(true);
        break;
        
      case 'pause':
        // Update task to paused
        updateTaskMutation.mutate({
          taskId,
          updates: { 
            status: 'paused',
            pausedAt: new Date().toISOString()
          }
        });
        setModalOpen(false);
        toast({
          title: "Task Paused",
          description: "The task has been paused and can be resumed later.",
        });
        break;
        
      case 'skip':
        // Update task to skipped with reason
        updateTaskMutation.mutate({
          taskId,
          updates: { 
            status: 'skipped',
            skipReason: reason || 'No reason provided',
            skippedAt: new Date().toISOString()
          }
        });
        setModalOpen(false);
        toast({
          title: "Task Skipped",
          description: reason ? `Task skipped: ${reason}` : "Task has been skipped.",
        });
        break;
        
      case 'resume':
        // Update paused task back to in-progress
        const resumedTask = {
          ...task,
          status: 'in_progress' as const,
          resumedAt: new Date().toISOString()
        };
        
        updateTaskMutation.mutate({
          taskId,
          updates: { 
            status: 'in_progress',
            resumedAt: new Date().toISOString()
          }
        });
        
        // Pass the updated task to modal
        setSelectedTask(resumedTask);
        setModalOpen(true);
        toast({
          title: "Task Resumed",
          description: "The task has been resumed and is now in progress.",
        });
        break;
    }
  };

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => apiRequest('POST', '/api/tasks', taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setAddTaskModalOpen(false);
      toast({
        title: "Task Created",
        description: "New task has been added successfully",
      });
    },
    onError: (error) => {
      console.error('Create task error:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleAddTask = (taskData: any) => {
    console.log('handleAddTask called with:', taskData);
    
    const newTask = {
      ...taskData,
      // Send date as string, server will handle conversion
      dueDate: taskData.dueDate,
    };
    
    console.log('Calling createTaskMutation with:', newTask);
    createTaskMutation.mutate(newTask);
  };

  const handleNewTask = () => {
    setAddTaskModalOpen(true);
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
          <Button onClick={handleNewTask} className="bg-[#2D8028] hover:bg-[#203B17] text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
          <Button
            onClick={() => {
              // Reset all filters
              setActiveFilter("all");
              setStatusFilter("all");
              setPriorityFilter("all");
              setDateFilter("");
              setSearchTerm("");
              // Close modals
              setModalOpen(false);
              setSelectedTask(null);
              setNewTaskModalOpen(false);
              // Reset tasks to original state
              resetTasksMutation.mutate();
            }}
            variant="outline"
            className="bg-gray-500 hover:bg-gray-600 text-white border-gray-500"
            disabled={resetTasksMutation.isPending}
          >
            {resetTasksMutation.isPending ? "Resetting..." : "🔄 Reset (Dev)"}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* All Tasks Button */}
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            onClick={() => setActiveFilter("all")}
            className={activeFilter === "all" 
              ? "bg-[#2D8028] text-white hover:bg-[#203B17]" 
              : "text-gray-600 hover:text-[#2D8028]"
            }
          >
            📋 All Tasks
          </Button>

          {/* Category Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="outline"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="flex items-center gap-2"
            >
              {activeFilter !== "all" ? (
                <>
                  <span>{taskTypes.find(t => t.value === activeFilter)?.emoji}</span>
                  Category: {taskTypes.find(t => t.value === activeFilter)?.label}
                  <X 
                    className="h-4 w-4 ml-1 hover:bg-gray-100 rounded" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveFilter("all");
                    }}
                  />
                </>
              ) : (
                <>
                  Category
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
            
            {categoryDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-50">
                <div className="p-2 max-h-64 overflow-y-auto">
                  {taskTypes.filter(type => type.value !== "all").map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setActiveFilter(type.value);
                        setCategoryDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span>{type.emoji}</span>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative" ref={statusDropdownRef}>
            <Button
              variant="outline"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className="flex items-center gap-2"
            >
              {statusFilter !== "all" ? (
                <>
                  Status: {statusOptions.find(s => s.value === statusFilter)?.label}
                  <X 
                    className="h-4 w-4 ml-1 hover:bg-gray-100 rounded" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusFilter("all");
                    }}
                  />
                </>
              ) : (
                <>
                  Status
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
            
            {statusDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-50">
                <div className="p-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setStatusDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Priority Dropdown */}
          <div className="relative" ref={priorityDropdownRef}>
            <Button
              variant="outline"
              onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
              className="flex items-center gap-2"
            >
              {priorityFilter !== "all" ? (
                <>
                  Priority: {priorityOptions.find(p => p.value === priorityFilter)?.label}
                  <X 
                    className="h-4 w-4 ml-1 hover:bg-gray-100 rounded" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPriorityFilter("all");
                    }}
                  />
                </>
              ) : (
                <>
                  Priority
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
            
            {priorityDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-50">
                <div className="p-2">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setPriorityFilter(option.value);
                        setPriorityDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
            {dateFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateFilter("")}
                className="px-2 py-1"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Clear Filters Button */}
          <Button
            onClick={clearAllFilters}
            variant="outline"
            className="bg-gray-500 hover:bg-gray-600 text-white border-gray-500"
          >
            ✕ Clear Filters
          </Button>

          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Task Grid */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🌱</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || activeFilter !== "all" 
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
              onTaskAction={handleTaskAction}
            />
          ))}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onTaskAction={handleTaskAction}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        open={addTaskModalOpen}
        onClose={() => setAddTaskModalOpen(false)}
        onSave={handleAddTask}
      />

      {/* Task Action Modal */}
      <TaskActionModal
        task={selectedTask}
        open={taskActionModalOpen}
        onClose={() => setTaskActionModalOpen(false)}
      />
    </div>
  );
};

export default Tasks;
