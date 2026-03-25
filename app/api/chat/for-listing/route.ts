import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  getOrCreateChatForListingCore,
  type StartChatResult,
} from "@/lib/chat/get-or-create-for-listing";

export async function POST(request: Request): Promise<NextResponse<StartChatResult>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, reason: "error", message: "طلب غير صالح." },
      { status: 400 },
    );
  }

  const listingId =
    typeof body === "object" && body !== null && "listingId" in body
      ? String((body as { listingId: unknown }).listingId).trim()
      : "";

  if (!listingId) {
    return NextResponse.json(
      { ok: false, reason: "error", message: "معرّف الإعلان مطلوب." },
      { status: 400 },
    );
  }

  const result = await getOrCreateChatForListingCore(listingId);
  if (result.ok) {
    revalidatePath("/messages");
  }
  return NextResponse.json(result);
}
