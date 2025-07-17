import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoredAuth } from "@/lib/auth";

const Account: React.FC = () => {
  const auth = getStoredAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#203B17] mb-2">Account Information</h1>
        <p className="text-gray-600">Manage your account settings and profile</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <p className="text-lg text-[#203B17]">{auth.user?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <p className="text-lg text-[#203B17] capitalize">{auth.user?.role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Username</label>
              <p className="text-lg text-[#203B17]">{auth.user?.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <p className="text-lg text-green-600">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Account;