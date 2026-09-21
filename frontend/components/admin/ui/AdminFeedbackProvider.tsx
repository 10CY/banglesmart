"use client";

import type { ReactNode } from "react";
import {
  FeedbackProvider,
  useFeedback,
  type ConfirmOptions,
  type ConfirmTone,
  type ToastTone,
} from "@/components/ui/FeedbackProvider";

export type { ConfirmOptions, ConfirmTone, ToastTone };

export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  return <FeedbackProvider>{children}</FeedbackProvider>;
}

export function useAdminFeedback() {
  return useFeedback();
}
