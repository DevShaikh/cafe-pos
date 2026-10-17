import React from "react";

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div>{children}</div>;
};
