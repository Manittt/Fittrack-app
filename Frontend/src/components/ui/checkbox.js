import * as React from "react";

export const Checkbox = React.forwardRef(
  ({ className = "", checked, onCheckedChange, ...props }, ref) => {
    const base =
      "h-5 w-5 rounded border-2 border-[#27272A] bg-[#0A0A0A] flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2 focus:ring-offset-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-50";

    const checkedClass = checked
      ? "bg-[#007AFF] border-[#007AFF]"
      : "hover:border-[#3f3f46]";

    return (
      <button
        ref={ref}
        role="checkbox"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        className={[base, checkedClass, className].join(" ")}
        {...props}
      >
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3 h-3 text-white"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
    );
  }
);

Checkbox.displayName = "Checkbox";