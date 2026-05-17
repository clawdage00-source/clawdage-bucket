"use client";

import { useEffect } from "react";

const BODY_ATTR = "data-hide-site-chrome";

/** Hides the global header/footer and removes main top padding while active. */
export function useHideSiteChrome(hidden: boolean) {
  useEffect(() => {
    if (!hidden) return;

    document.body.setAttribute(BODY_ATTR, "");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.removeAttribute(BODY_ATTR);
      document.body.style.overflow = prevOverflow;
    };
  }, [hidden]);
}
