import Layout from "@/components/layout";
import React from "react";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div>
      <Layout>{children}</Layout>
    </div>
  );
};

export default DashboardLayout;
