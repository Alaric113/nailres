import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Service, ServiceOptionItem } from '../types/service';

export interface CartItem {
    itemId: string; // Unique ID for the cart item (timestamp + random)
    service: Service;
    selectedOptions: Record<string, ServiceOptionItem[]>; // optionId -> selected items
    totalPrice: number;
    totalDuration: number;
}

interface BookingStore {
    cart: CartItem[];
    isCartOpen: boolean; // For mobile sheet or desktop drawer if needed

    addToCart: (service: Service, selectedOptions: Record<string, ServiceOptionItem[]>) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    setIsCartOpen: (isOpen: boolean) => void;

    getCartTotal: () => number;
    getCartCount: () => number;
}

export const useBookingStore = create<BookingStore>()(
    persist(
        (set, get) => ({
            cart: [],
            isCartOpen: false,

            addToCart: (service, selectedOptions) => {
                let optionsPrice = 0;
                let optionsDuration = 0;

                Object.values(selectedOptions).flat().forEach(item => {
                    optionsPrice += item.price;
                    optionsDuration += item.duration || 0;
                });

                const newItem: CartItem = {
                    itemId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    service,
                    selectedOptions,
                    totalPrice: service.price + optionsPrice,
                    totalDuration: service.duration + optionsDuration,
                };

                set((state) => ({ cart: [...state.cart, newItem] }));
            },

            removeFromCart: (itemId) => {
                set((state) => ({
                    cart: state.cart.filter((item) => item.itemId !== itemId),
                }));
            },

            clearCart: () => set({ cart: [] }),

            setIsCartOpen: (isOpen) => set({ isCartOpen: isOpen }),

            getCartTotal: () => {
                return get().cart.reduce((total, item) => total + item.totalPrice, 0);
            },

            getCartCount: () => {
                return get().cart.length;
            }
        }),
        {
            name: 'booking-cart-storage',
        }
    )
);
