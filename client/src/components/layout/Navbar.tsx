import ModeToggle from "@/components/ui/mode-toggle";
import Link from "next/link";

const Navbar = () => {
  return (
    <div className="flex items-center justify-between p-2 bg-card">
      <div className="flex items-center gap-6">
        <Link href="/">
          <h1>Cafe POS</h1>
        </Link>
        <Link href="/products" className="text-sm font-medium">
          Products
        </Link>
      </div>
      <ModeToggle />
    </div>
  );
};

export default Navbar;
