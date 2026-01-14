const TOKEN_KEY = "accessToken";

// 쿠키 유틸리티 함수
function setCookie(name: string, value: string, days: number = 7): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

export const tokenStorage = {
  setToken(token: string): void {
    try {
      if (!token || typeof token !== "string") {
        console.warn("Invalid token provided to setToken");
        return;
      }
      localStorage.setItem(TOKEN_KEY, token);
      // 쿠키에도 저장 (서버 컴포넌트에서 접근 가능하도록)
      setCookie(TOKEN_KEY, token);
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
      // 쿠키에서도 삭제
      deleteCookie(TOKEN_KEY);
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
