import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Save, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface Purchase {
  id: string;
  profile_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  created_at: string;
  status: string;
  product_name?: string;
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
  const [purchases, setPurchases] = useState<Purchase[]>([]);

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

    const fetchPurchases = async () => {
      try {
        const { data, error } = await supabase
          .from("purchases")
          .select(
            "id, profile_id, product_id, quantity, total_price, created_at, status"
          )
          .eq("profile_id", user.id);

        if (error) {
          throw error;
        }

        const purchasesWithNames = await Promise.all(
          data.map(async (purchase) => {
            const { data: productData } = await supabase
              .from("products")
              .select("name")
              .eq("id", purchase.product_id)
              .single();
            return {
              ...purchase,
              product_name: productData?.name || "Unknown Product",
            };
          })
        );

        setPurchases(purchasesWithNames);
      } catch (error) {
        console.error("Error fetching purchases:", error);
        toast({
          title: "Error",
          description: "Failed to load purchase history.",
          variant: "destructive",
        });
      }
    };

    fetchProfile();
    fetchPurchases();
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
        onCartClick={() => navigate("/")}
        onSearchChange={() => {}}
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

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <p className="text-gray-600">No purchases yet.</p>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <Card key={purchase.id} className="border shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h3 className="font-medium text-dark-primary">
                              {purchase.product_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Quantity: {purchase.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-orange-primary">
                              ${purchase.total_price.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(
                                purchase.created_at
                              ).toLocaleDateString()}
                            </p>
                            <p
                              className={`text-sm ${
                                purchase.status === "completed"
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {purchase.status}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
