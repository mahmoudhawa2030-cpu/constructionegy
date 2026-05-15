import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Old tab URL — conversations live under /messages now. */
export default function BookingsRedirectPage() {
  redirect("/messages");
}
