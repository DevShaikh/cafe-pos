import { ThemeProvider } from "@/components/providers/theme-provider";

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </div>
  );
};

export default Providers;
