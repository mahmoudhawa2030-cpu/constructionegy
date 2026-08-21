import { NextResponse } from "next/server";

import type { StartChatResult } from "@/lib/chat/get-or-create-for-listing";

/** Listing contact is phone-only; internal messaging from listings is disabled. */
export async function POST(): Promise<NextResponse<StartChatResult>> {
  return NextResponse.json(
    {
      ok: false,
      reason: "error",
      message: "التواصل على الإعلانات متاح عبر رقم الهاتف فقط.",
    },
    { status: 403 },
  );
}
