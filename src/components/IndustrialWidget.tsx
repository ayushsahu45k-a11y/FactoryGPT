import React from "react";

interface IndustrialWidgetProps {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
}

export default function IndustrialWidget({
  id,
  title,
  subtitle,
  children,
  headerAction,
  className = "",
}: IndustrialWidgetProps) {
  // Generate a mock mechanical system label based on title hash
  const titleSum = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const sysLabel = `SYS-${(titleSum % 900 + 100)}`;

  return (
    <div
      id={id}
      className={`bg-card-machina border border-border-machina rounded-[4px] shadow-none relative overflow-hidden flex flex-col pt-3 ${className}`}
    >
      {/* 4 Decorative industrial corner bolts/screws */}
      <div className="screw screw-tl"></div>
      <div className="screw screw-tr"></div>
      <div className="screw screw-bl"></div>
      <div className="screw screw-br"></div>

      {/* Box Header */}
      <div className="px-6 pt-4 pb-3 border-b border-border-machina bg-card-machina flex items-center justify-between z-10">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-accent-machina bg-bg-machina border border-border-machina px-1.5 py-0.5 font-bold">
              {sysLabel}
            </span>
            <h3 className="text-text-primary font-sans text-xs tracking-[0.2em] uppercase font-black">
              {title}
            </h3>
          </div>
          {subtitle && (
            <span className="text-[10px] text-text-secondary font-mono tracking-wider font-medium uppercase mt-1">{subtitle}</span>
          )}
        </div>
        {headerAction && <div className="flex items-center z-20">{headerAction}</div>}
      </div>

      {/* Card Content Area with clean padding */}
      <div className="p-6 flex-1 flex flex-col z-10">{children}</div>
    </div>
  );
}
