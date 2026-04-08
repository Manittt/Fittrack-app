import * as React from "react";
 
const variantClasses = {
  default: "bg-[#007AFF] hover:bg-[#0066DD] text-white",
  destructive: "bg-[#FF3B30] hover:bg-[#CC2F26] text-white",
  outline: "border border-[#27272A] bg-transparent hover:bg-[#1A1A1A] text-white",
  secondary: "bg-[#1A1A1A] hover:bg-[#27272A] text-white",
  ghost: "bg-transparent hover:bg-[#1A1A1A] text-[#A1A1AA] hover:text-white",
  link: "bg-transparent underline-offset-4 hover:underline text-[#007AFF]",
};
 
const sizeClasses = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};
 
export const Button = React.forwardRef(
  ({ className = "", variant = "default", size = "default", disabled, children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2 focus:ring-offset-[#0A0A0A] disabled:opacity-50 disabled:pointer-events-none";
 
    const classes = [base, variantClasses[variant] ?? variantClasses.default, sizeClasses[size] ?? sizeClasses.default, className]
      .join(" ");
 
    return (
      <button ref={ref} className={classes} disabled={disabled} {...props}>
        {children}
      </button>
    );
  }
);
 
Button.displayName = "Button";
