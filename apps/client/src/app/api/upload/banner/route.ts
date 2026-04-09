import { r2Service } from "@/lib/vendor/cloudflare/r2.service";
import { authenticateUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { success, user, error } = await authenticateUser(request);

  if (!success || !user) {
    return error;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    const mimeType = file.type || "application/octet-stream";
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 415 });
    }

    const size = file.size;
    if (size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "파일이 너무 큽니다." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const { nanoid } = await import("nanoid");
    const uploadedFile = await r2Service.upload({
      key: `users/${user.userId}/banner/${nanoid(10)}`,
      buffer,
      mimeType,
      size,
    });

    return NextResponse.json(uploadedFile);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "배너 이미지 업로드에 실패했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { success, error } = await authenticateUser(request);

  if (!success) {
    return error;
  }

  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "삭제할 URL이 필요합니다." }, { status: 400 });
    }

    r2Service.delete(url).catch((err) => console.error("R2 삭제 실패:", err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "배너 이미지 삭제에 실패했습니다." }, { status: 500 });
  }
}
