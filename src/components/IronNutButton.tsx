import React from "react";

interface IronNutButtonProps {
  onClick: () => void;
  title?: string;
  className?: string;
}

export default function IronNutButton({ onClick, title = "CLOSE", className = "" }: IronNutButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative w-7 h-7 flex items-center justify-center bg-zinc-600 hover:bg-zinc-500 active:scale-95 text-zinc-950 font-black focus:outline-none transition-all shadow-[inset_0_1px_3px_rgba(255,255,255,0.4),_0_2px_4px_rgba(0,0,0,0.5)] cursor-pointer ${className}`}
      style={{
        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
      }}
      title={title}
    >
      {/* Dynamic metal circle thread hole inside the iron nut */}
      <span className="w-3 h-3 rounded-full bg-zinc-950 flex items-center justify-center text-[8px] font-black leading-none text-zinc-400 border border-zinc-800">
        ×
      </span>
    </button>
  );
}
