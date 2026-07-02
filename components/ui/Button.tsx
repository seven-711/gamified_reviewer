import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xl font-bold transition-all duration-150 text-body px-[32px] py-[16px] uppercase tracking-[0.053em] font-sans disabled:opacity-50 disabled:cursor-not-allowed";

  const widthStyles = fullWidth ? "w-full" : "";

  let variantStyles = "";

  if (variant === "primary") {
    variantStyles =
      "bg-duo-green text-white hover:brightness-110 active:translate-y-1 active:shadow-none shadow-[0_4px_0_#3f8f01]";
  } else if (variant === "secondary") {
    variantStyles =
      "bg-transparent text-sky-blue border-2 border-solid border-cloud-gray hover:bg-gray-50 active:bg-gray-100";
  } else if (variant === "danger") {
    variantStyles =
      "bg-red-500 text-white hover:brightness-110 active:translate-y-1 active:shadow-none shadow-[0_4px_0_#b91c1c]";
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${widthStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
