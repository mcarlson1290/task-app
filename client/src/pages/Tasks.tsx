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
import { TrayService } from "@/services/trayService";
import { TrayIntegration } from "@/utils/trayIntegration";
import { useLocation } from "@/contexts/LocationContext";
import SubHeader from "@/components/SubHeader";

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
  const filtersRef = React.useRef<HTMLDivElement>(null);
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
  }, [activeFilter, statusFilter, priorityFilter, dateFilter]);

  const { data: tasks = [], isLoading, refetch } = useQuery<Task[]>({
    queryKey: ["/api/tasks", { userId: auth.user?.id, location: currentLocation.code }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (auth.user?.role === 'technician') {
        params.append('userId', auth.user.id.toString());
      }
      if (!isViewingAllLocations) {
        params.append('location', currentLocation.code);
      }
      const url = `/api/tasks?${params.toString()}`;
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

    // Location filter - only show tasks for current location unless viewing all locations
    if (!isViewingAllLocations) {
      filtered = filtered.filter(task => task.location === currentLocation.code);
    }

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
  }, [tasks, searchTerm, activeFilter, statusFilter, priorityFilter, dateFilter, currentLocation.code, isViewingAllLocations]);

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
        
        // Check if this is a seeding task and create tray
        if (task.type.includes('seeding') || task.type.includes('Seeding')) {
          TrayService.createTrayFromTask(task, auth.user).then(newTray => {
            if (newTray) {
              toast({
                title: "🎉 Task completed!",
                description: `Great job! Task completed and tray ${newTray.id} created for ${newTray.cropType}. Used ${newTray.seedsUsedOz} oz of seeds.`,
              });
            } else {
              toast({
                title: "🎉 Task completed!",
                description: "Great job! The task has been marked as completed.",
              });
            }
          }).catch(error => {
            console.error('Error creating tray:', error);
            toast({
              title: "🎉 Task completed!",
              description: "Great job! The task has been marked as completed.",
            });
          });
        } else {
          toast({
            title: "🎉 Task completed!",
            description: "Great job! The task has been marked as completed.",
          });
        }
        
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
    <div className="page-content">
      <div className="task-manager">
      <SubHeader>
        <button className="btn-primary" onClick={handleNewTask}>
          <Plus className="h-4 w-4" />
          New Task
        </button>
        
        <div className="filter-group flex-grow">
          <div className="search-input-container" style={{ position: 'relative', flex: '1', maxWidth: '400px' }}>
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="search-input"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          
          <select
            className="filter-dropdown"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {taskTypes.filter(type => type.value !== "all").map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          
          <select
            className="filter-dropdown"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            {statusOptions.filter(option => option.value !== "all").map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <select
            className="filter-dropdown"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priority</option>
            {priorityOptions.filter(option => option.value !== "all").map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <input
            type="date"
            className="filter-dropdown"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          
          <button
            className="btn-secondary"
            onClick={clearAllFilters}
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
        </div>
      </SubHeader>

      {/* Task Content */}
      <div className="task-content">
        {filteredTasks.length === 0 ? (
          <div className="no-tasks">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
            <h3>No tasks found</h3>
            <p>You're all caught up! No tasks available right now.</p>
          </div>
        ) : (
          <div className="task-list">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTaskAction={handleTaskAction}
                />
              ))}
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default Tasks;
