"use client";

import { signOut } from "next-auth/react";

interface LogoutButtonProps {
  className?: string;
  label?: string;
}

export function LogoutButton({
  className,
  label = "Se deconnecter",
}: LogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={`!border-0 bg-transparent p-0 !outline-none !ring-0 focus:!border-0 focus:!outline-none focus:!ring-0 focus-visible:!border-0 focus-visible:!outline-none focus-visible:!ring-0 ${className ?? ""}`}
      style={{ border: "none", outline: "none", boxShadow: "none" }}
    >
      {label}
    </button>
  );
}
