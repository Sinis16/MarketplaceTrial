import React from "react";
import { Button } from "@/components/ui/button";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter = ({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) => {
  // Ensure "all" is the first item if present, and avoid duplicates
  const uniqueCategories = [
    "all",
    ...categories.filter((cat) => cat !== "all"),
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {uniqueCategories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          onClick={() => onCategoryChange(category)}
          className={
            selectedCategory === category
              ? "bg-orange-primary hover:bg-orange-primary/90 text-white border-orange-primary"
              : "text-dark-primary border-gray-primary hover:bg-light-primary"
          }
        >
          {category === "all" ? "All Products" : category}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
