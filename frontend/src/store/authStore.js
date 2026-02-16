import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Set user and tokens
      setAuth: (userData, accessToken) => {
        set({
          user: userData,
          accessToken: accessToken,
          isAuthenticated: true,
        });
      },

      // Update user data
      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      // Set access token
      setAccessToken: (token) => {
        set({ accessToken: token });
      },

      // Logout
      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      // Check if user has specific role
      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        if (Array.isArray(role)) {
          return role.includes(user.role);
        }
        return user.role === role;
      },

      // Get user role
      getRole: () => {
        const user = get().user;
        return user?.role || null;
      },

      // Set loading state
      setLoading: (isLoading) => {
        set({ isLoading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
