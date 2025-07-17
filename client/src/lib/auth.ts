import { User } from "@shared/schema";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export const getStoredAuth = (): AuthState => {
  try {
    const stored = localStorage.getItem("auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        user: parsed.user,
        isAuthenticated: !!parsed.user
      };
    }
  } catch (error) {
    console.error("Failed to parse stored auth:", error);
  }
  
  return { user: null, isAuthenticated: false };
};

export const setStoredAuth = (user: User | null) => {
  try {
    localStorage.setItem("auth", JSON.stringify({ user }));
  } catch (error) {
    console.error("Failed to store auth:", error);
  }
};

export const clearStoredAuth = () => {
  try {
    localStorage.removeItem("auth");
  } catch (error) {
    console.error("Failed to clear auth:", error);
  }
};
