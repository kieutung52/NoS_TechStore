import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { cartService } from '@/services/cartService';
import type { CartResponse, AddCartItemRequest, ProductResponse } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AddToCartModal } from '@/components/AddToCartModal';

interface CartContextType {
  cart: CartResponse | null;
  addToCart: (item: AddCartItemRequest) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeFromCart: (variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  loading: boolean;
  
  openAddToCartModal: (product: ProductResponse) => void;
  closeAddToCartModal: () => void;
  modalProduct: ProductResponse | null;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const [modalProduct, setModalProduct] = useState<ProductResponse | null>(null);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) { 
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const response = await cartService.getCart();
      if (response.success) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]); 

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated, refreshCart]); 

  const addToCart = async (item: AddCartItemRequest) => {
    try {
      const response = await cartService.addItem(item);
      if (response.success) {
        setCart(response.data);
        toast({
          title: "Thêm vào giỏ hàng thành công",
          description: "Sản phẩm đã được thêm vào giỏ hàng",
        });
        setModalProduct(null); 
      }
    } catch (error) {
      toast({
        title: "Thêm vào giỏ hàng thất bại",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (variantId: string, quantity: number) => {
    try {
      const response = await cartService.updateItem(variantId, { quantity });
      if (response.success) {
        setCart(response.data);
      }
    } catch (error) {
      toast({
        title: "Cập nhật giỏ hàng thất bại",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (variantId: string) => {
    try {
      const response = await cartService.removeItem(variantId);
      if (response.success) {
        await refreshCart();
        toast({
          title: "Đã xóa sản phẩm",
          description: "Sản phẩm đã được xóa khỏi giỏ hàng",
        });
      }
    } catch (error) {
      toast({
        title: "Xóa sản phẩm thất bại",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    try {
      const response = await cartService.clearCart();
      if (response.success) {
        setCart(null); 
        await refreshCart();
        toast({
          title: "Đã xóa giỏ hàng",
          description: "Tất cả sản phẩm đã được xóa khỏi giỏ hàng",
        });
      }
    } catch (error) {
      toast({
        title: "Xóa giỏ hàng thất bại",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const openAddToCartModal = (product: ProductResponse) => {
    setModalProduct(product);
  };
  
  const closeAddToCartModal = () => {
    setModalProduct(null);
  };

  const value: CartContextType = {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    loading,
    
    openAddToCartModal,
    closeAddToCartModal,
    modalProduct,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <AddToCartModal />
    </CartContext.Provider>
  );
};