
import React from 'react';
import { Button } from '@/components/ui/button';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter = ({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        variant={selectedCategory === 'all' ? 'default' : 'outline'}
        onClick={() => onCategoryChange('all')}
        className={
          selectedCategory === 'all' 
            ? 'bg-orange-primary hover:bg-orange-primary/90 text-white border-orange-primary' 
            : 'text-dark-primary border-gray-primary hover:bg-light-primary'
        }
      >
        All Products
      </Button>
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? 'default' : 'outline'}
          onClick={() => onCategoryChange(category)}
          className={
            selectedCategory === category 
              ? 'bg-orange-primary hover:bg-orange-primary/90 text-white border-orange-primary' 
              : 'text-dark-primary border-gray-primary hover:bg-light-primary'
          }
        >
          {category}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
