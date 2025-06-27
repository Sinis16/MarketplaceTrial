import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom"; // Add useLocation
import Header from "@/components/Header";
import CategoryFilter from "@/components/CategoryFilter";
import ProductGrid from "@/components/ProductGrid";
import Cart from "@/components/Cart";
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

const BrowseProducts = () => {
  const location = useLocation(); // Get the current location
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem("cartItems");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Failed to parse cartItems from local storage:", error);
      return [];
    }
  });
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const { toast } = useToast();

  // Extract search query from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("search") || "";
    setSearchQuery(decodeURIComponent(query));
  }, [location.search]);

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
      title: "Added to BAS cart",
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
        onCartClick={() => setIsMobileCartOpen(true)}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery} // Pass searchQuery to Header
      />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 justify-center">
          <div className="flex-1 max-w-4xl">
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
          </div>

          <div className="lg:w-80">
            <div className="hidden lg:block sticky top-4">
              <Cart
                isOpen={true}
                onClose={() => {}}
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
              />
            </div>
            <div className="lg:hidden">
              <Cart
                isOpen={isMobileCartOpen}
                onClose={() => setIsMobileCartOpen(false)}
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BrowseProducts;
