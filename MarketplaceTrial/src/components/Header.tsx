import React, { useState, useEffect } from "react";
import { Search, ShoppingCart, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onSearchChange: (query: string) => void;
  searchQuery?: string; // Add searchQuery prop
}

const Header = ({
  cartCount,
  onCartClick,
  onSearchChange,
  searchQuery,
}: HeaderProps) => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchQuery || ""); // Initialize with searchQuery

  // Sync searchInput with searchQuery prop
  useEffect(() => {
    setSearchInput(searchQuery || "");
  }, [searchQuery]);

  useEffect(() => {
    if (!user || loading) {
      setAvatarUrl(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setAvatarUrl(data.avatar_url);
      } catch (error) {
        console.error("Error fetching avatar:", error);
      }
    };

    fetchProfile();
  }, [user, loading]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearchChange(searchInput);
      if (location.pathname !== "/browse") {
        navigate(`/browse?search=${encodeURIComponent(searchInput)}`);
      }
    }
  };

  const isBrowsePage = location.pathname === "/browse";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 bg-orange-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <h1 className="text-2xl font-bold text-dark-primary font-archivo">
              NextMart
            </h1>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-primary w-5 h-5" />
              <Input
                placeholder="Search products, brands, or ask AI..."
                className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-orange-primary focus:ring-orange-primary font-archivo"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {!loading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-dark-primary hover:text-primary-foreground hover:[&>svg]:stroke-primary-foreground"
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Profile avatar"
                            className="w-10 h-10 mr-2 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 mr-2" />
                        )}
                        {getDisplayName()}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate("/profile")}>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-dark-primary hover:text-primary-foreground hover:[&>svg]:stroke-primary-foreground"
                    onClick={() => navigate("/auth")}
                  >
                    <User className="w-10 h-10 mr-2" />
                    Sign In
                  </Button>
                )}
              </>
            )}

            {!isBrowsePage && (
              <Button
                variant="ghost"
                size="sm"
                className="relative text-dark-primary hover:text-primary-foreground hover:[&>svg]:stroke-primary-foreground"
                onClick={onCartClick}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
