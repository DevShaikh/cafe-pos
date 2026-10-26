import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Cafe POS",
  description: "Login to the Cafe POS system",
};

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>;
};

export default AuthLayout;
