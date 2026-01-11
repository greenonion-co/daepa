import "server-only";
import { cookies } from "next/headers";

export async function getServerRequestHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` };
  }
  return {};
}
