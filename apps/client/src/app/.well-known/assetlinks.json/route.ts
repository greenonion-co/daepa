import { NextResponse } from "next/server";

const PACKAGE_NAME = "com.greenonion.daepa";

const SHA256_FINGERPRINTS = [
  "F3:8A:E3:B1:50:47:D4:9B:C1:A0:42:A3:D8:75:79:AA:62:E4:6E:CC:36:6C:CE:10:00:76:00:4A:BB:0F:3A:D3",
  "94:A0:19:85:B3:AD:A4:67:95:94:15:D2:6D:54:A5:E6:FA:44:69:8A:84:67:DE:35:0C:23:DC:1B:81:9E:20:2B",
];

export async function GET() {
  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: PACKAGE_NAME,
        sha256_cert_fingerprints: SHA256_FINGERPRINTS,
      },
    },
  ];

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
