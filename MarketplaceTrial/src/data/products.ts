
// Sample product data - in a real app, this would come from your Supabase database
export const sampleProducts = [
  {
    id: '1',
    name: 'Wireless Noise-Canceling Headphones',
    price: 299.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    rating: 4.5,
    reviews: 2847,
    category: 'Audio',
    description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life.'
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    price: 399.99,
    image: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=500&h=500&fit=crop',
    rating: 4.7,
    reviews: 1923,
    category: 'Wearables',
    description: 'Advanced fitness tracking with heart rate monitoring, GPS, and smartphone integration.'
  },
  {
    id: '3',
    name: 'Ultra-Portable Laptop',
    price: 1299.99,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop',
    rating: 4.6,
    reviews: 876,
    category: 'Computers',
    description: 'Lightweight laptop with all-day battery life and powerful performance for professionals.'
  },
  {
    id: '4',
    name: 'Professional Camera Kit',
    price: 2499.99,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=500&fit=crop',
    rating: 4.8,
    reviews: 654,
    category: 'Photography',
    description: 'Complete camera system with multiple lenses for professional photography and videography.'
  },
  {
    id: '5',
    name: 'Smart Home Hub',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop',
    rating: 4.3,
    reviews: 1456,
    category: 'Smart Home',
    description: 'Central control hub for all your smart home devices with voice control and automation.'
  },
  {
    id: '6',
    name: 'Gaming Mechanical Keyboard',
    price: 179.99,
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500&h=500&fit=crop',
    rating: 4.4,
    reviews: 2341,
    category: 'Gaming',
    description: 'RGB backlit mechanical keyboard with customizable keys and gaming-optimized switches.'
  },
  {
    id: '7',
    name: 'Wireless Charging Stand',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1609592016600-b3cf37c8f115?w=500&h=500&fit=crop',
    rating: 4.2,
    reviews: 892,
    category: 'Accessories',
    description: 'Fast wireless charging stand compatible with multiple device types and sizes.'
  },
  {
    id: '8',
    name: 'Premium Coffee Maker',
    price: 349.99,
    image: 'https://images.unsplash.com/photo-1559058789-672da06263d8?w=500&h=500&fit=crop',
    rating: 4.6,
    reviews: 1234,
    category: 'Kitchen',
    description: 'Programmable coffee maker with built-in grinder and temperature control for perfect brewing.'
  }
];

export const getUniqueCategories = () => {
  return [...new Set(sampleProducts.map(product => product.category))];
};
