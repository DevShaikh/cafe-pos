import { TooltipProvider } from "@/components/ui/tooltip";
import QueryProvider from "./query-provider";
import ThemeProvider from "./theme-provider";

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </QueryProvider>
  );
};

export default Providers;
