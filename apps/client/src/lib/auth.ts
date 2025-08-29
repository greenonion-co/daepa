import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export async function authenticateUser(request: NextRequest): Promise<{
  success: boolean;
  user?: { userId: string; status: string };
  error?: NextResponse<{ error: string }>;
}> {
  const authorizationHeader = request.headers.get("authorization") ?? "";
  const [scheme, rawToken] = authorizationHeader.split(/\s+/);
  const token = scheme?.toLowerCase() === "bearer" ? rawToken?.trim() : "";

  if (!token) {
    return {
      success: false,
      error: NextResponse.json(
        { error: "인증 토큰이 필요합니다." },
        {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Bearer realm="api", error="invalid_request"',
          },
        },
      ),
    };
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.status !== "authenticated" || typeof payload.sub !== "string") {
      return {
        success: false,
        error: NextResponse.json(
          { error: "유효하지 않은 토큰입니다." },
          {
            status: 401,
            headers: {
              "WWW-Authenticate": 'Bearer realm="api", error="invalid_token"',
            },
          },
        ),
      };
    }

    return {
      success: true,
      user: {
        userId: payload.sub,
        status: payload.status,
      },
    };
  } catch (error: unknown) {
    console.error(error);
    return {
      success: false,
      error: NextResponse.json({ error: "토큰 검증 실패" }, { status: 401 }),
    };
  }
}
