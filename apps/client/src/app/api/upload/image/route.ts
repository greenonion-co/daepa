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
    const petId = formData.get("petId") as string;
    const file = formData.get("file") as File;
    const buffer = await file.arrayBuffer();
    const mimeType = file.type;
    const size = file.size;

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
