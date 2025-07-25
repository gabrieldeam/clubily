// CartContext.tsx
'use client';

import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  image_url?: string;
  points_cost: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  incrementItem: (id: string) => void;
  decrementItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalPoints: number;
}

const CartContext = createContext<CartContextType>(null!);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) setItems(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
  };

  const incrementItem = (id: string) => {
    setItems(prev =>
      prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i)
    );
  };

  const decrementItem = (id: string) => {
    setItems(prev =>
      prev
        .map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => setItems([]);

  const totalPoints = items.reduce((sum, i) => sum + i.points_cost * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      incrementItem,
      decrementItem,
      removeItem,
      clearCart,
      totalPoints
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
