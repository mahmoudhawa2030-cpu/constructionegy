"use client";

import { useEffect } from "react";

type Props = {
  header: string;
  footer: string;
};

/**
 * Injects admin-managed tracking HTML without wiping <head> (which drops CSS).
 * Script tags from innerHTML do not execute in React — recreate them in the DOM.
 */
export function TrackingScripts({ header, footer }: Props) {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    if (header.trim()) {
      cleanups.push(injectHtml(header, document.head, "tracking-header"));
    }
    if (footer.trim()) {
      cleanups.push(injectHtml(footer, document.body, "tracking-footer"));
    }

    return () => {
      for (const fn of cleanups) fn();
    };
  }, [header, footer]);

  return null;
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
