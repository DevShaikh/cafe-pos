"use client";

import { useSyncExternalStore } from "react";

export type ReceiptPaperWidth = 58 | 80;

const STORAGE_KEY = "cafe-pos-receipt-paper-width";
const CHANGE_EVENT = "cafe-pos-receipt-paper-width-change";

function getSnapshot(): ReceiptPaperWidth {
  if (typeof window === "undefined") return 80;
  return window.localStorage.getItem(STORAGE_KEY) === "58" ? 58 : 80;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function getServerSnapshot(): ReceiptPaperWidth {
  return 80;
}

export function useReceiptPaperWidth() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function saveReceiptPaperWidth(width: ReceiptPaperWidth) {
  window.localStorage.setItem(STORAGE_KEY, String(width));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
