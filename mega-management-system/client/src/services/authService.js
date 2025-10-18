import api from "./api";

export const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    }
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data.data.user;
  }
};
