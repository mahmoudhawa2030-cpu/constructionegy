"use client";

import { useEffect } from "react";

type Props = {
  header: string;
  footer: string;
};

/**
 * Injects admin-managed tracking HTML without wiping <head> (which drops CSS).
 * Script tags from innerHTML do not execute in React — recreate them in the DOM.
 *
 * Strips bare Meta PageView calls so PageView is owned by MetaEventsBridge
 * (Pixel + CAPI with the same event_id) and ads are not double-counted.
 */
export function TrackingScripts({ header, footer }: Props) {
  useEffect(() => {
    if (document.querySelector("[data-tracking='tracking-header'],[data-tracking='tracking-footer']")) {
      return;
    }

    const cleanups: Array<() => void> = [];

    if (header.trim()) {
      cleanups.push(injectHtml(sanitizeTrackingHtml(header), document.head, "tracking-header"));
    }
    if (footer.trim()) {
      cleanups.push(injectHtml(sanitizeTrackingHtml(footer), document.body, "tracking-footer"));
    }

    return () => {
      for (const fn of cleanups) fn();
    };
  }, [header, footer]);

  return null;
}

/** Remove automatic PageView so bridge can send one deduped PageView. Keep fbq('init'). */
export function sanitizeTrackingHtml(html: string): string {
  let out = html;

  out = out.replace(
    /fbq\s*\(\s*['"]track['"]\s*,\s*['"]PageView['"]\s*(?:,\s*\{[\s\S]*?\})?\s*\)\s*;?/gi,
    "/* PageView handled by MetaEventsBridge (deduped) */",
  );

  out = out.replace(
    /<noscript>\s*<img\b[^>]*facebook\.com\/tr\?[^>]*\bev=PageView[^>]*>\s*<\/noscript>/gi,
    "",
  );

  return out;
}

function injectHtml(html: string, parent: HTMLElement, marker: string): () => void {
  const placed: Node[] = [];
  const template = document.createElement("template");
  template.innerHTML = html.trim();

  const nodes = Array.from(template.content.childNodes);
  for (const node of nodes) {
    if (node.nodeName === "SCRIPT") {
      const old = node as HTMLScriptElement;
      const script = document.createElement("script");
      for (const attr of Array.from(old.attributes)) {
        script.setAttribute(attr.name, attr.value);
      }
      script.dataset.tracking = marker;
      if (old.textContent) {
        script.text = old.textContent;
      }
      parent.appendChild(script);
      placed.push(script);
      continue;
    }

    if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.COMMENT_NODE) {
      const clone = node.cloneNode(true);
      if (clone instanceof HTMLElement) {
        clone.dataset.tracking = marker;
      }
      parent.appendChild(clone);
      placed.push(clone);
    }
  }

  return () => {
    for (const n of placed) {
      n.parentNode?.removeChild(n);
    }
  };
}
