import { r2Service } from "@/lib/vendor/cloudflare/r2.service";
import { authenticateUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { success, error } = await authenticateUser(request);

  if (!success) {
    return error;
  }

  try {
    const formData = await request.formData();
    const petId = formData.get("petId");
    const file = formData.get("file");
    // petId must be a 1–64 character alphanumeric/underscore/dash string
    if (!petId || typeof petId !== "string") {
      return NextResponse.json({ error: "유효하지 않은 petId" }, { status: 400 });
    }
    // file must be present and a File object
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }
    const mimeType = file.type || "application/octet-stream";
    // only allow image uploads
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 415 });
    }
    const size = file.size;
    // enforce size limit 10MB
    if (size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "파일이 너무 큽니다." }, { status: 413 });
    }
    // read into a Node Buffer for downstream processing
    const ab = await file.arrayBuffer();
    const buffer = Buffer.from(ab);

    const uploadedPendingFiles = await r2Service.upload({
      petId,
      buffer: Buffer.from(buffer),
      mimeType,
      size,
    });

    return NextResponse.json(uploadedPendingFiles);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
