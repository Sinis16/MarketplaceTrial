import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CreditCard, Truck, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const cartItems: CartItem[] = location.state?.cartItems || [];

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phoneNumber: "",
    deliveryInstructions: "",
    paymentMethod: "card",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  useEffect(() => {
    if (cartItems.length === 0) {
      toast({
        title: "No Products Selected",
        description:
          "Your cart is empty. Please add items to proceed with checkout.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [cartItems, navigate, toast]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Unauthorized",
        description: "Please sign in to complete the purchase.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      // Validate required fields
      if (
        !formData.email ||
        !formData.fullName ||
        !formData.address ||
        !formData.city ||
        !formData.postalCode ||
        !formData.country ||
        !formData.phoneNumber ||
        !formData.cardholderName ||
        !formData.cardNumber ||
        !formData.expiryDate ||
        !formData.cvv
      ) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Register purchases
      const purchasePromises = cartItems.map(async (item) => {
        const { error } = await supabase.from("purchases").insert({
          profile_id: user.id,
          product_id: item.id,
          quantity: item.quantity,
          total_price: item.price * item.quantity,
          status: "completed",
        });
        if (error) throw error;
      });

      await Promise.all(purchasePromises);

      toast({
        title: "Order Placed Successfully!",
        description:
          "Your order has been confirmed. You'll receive a confirmation email shortly.",
      });
      navigate("/");
      // Clear cart after successful purchase
      localStorage.removeItem("cartItems");
    } catch (error) {
      console.error("Error processing purchase:", error);
      toast({
        title: "Error",
        description: "Failed to complete the purchase. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  const maxDeliveryDate = new Date();
  maxDeliveryDate.setDate(maxDeliveryDate.getDate() + 10);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-dark-primary mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <Input
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <Input
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your phone number"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your street address"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <Input
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code *
                      </label>
                      <Input
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                        placeholder="Postal Code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country *
                      </label>
                      <Input
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required
                        placeholder="Country"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Instructions (Optional)
                    </label>
                    <Textarea
                      name="deliveryInstructions"
                      value={formData.deliveryInstructions}
                      onChange={handleInputChange}
                      placeholder="Special delivery instructions..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cardholder Name *
                    </label>
                    <Input
                      name="cardholderName"
                      value={formData.cardholderName}
                      onChange={handleInputChange}
                      required
                      placeholder="Name on card"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number *
                    </label>
                    <Input
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      required
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date *
                      </label>
                      <Input
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        required
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV *
                      </label>
                      <Input
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        required
                        placeholder="123"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full bg-orange-primary hover:bg-orange-primary/90 text-white font-medium py-3 text-lg"
              >
                Place Order
              </Button>
            </form>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-dark-primary">
                        {item.name}
                      </h3>
                      <p className="text-gray-600 text-sm">{item.category}</p>
                      <p className="font-semibold text-orange-primary">
                        ${item.price.toFixed(2)} x {item.quantity} = $
                        {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Estimated Delivery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Expected delivery between
                  </p>
                  <p className="font-semibold text-dark-primary">
                    {formatDate(deliveryDate)}
                  </p>
                  <p className="text-sm text-gray-600">and</p>
                  <p className="font-semibold text-dark-primary">
                    {formatDate(maxDeliveryDate)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
