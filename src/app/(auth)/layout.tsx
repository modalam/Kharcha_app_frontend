import type { ReactNode } from "react";
import { PreLoginAssistant } from "@/components/pre-login-assistant";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PreLoginAssistant />
    </>
  );
}
