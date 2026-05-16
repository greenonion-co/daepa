import { NextResponse } from "next/server";

const APP_ID = "FSPV9YZ3G8.com.greenonion.daepamily";

const PATHS = ["/pet/*", "/showroom/*", "/notifications", "/notifications/*"];

export async function GET() {
  const body = {
    applinks: {
      details: [
        {
          appIDs: [APP_ID],
          components: PATHS.map((path) => ({ "/": path })),
        },
      ],
    },
  };

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
