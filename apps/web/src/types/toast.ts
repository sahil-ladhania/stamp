/**
 * File: toast.ts
 * Purpose: Ephemeral UI toast state (not sent to the API).
 * Exports: Toast, ToastTone
 * Used by: toast provider / layout components
 */

export type ToastTone = "info" | "error";

export type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
};
