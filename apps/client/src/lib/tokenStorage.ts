const TOKEN_KEY = "accessToken";

export const tokenStorage = {
  setToken(token: string): void {
    try {
      if (!token || typeof token !== "string") {
        console.warn("Invalid token provided to setToken");
        return;
      }
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error("Failed to set token in localStorage:", error);
    }
  },

  getToken(): string | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token || token === "null" || token === "undefined") {
        return null;
      }

      return token;
    } catch (error) {
      console.error("Failed to get token from localStorage:", error);
      return null;
    }
  },

  removeToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error("Failed to remove token from localStorage:", error);
    }
  },

  hasToken(): boolean {
    try {
      const token = this.getToken();
      return token !== null && token.length > 0;
    } catch {
      return false;
    }
  },
};
