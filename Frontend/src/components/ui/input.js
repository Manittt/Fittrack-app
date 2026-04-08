import * as React from "react";
 
export const Input = React.forwardRef(
  ({ className = "", type = "text", ...props }, ref) => {
    const base =
      "flex h-10 w-full rounded-md border border-[#27272A] bg-[#0A0A0A] px-3 py-2 text-sm text-white placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] disabled:cursor-not-allowed disabled:opacity-50 transition-colors";
 
    return (
      <input
        ref={ref}
        type={type}
        className={[base, className].join(" ")}
        {...props}
      />
    );
  }
);
 
Input.displayName = "Input";
 