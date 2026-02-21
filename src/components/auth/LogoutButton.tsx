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
      className={className}
    >
      {label}
    </button>
  );
}
