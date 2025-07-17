import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProductionData: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#203B17] mb-2">Production Data</h1>
        <p className="text-gray-600">Monitor farm production metrics and yield data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🌱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Production Data Analytics</h3>
            <p className="text-gray-600">Farm production metrics, yield data, and harvest reports will be available here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionData;