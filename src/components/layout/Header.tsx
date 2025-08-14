import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

// A hoverable user menu: opens on hover of avatar and stays while hovering menu
export function Header() {
  const { isAuthenticated, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const hoverTimeout = useRef<number | null>(null);

  const handleOpen = () => {
    if (hoverTimeout.current) window.clearTimeout(hoverTimeout.current);
    setOpen(true);
  };
  const handleClose = () => {
    if (hoverTimeout.current) window.clearTimeout(hoverTimeout.current);
    hoverTimeout.current = window.setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          {/* <img
            src="/lovable-uploads/dd5214b6-f0ae-465c-be62-f98bdadb9881.png"
            alt="KidsRise Logo"
            className="h-8 w-auto"
          /> */}
          <span className="hidden sm:inline-block text-lg">KidsRise</span>
        </Link>

        <div className="flex items-center gap-4">
          {!isAuthenticated && (
            <Button asChild size="sm" variant="outline">
              <Link to="/auth">
                <UserRound className="h-4 w-4 mr-1" /> Sign In
              </Link>
            </Button>
          )}
          {isAuthenticated && (
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={() => setOpen(o => !o)}
                  onMouseEnter={handleOpen}
                  onMouseLeave={handleClose}
                  className="outline-none"
                >
                  <Avatar className="h-9 w-9 ring-2 ring-transparent hover:ring-primary/40 transition">
                    <AvatarImage
                      src={
                        user?.user_metadata?.avatar_url as string | undefined
                      }
                    />
                    <AvatarFallback>
                      {(user?.email || "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onMouseEnter={handleOpen}
                onMouseLeave={handleClose}
                className="w-56"
              >
                <DropdownMenuLabel className="text-xs font-normal">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Signed in as</span>
                    <span className="truncate font-medium text-foreground">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
