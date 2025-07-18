import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  Store,
  MapPin,
  Clock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  description: string;
}

interface CartItem extends Product {
  quantity: number;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Product not found
          </h2>
          <Button onClick={() => navigate("/")}>Go back to home</Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    const savedCart = localStorage.getItem("cartItems");
    let cartItems: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

    const existingItem = cartItems.find((item) => item.id === product.id);
    if (existingItem) {
      cartItems = cartItems.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      cartItems = [...cartItems, { ...product, quantity: 1 }];
    }

    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    console.log("Cart updated in local storage:", cartItems);

    toast({
      title: "Added to BAS cart",
      description: `${product.name} has been added to your BAS cart.`,
    });
  };

  const handleBuyNow = () => {
    const cartItems: CartItem[] = [{ ...product, quantity: 1 }];
    navigate("/checkout", { state: { cartItems } });
  };

  const seller = {
    name: "Premium Electronics Store",
    rating: 4.8,
    totalReviews: 1250,
    location: "New York, NY",
    responseTime: "within 2 hours",
    verified: true,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-lg">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-bold text-dark-primary mb-4">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-orange-primary">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating) ? "fill-current" : ""
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  ({product.reviews} reviews)
                </span>
              </div>

              <div className="text-4xl font-bold text-dark-primary mb-6">
                ${product.price.toFixed(2)}
              </div>

              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {product.description}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                className="w-full bg-orange-primary hover:bg-orange-primary/90 text-white font-medium py-3 text-lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>

              <Button
                onClick={handleBuyNow}
                variant="outline"
                className="w-full border-orange-primary text-orange-primary hover:bg-orange-primary hover:text-white py-3 text-lg"
              >
                Buy Now
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">2 Year Warranty</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Seller Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-dark-primary">
                    {seller.name}
                  </h3>
                  {seller.verified && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-orange-primary">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(seller.rating) ? "fill-current" : ""
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {seller.rating} ({seller.totalReviews} reviews)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{seller.location}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    Responds {seller.responseTime}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button variant="outline" className="w-full md:w-auto">
                  Contact Seller
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetail;
