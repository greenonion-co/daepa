import { r2Service } from "@/lib/vendor/cloudflare/r2.service";
import { authenticateUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { success, error } = await authenticateUser(request);

  if (!success) {
    return error;
  }

  try {
    const body = await request.json();
    const { petId, mimeType, size } = body;

    if (!petId || typeof petId !== "string") {
      return NextResponse.json({ error: "유효하지 않은 petId" }, { status: 400 });
    }
    if (!mimeType || typeof mimeType !== "string" || !mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 415 });
    }
    if (typeof size !== "number" || size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "파일이 너무 큽니다." }, { status: 413 });
    }

    const result = await r2Service.getPresignedUploadUrl({ petId, mimeType });

    return NextResponse.json({
      ...result,
      mimeType,
      size,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Presigned URL 발급에 실패했습니다." }, { status: 500 });
  }
}
