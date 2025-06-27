import React, { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import CategoryFilter from "@/components/CategoryFilter";
import ProductGrid from "@/components/ProductGrid";
import Cart from "@/components/Cart";
import VoiceAssistant from "@/components/VoiceAssistant";
import { sampleProducts, getUniqueCategories } from "@/data/products";
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

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Load cartItems from local storage on mount with error handling
    try {
      const savedCart = localStorage.getItem("cartItems");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Failed to parse cartItems from local storage:", error);
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  // Save cartItems to local storage whenever it changes
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

  const categories = getUniqueCategories();

  const filteredProducts = useMemo(() => {
    let filtered = sampleProducts;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery]);

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      const newItems = [...prev, { ...product, quantity: 1 }];
      console.log("Cart updated:", newItems);
      return newItems;
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your BAS cart.`,
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      handleRemoveItem(id);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: "Item removed",
      description: "Item has been removed from your BAS cart.",
    });
  };

  const handleViewDetails = (product: Product) => {
    console.log("View product details:", product);
    toast({
      title: "Product Details",
      description: `Viewing details for ${product.name}`,
    });
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        onSearchChange={setSearchQuery}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold mb-4">Shop Smarter with AI</h1>
            <p className="text-xl mb-6 text-blue-100">
              Discover products with our voice-enabled AI assistant. Ask
              questions, get recommendations, and shop with confidence.
            </p>
            <div className="flex gap-4">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Try Voice Search
              </button>
              <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">
                Browse Products
              </button>
            </div>
          </div>
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {searchQuery && (
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredProducts.length} results for "{searchQuery}"
            </p>
          </div>
        )}

        {filteredProducts.length > 0 ? (
          <ProductGrid
            products={filteredProducts}
            onAddToCart={handleAddToCart}
            onViewDetails={handleViewDetails}
          />
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No products found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or browse different categories
            </p>
          </div>
        )}

        <div className="mt-16 bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 text-center">
            AI-Powered Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-semibold">🎯</span>
              </div>
              <h3 className="font-semibold mb-2">Personalized Picks</h3>
              <p className="text-sm text-gray-600">
                Products tailored to your preferences and browsing history
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-semibold">🗣️</span>
              </div>
              <h3 className="font-semibold mb-2">Voice Shopping</h3>
              <p className="text-sm text-gray-600">
                Ask questions and get instant product recommendations
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-semibold">✨</span>
              </div>
              <h3 className="font-semibold mb-2">Smart Suggestions</h3>
              <p className="text-sm text-gray-600">
                Discover products you didn't know you needed
              </p>
            </div>
          </div>
        </div>
      </main>

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      <VoiceAssistant
        onAddToCart={handleAddToCart}
        onFilterProducts={setSearchQuery}
      />
    </div>
  );
};

export default Index;
