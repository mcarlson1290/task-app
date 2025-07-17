import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/schema";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getStoredAuth } from "@/lib/auth";

interface NewTaskModalProps {
  open: boolean;
  onClose: () => void;
}

const newTaskSchema = insertTaskSchema.extend({
  dueDate: z.string().min(1, "Due date is required"),
});

type NewTaskForm = z.infer<typeof newTaskSchema>;

const NewTaskModal: React.FC<NewTaskModalProps> = ({ open, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const auth = getStoredAuth();

  const form = useForm<NewTaskForm>({
    resolver: zodResolver(newTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "seeding-microgreens",
      priority: "medium",
      assignedTo: auth.user?.id || 1,
      createdBy: auth.user?.id || 1,
      estimatedTime: 60,
      status: "pending",
      progress: 0,
      data: {},
      checklist: [],
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: NewTaskForm) => {
      const { dueDate, ...rest } = taskData;
      return await apiRequest("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          ...rest,
          dueDate: new Date(dueDate).toISOString(),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task created!",
        description: "The new task has been created successfully.",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NewTaskForm) => {
    createTaskMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Enter task title"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="type">Task Type *</Label>
              <Select value={form.watch("type")} onValueChange={(value) => form.setValue("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seeding-microgreens">🌱 Seeding - Microgreens</SelectItem>
                  <SelectItem value="seeding-leafy-greens">🌿 Seeding - Leafy Greens</SelectItem>
                  <SelectItem value="harvest-microgreens">🌾 Harvest - Microgreens</SelectItem>
                  <SelectItem value="harvest-leafy-greens">🥬 Harvest - Leafy Greens</SelectItem>
                  <SelectItem value="blackout-tasks">🌑 Blackout Tasks</SelectItem>
                  <SelectItem value="moving">📦 Moving</SelectItem>
                  <SelectItem value="packing">📦 Packing</SelectItem>
                  <SelectItem value="cleaning">🧹 Cleaning</SelectItem>
                  <SelectItem value="inventory">📊 Inventory</SelectItem>
                  <SelectItem value="equipment-maintenance">🔧 Equipment Maintenance</SelectItem>
                  <SelectItem value="other">📝 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Quick Info</Label>
            <Input
              id="description"
              {...form.register("description")}
              placeholder="Brief description shown on task card"
            />
          </div>

          <div>
            <Label htmlFor="fullDescription">Description</Label>
            <Textarea
              id="fullDescription"
              {...form.register("description")}
              placeholder="Full task description and details"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={form.watch("priority")} onValueChange={(value) => form.setValue("priority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimatedTime">Estimated Duration</Label>
              <Input
                id="estimatedTime"
                type="number"
                {...form.register("estimatedTime", { valueAsNumber: true })}
                placeholder="60"
              />
              <p className="text-xs text-gray-500 mt-1">Duration in minutes (e.g., 30 for 30 minutes, 120 for 2 hours)</p>
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                {...form.register("dueDate")}
              />
              {form.formState.errors.dueDate && (
                <p className="text-sm text-red-600">{form.formState.errors.dueDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTaskMutation.isPending}
              className="bg-[#2D8028] hover:bg-[#203B17]"
            >
              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTaskModal;