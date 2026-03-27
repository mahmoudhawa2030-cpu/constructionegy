"use client";

import { useTranslations } from "next-intl";

/**
 * WhatsApp-style delivery indicators for outgoing messages (RTL-friendly).
 * — single ✓: sent (stored on server)
 * — double ✓✓ gray: delivered to the other device
 * — double ✓✓ blue: read by the other user
 */
export function messageReceiptStatus(m: {
  delivered_at: string | null;
  read_at: string | null;
}): "sent" | "delivered" | "read" {
  if (m.read_at) return "read";
  if (m.delivered_at) return "delivered";
  return "sent";
}

type Props = {
  status: "sent" | "delivered" | "read";
};

export function MessageDeliveryTicks({ status }: Props) {
  const t = useTranslations("chatThread");
  const read = status === "read";
  const delivered = status === "delivered" || read;
  const colorClass = read
    ? "text-sky-400 dark:text-sky-500"
    : "text-white/75 dark:text-zinc-500";

  const label =
    status === "read"
      ? t("receiptRead")
      : status === "delivered"
        ? t("receiptDelivered")
        : t("receiptSent");

  return (
    <span
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-end ${colorClass}`}
      title={label}
    >
      {delivered ? (
        <span
          aria-hidden
          className="inline-block text-[0.85em] font-semibold leading-none tracking-[-0.28em]"
        >
          ✓✓
        </span>
      ) : (
        <span aria-hidden className="inline-block text-[0.85em] font-semibold leading-none">
          ✓
        </span>
      )}
    </span>
  );
}
