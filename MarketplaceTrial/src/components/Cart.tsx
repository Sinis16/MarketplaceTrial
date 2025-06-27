import React from "react";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

const Cart: React.FC<CartProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = () => {
    if (items.length === 0) {
      toast({
        title: "No Products Selected",
        description: "Please add items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }
    navigate("/checkout", { state: { cartItems: items } });
    onClose();
  };

  return (
    <div
      className={`${
        isOpen ? "translate-x-0" : "translate-x-full"
      } lg:translate-x-0 fixed lg:static top-0 right-0 h-full lg:h-auto w-full sm:w-80 bg-white shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out z-50`}
    >
      <div className="flex h-full flex-col p-4">
        <div className="flex items-center justify-between mb-4 border-b lg:border-b-0">
          <h2 className="text-lg font-semibold text-dark-primary">
            Shopping Cart
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-gray-primary mb-4" />
              <p className="text-gray-primary">Your cart is empty</p>
              <p className="text-sm text-gray-primary mt-2">
                Add some products to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm mb-1 text-dark-primary">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-primary mb-2">
                        ${item.price.toFixed(2)}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() =>
                              onUpdateQuantity(
                                item.id,
                                Math.max(0, item.quantity - 1)
                              )
                            }
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center text-dark-primary">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() =>
                              onUpdateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-dark-primary">
                Total:
              </span>
              <span className="text-2xl font-bold text-orange-primary">
                ${total.toFixed(2)}
              </span>
            </div>
            <Button
              onClick={handleCheckout}
              className="w-full bg-orange-primary hover:bg-orange-primary/90 text-white font-medium py-3"
              disabled={items.length === 0}
            >
              Proceed to Checkout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
