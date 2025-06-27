import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Save, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";

interface ProfileData {
  id: string;
  avatar_url: string | null;
  created_at: string;
  email: string | null;
  full_name: string | null;
  updated_at: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem("cartItems");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Failed to parse cartItems from local storage:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
      console.log("Cart saved to local storage:", cartItems);
    } catch (error) {
      console.error("Failed to save cartItems to local storage:", error);
      toast({
        title: "Storage Error",
        description: "Failed to save cart. Please try again.",
        variant: "destructive",
      });
    }
  }, [cartItems, toast]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      toast({
        title: "Unauthorized",
        description: "Please sign in to view your profile.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          throw error;
        }

        setProfile(data);
        setFullName(data.full_name || "");
        setAvatarUrl(data.avatar_url || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
      }
    };

    fetchProfile();
  }, [user, loading, navigate, toast]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        cartCount={cartCount}
        onCartClick={() => navigate("/")} // Navigate to Index for CartModal
        onSearchChange={() => {}} // No search on Profile page
      />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile avatar"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-dark-primary">
                {fullName || "User"}
              </h2>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-dark-primary"
              >
                Full Name
              </label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="avatarUrl"
                className="block text-sm font-medium text-dark-primary"
              >
                Avatar URL
              </label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Enter an image URL"
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-orange-primary hover:bg-orange-primary/90 text-white"
            >
              <Save className="w-5 h-5 mr-2" />
              {isUpdating ? "Saving..." : "Save Profile"}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/")}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Back Home
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
