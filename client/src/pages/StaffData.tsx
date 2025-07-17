import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StaffData: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#203B17] mb-2">Staff Data</h1>
        <p className="text-gray-600">View staff performance and activity metrics</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Staff Data Analytics</h3>
            <p className="text-gray-600">Staff performance metrics and productivity insights will be available here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffData;