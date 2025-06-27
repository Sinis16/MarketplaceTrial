import React from "react";
import ProductCard from "./ProductCard";

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

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

const ProductGrid = ({
  products,
  onAddToCart,
  onViewDetails,
}: ProductGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
