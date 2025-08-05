import React from 'react';
import { useMsal } from "@azure/msal-react";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export const LogoutButton = () => {
  const { instance } = useMsal();

  const handleLogout = async () => {
    try {
      await instance.logoutPopup();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#2D8028]/50"
    >
      <User className="h-4 w-4 mr-2" />
      Sign Out
    </Button>
  );
};