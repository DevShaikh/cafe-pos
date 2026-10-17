import ModeToggle from "@/components/ui/mode-toggle";

const Navbar = () => {
  return (
    <div className="flex items-center justify-between p-2 bg-card">
      <h1>Cafe POS</h1>
      <ModeToggle />
    </div>
  );
};

export default Navbar;
