import * as React from "react";

export const Label = React.forwardRef(
  ({ className = "", ...props }, ref) => {
    const base =
      "text-sm font-medium text-white leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

    return (
      <label
        ref={ref}
        className={[base, className].join(" ")}
        {...props}
      />
    );
  }
);

Label.displayName = "Label";