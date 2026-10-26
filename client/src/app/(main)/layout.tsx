import Layout from "@/components/layout";
import AuthGate from "@/components/providers/auth-gate";
import React from "react";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AuthGate>
      <Layout>{children}</Layout>
    </AuthGate>
  );
};

export default DashboardLayout;
