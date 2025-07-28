import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Target, Calendar, AlertCircle, Users } from "lucide-react";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Course {
  id: number;
  title: string;
  description: string;
  roleAwarded: string;
  sections: number;
  estimatedTime: string;
  icon: string;
}

interface CourseAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  assignedBy: User;
}

const CourseAssignmentModal: React.FC<CourseAssignmentModalProps> = ({
  isOpen,
  onClose,
  course,
  assignedBy
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: isOpen
  });

  const assignCourseMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      return apiRequest('/api/course-assignments', 'POST', assignmentData);
    },
    onSuccess: () => {
      toast({
        title: "Course Assigned",
        description: `Successfully assigned "${course?.title}" to ${selectedUsers.length} user(s)`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/course-assignments'] });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Assignment Failed",
        description: "Could not assign course. Please try again.",
        variant: "destructive",
      });
    }
  });

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserToggle = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleAssign = () => {
    if (!course || selectedUsers.length === 0) return;

    const assignments = selectedUsers.map(userId => ({
      courseId: course.id,
      assignedToUserId: userId,
      assignedByUserId: assignedBy.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority,
      notes: notes || null
    }));

    // Create all assignments
    Promise.all(
      assignments.map(assignment =>
        apiRequest('/api/course-assignments', 'POST', assignment)
      )
    ).then(() => {
      toast({
        title: "Course Assigned",
        description: `Successfully assigned "${course.title}" to ${selectedUsers.length} user(s)`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/course-assignments'] });
      handleClose();
    }).catch(() => {
      toast({
        title: "Assignment Failed",
        description: "Could not assign course. Please try again.",
        variant: "destructive",
      });
    });
  };

  const handleClose = () => {
    setSearchTerm("");
    setSelectedUsers([]);
    setDueDate("");
    setPriority('normal');
    setNotes("");
    onClose();
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Assign Course
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{course.icon}</span>
              <h4 className="font-medium text-gray-900">{course.title}</h4>
            </div>
            <p className="text-sm text-gray-600">{course.estimatedTime} • {course.sections} sections</p>
          </div>

          {/* User Search */}
          <div className="space-y-2">
            <Label htmlFor="user-search">Select Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="user-search"
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Select All Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="text-sm font-medium">
              Select All ({filteredUsers.length} users)
            </Label>
          </div>

          {/* User List */}
          <div className="max-h-48 overflow-y-auto border rounded-lg">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                No users found
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredUsers.map(user => (
                  <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {user.role}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignment Options */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date (Optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: 'low' | 'normal' | 'high') => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add assignment notes or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Selected Count */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">
                {selectedUsers.length} user(s) selected for assignment
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selectedUsers.length === 0 || assignCourseMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {assignCourseMutation.isPending ? "Assigning..." : `Assign to ${selectedUsers.length} User(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseAssignmentModal;