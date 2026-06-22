import React from "react";
import { useStore } from "../store/useStore";
import { ShieldAlert, Lock } from "lucide-react";

interface PermissionGuardProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  errorMessage?: string;
  inline?: boolean;
}

export default function PermissionGuard({
  children,
  fallback,
  errorMessage = "AUTHORIZED LEVEL L-2 (MANAGER/ADMIN) CREDENTIALS REQUIRED FOR THIS OPERATION",
  inline = false,
}: PermissionGuardProps) {
  const { user } = useStore();

  const isAuthorized = user && (user.role === "Admin" || user.role === "Manager");

  if (isAuthorized) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (inline) {
    return (
      <div className="p-3 bg-red-950/15 border border-red-950/50 text-[10px] text-danger-machina font-mono uppercase tracking-wide flex items-center gap-2 rounded-[2px] select-none">
        <Lock size={12} className="shrink-0 animate-pulse" />
        <span className="font-bold">{errorMessage}</span>
      </div>
    );
  }

  return (
    <div className="bg-[#0B0B0A] border-2 border-danger-machina/40 p-6 rounded-[2px] font-mono text-center max-w-lg mx-auto my-8 shadow-lg select-none">
      <ShieldAlert size={32} className="text-danger-machina mx-auto mb-3 animate-pulse" />
      <h3 className="text-xs font-black text-danger-machina uppercase tracking-widest">[ACCELERATED LOCKOUT ACTIVE]</h3>
      <p className="text-text-secondary text-[10px] mt-2 leading-relaxed uppercase">
        {errorMessage}
      </p>
      <div className="mt-4 pt-3 border-t border-border-machina/40 flex justify-center">
        <span className="text-[8px] text-zinc-500 font-mono">ENFORCING PROTOCOLS ISO-9001 & SEC-807</span>
      </div>
    </div>
  );
}
