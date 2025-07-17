import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RecurringTasks: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#203B17] mb-2">Recurring Tasks</h1>
        <p className="text-gray-600">Manage and configure recurring task schedules</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recurring Tasks Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Recurring Tasks</h3>
            <p className="text-gray-600">Configure and manage recurring task schedules here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecurringTasks;