import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider
      style={{ "--sidebar-width-icon": "4.5rem" } as React.CSSProperties}
    >
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar />
        <SidebarInset className="bg-background">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
