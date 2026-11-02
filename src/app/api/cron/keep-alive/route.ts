import { NextResponse } from "next/server";
import { getStatelessClient } from "@/lib/supabase/stateless";

/**
 * Vercel Cron handler to keep Supabase free tier active.
 * Executes a lightweight database query so Supabase resets its 7-day inactivity pause timer.
 */
export async function GET(request: Request) {
  // If CRON_SECRET is configured in Vercel environment variables, verify it
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getStatelessClient();
    const startTime = Date.now();

    // Real database query on site_settings table
    const { data, error } = await supabase
      .from("site_settings")
      .select("key")
      .limit(1);

    const durationMs = Date.now() - startTime;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          durationMs,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Supabase keep-alive ping succeeded",
        data,
        durationMs,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
