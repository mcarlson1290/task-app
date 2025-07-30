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
  const [dateFilter, setDateFilter] = React.useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  });
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
  const [debugOutput, setDebugOutput] = React.useState('');



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

  const { data: recurringTasks = [] } = useQuery({
    queryKey: ["/api/recurring-tasks", { location: currentLocation.code }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (!isViewingAllLocations) {
        params.append('location', currentLocation.code);
      }
      const url = `/api/recurring-tasks?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch recurring tasks');
      return response.json();
    },
    enabled: !!auth.user,
  });



  // Periodic overdue status check (every minute)
  React.useEffect(() => {
    const checkOverdueStatus = () => {
      // Force a refetch to ensure overdue status is up-to-date
      refetch();
    };
    
    // Check immediately on mount
    checkOverdueStatus();
    
    // Set up interval to check every minute
    const interval = setInterval(checkOverdueStatus, 60000); // 60 seconds
    
    return () => clearInterval(interval);
  }, [refetch]);

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
    { value: "completed-late", label: "Completed Late" },
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
      switch (statusFilter) {
        case 'completed-late':
          filtered = filtered.filter(task => isTaskLate(task));
          break;
        case 'overdue':
          filtered = filtered.filter(task => isOverdue(task));
          break;
        default:
          filtered = filtered.filter(task => task.status === statusFilter);
          break;
      }
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Date filter - enhanced visibility for recurring tasks
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = filterDate.getTime() === today.getTime();
      
      filtered = filtered.filter(task => {
        // For recurring tasks, use enhanced visibility logic
        if (task.isRecurring && task.dueDate) {
          const dueDate = new Date(task.dueDate);
          const taskMonth = dueDate.getMonth();
          const taskYear = dueDate.getFullYear();
          const filterMonth = filterDate.getMonth();
          const filterYear = filterDate.getFullYear();
          const filterDay = filterDate.getDate();
          
          // Must be same month and year
          if (taskMonth !== filterMonth || taskYear !== filterYear) {
            return false;
          }
          
          // Get recurring task to check frequency
          const recurringTask = recurringTasks?.find(rt => rt.id === task.recurringTaskId);
          
          // Check based on task patterns in title or recurring task frequency
          const isMonthly = task.title?.includes('Monthly') || recurringTask?.frequency === 'monthly';
          const isBiWeekly = task.title?.includes('Bi-Weekly') || recurringTask?.frequency === 'bi-weekly';
          
          if (isMonthly) {
            // Monthly tasks: visible from 1st through due date
            return filterDay >= 1 && filterDate <= dueDate;
          }
          
          if (isBiWeekly) {
            const dueDay = dueDate.getDate();
            
            if (dueDay <= 14) {
              // First bi-weekly period: visible days 1-14
              return filterDay >= 1 && filterDay <= 14;
            } else {
              // Second bi-weekly period: visible days 15-end of month
              return filterDay >= 15;
            }
          }
          
          // For other recurring tasks, use due date
          const taskDateString = dueDate.toISOString().split('T')[0];
          return taskDateString === dateFilter;
        }
        
        // For non-recurring tasks, use due date logic
        if (task.dueDate) {
          const taskDate = new Date(task.dueDate);
          const taskDateString = taskDate.toISOString().split('T')[0];
          
          // If today is selected, show today's tasks AND overdue tasks
          if (isToday) {
            const isOverdue = taskDate < today && task.status !== 'completed' && task.status !== 'approved';
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

  // Late task detection functions - fixed to avoid false positives
  const isTaskLate = (task: Task): boolean => {
    // Must be completed
    if (task.status !== 'completed') return false;
    
    // Must have BOTH a due date and completion time
    if (!task.dueDate || !task.completedAt) return false;
    
    // For TEST tasks or tasks without proper dates, return false
    if (!task.dueDate || task.dueDate === 'Not specified' || task.dueDate === '') return false;
    
    try {
      const dueTime = new Date(task.dueDate).getTime();
      const completedTime = new Date(task.completedAt).getTime();
      
      // Check if dates are valid
      if (isNaN(dueTime) || isNaN(completedTime)) return false;
      
      // Only late if completed AFTER due date
      return completedTime > dueTime;
    } catch (error) {
      // If any date parsing fails, task is not late
      return false;
    }
  };

  const isOverdue = (task: Task): boolean => {
    if (!task.dueDate || task.status === 'completed' || task.status === 'approved') {
      return false;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Handle both Date objects and strings
    let dateString: string;
    if (task.dueDate instanceof Date) {
      const year = task.dueDate.getFullYear();
      const month = String(task.dueDate.getMonth() + 1).padStart(2, '0');
      const day = String(task.dueDate.getDate()).padStart(2, '0');
      dateString = `${year}-${month}-${day}`;
    } else {
      dateString = task.dueDate?.split('T')[0] || '';
    }
    
    const [year, month, day] = dateString.split('-');
    const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // If due date is before today, it's overdue
    if (dueDate < today) {
      return true;
    }
    
    // If due date is today, check if it's after 8:30 PM
    if (dueDate.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Check if it's after 8:30 PM (20:30 in 24-hour format)
      if (currentHour > 20 || (currentHour === 20 && currentMinute >= 30)) {
        return true;
      }
    }
    
    return false;
  };

  // Single task action handler
  const handleTaskAction = (taskId: number, action: 'start' | 'collaborate' | 'complete' | 'pause' | 'skip' | 'view' | 'resume', reason?: string) => {
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
        updateTaskMutation.mutate({
          taskId,
          updates: {
            status: 'in_progress',
            resumedAt: new Date().toISOString()
          }
        });
        setSelectedTask({ ...task, status: 'in_progress' });
        setModalOpen(true);
        toast({
          title: "Task Resumed",
          description: "The task has been resumed and you can continue working.",
        });
        break;
    }
  };

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => apiRequest('POST', '/api/tasks', taskData),
    onSuccess: () => {
      // Invalidate all task queries to ensure proper cache refresh
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
      
      // Force refetch of current task query
      refetch();
      
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
      // Add location to the task
      location: currentLocation.code,
    };
    
    console.log('Calling createTaskMutation with:', newTask);
    createTaskMutation.mutate(newTask);
  };

  const handleNewTask = () => {
    setAddTaskModalOpen(true);
  };

  // Debug recurring task system
  const debugRecurringTasks = async () => {
    try {
      const response = await apiRequest('POST', '/api/debug-recurring-tasks');
      setDebugOutput(JSON.stringify(response, null, 2));
      toast({
        title: "Debug Complete",
        description: `Found ${response.recurringTasksFound} recurring tasks, generated ${response.tasksGenerated} new instances`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    } catch (error) {
      console.error('Debug error:', error);
      toast({
        title: "Debug Error",
        description: "Failed to debug recurring tasks",
      });
    }
  };

  // Clean up duplicate tasks
  const cleanupDuplicates = async () => {
    try {
      const response = await apiRequest('POST', '/api/cleanup-duplicate-tasks');
      toast({
        title: "Cleanup Complete",
        description: `Removed ${response.duplicatesRemoved} duplicate tasks. Total tasks: ${response.finalTaskCount}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    } catch (error) {
      console.error('Cleanup error:', error);
      toast({
        title: "Cleanup Error",
        description: "Failed to cleanup duplicate tasks",
      });
    }
  };

  // Task Summary Component - now responsive to filters
  const TaskSummary = ({ 
    tasks, 
    activeFilter, 
    statusFilter, 
    dateFilter 
  }: { 
    tasks: Task[], 
    activeFilter: string, 
    statusFilter: string, 
    dateFilter: string 
  }) => {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const lateTasks = completedTasks.filter(t => isTaskLate(t));
    const onTimeTasks = completedTasks.length - lateTasks.length;
    const overdueTasks = tasks.filter(t => isOverdue(t));
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    
    // Calculate completion rate only if there are completed tasks
    const completionRate = completedTasks.length > 0 
      ? Math.round((onTimeTasks / completedTasks.length) * 100) 
      : 0;
    
    // Get filter description for context
    const getFilterDescription = () => {
      let desc = '';
      
      // Add date context
      if (dateFilter) {
        const today = new Date().toISOString().split('T')[0];
        if (dateFilter === today) {
          desc += "Today's ";
        } else {
          desc += `${dateFilter} `;
        }
      }
      
      // Add type filter context
      if (activeFilter !== 'all') {
        const taskType = taskTypes.find(t => t.value === activeFilter);
        desc += taskType ? taskType.label + ' ' : '';
      }
      
      // Add status filter context
      if (statusFilter !== 'all') {
        const statusOption = statusOptions.find(s => s.value === statusFilter);
        desc += statusOption ? statusOption.label + ' ' : '';
      }
      
      return desc || 'All ';
    };
    
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-[#203B17]">Task Statistics</h3>
          <span className="text-sm text-gray-600 font-medium">{getFilterDescription()}Tasks</span>
        </div>
        
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-2xl mb-2">📭</div>
            <p>No tasks match the current filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{tasks.length}</div>
              <div className="text-xs text-blue-700">Total</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-600">{pendingTasks.length}</div>
              <div className="text-xs text-gray-700">Pending</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">{inProgressTasks.length}</div>
              <div className="text-xs text-yellow-700">In Progress</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{onTimeTasks}</div>
              <div className="text-xs text-green-700">On Time</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <div className="text-xl font-bold text-amber-600">{lateTasks.length}</div>
              <div className="text-xs text-amber-700">Late</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">{overdueTasks.length}</div>
              <div className="text-xs text-red-700">Overdue</div>
            </div>
          </div>
        )}
        
        {completedTasks.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completion Performance:</span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${
                  completionRate >= 80 ? 'text-green-600' : 
                  completionRate >= 60 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {completionRate}%
                </span>
                <span className="text-xs text-gray-500">
                  ({onTimeTasks} on time, {lateTasks.length} late)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
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
      {/* Updated filter bar with New Task button */}
      <div className={`task-filters-wrapper ${canScrollLeft ? 'can-scroll-left' : ''} ${canScrollRight ? 'can-scroll-right' : ''}`}>
        <div 
          className="task-filters tasks-filter-container"
          ref={filtersRef}
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            setCanScrollLeft(target.scrollLeft > 0);
            setCanScrollRight(target.scrollLeft + target.clientWidth < target.scrollWidth - 5);
          }}
        >
          {/* All Tasks Button */}
          <button 
            className={`task-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Tasks
          </button>

          {/* Category Select */}
          <select 
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Category</option>
            {taskTypes.filter(type => type.value !== "all").map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Status</option>
            {statusOptions.filter(option => option.value !== "all").map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Priority Select */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Priority</option>
            {priorityOptions.filter(option => option.value !== "all").map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Date Input */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="date-input"
            />
            <button
              onClick={() => setDateFilter(new Date().toISOString().split('T')[0])}
              className="btn-today"
              title="Go to today"
            >
              Today
            </button>
          </div>

          {/* Clear Filters Button */}
          <button 
            className="btn-clear-filters"
            onClick={clearAllFilters}
          >
            <X size={16} /> Clear Filters
          </button>

          {/* Search Box */}
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* New Task Button */}
          <button 
            className="btn-new-task"
            onClick={handleNewTask}
          >
            <Plus size={16} /> New Task
          </button>

          {/* Admin Buttons (Temporary) */}
          {auth.user && (auth.user.role === 'manager' || auth.user.role === 'corporate') && (
            <>
              <button 
                onClick={cleanupDuplicates}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
              >
                🧹 Clean Duplicates
              </button>
              <button 
                onClick={debugRecurringTasks}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm"
              >
                🔄 Debug Recurring
              </button>
            </>
          )}
        </div>
      </div>

      {/* Task Summary Statistics - now responsive to filters */}
      <TaskSummary 
        tasks={filteredTasks} 
        activeFilter={activeFilter}
        statusFilter={statusFilter}
        dateFilter={dateFilter}
      />

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
