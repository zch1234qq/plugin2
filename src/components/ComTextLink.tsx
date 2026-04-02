import React from "react";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
};

const defaultStyle: React.CSSProperties = {
  textDecoration: "underline",
  color: "blue",
  cursor: "pointer",
};

export default function ComTextLink({
  children,
  onClick,
  style,
  className,
  title,
}: Props) {
  return (
    <p
      className={className}
      title={title}
      style={{ ...defaultStyle, ...style }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </p>
  );
}

