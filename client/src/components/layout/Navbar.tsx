import ModeToggle from "@/components/ui/mode-toggle";

const Navbar = () => {
  return (
    <header className="flex h-24 shrink-0 items-center justify-between px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Cashier Station · Live Session
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Ready for the next receipt
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-sm font-medium text-muted-foreground">
          PKR Currency Active
        </div>
        <ModeToggle />
      </div>
    </header>
  );
};

export default Navbar;
