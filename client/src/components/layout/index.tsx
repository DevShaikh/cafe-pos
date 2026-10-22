import React from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-hidden px-6 pb-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
