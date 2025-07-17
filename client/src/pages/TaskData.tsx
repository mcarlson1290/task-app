import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TaskData: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#203B17] mb-2">Task Data</h1>
        <p className="text-gray-600">Analyze task performance and completion metrics</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Task Data Analytics</h3>
            <p className="text-gray-600">Detailed task performance metrics and reporting will be available here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskData;