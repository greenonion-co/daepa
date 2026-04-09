import { cache } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

export interface BreederPublicProfile {
  userId: string;
  name: string;
  role: string;
  isBiz: boolean;
  petCount: number;
  realName?: string | null;
  phone?: string | null;
  address?: string | null;
  bannerImageUrl?: string | null;
  bio?: string | null;
}

export const fetchBreederProfile = cache(
  async (username: string): Promise<BreederPublicProfile | null> => {
    const url = `${BASE_URL}/api/v1/user/public-profile/${encodeURIComponent(username)}`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },
);
