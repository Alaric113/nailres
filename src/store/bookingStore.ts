import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Service, ServiceOptionItem } from '../types/service';
import type { ActiveFollowUp } from '../types/user';

export interface CartItem {
    itemId: string; // Unique ID for the cart item (timestamp + random)
    service: Service;
    selectedOptions: Record<string, ServiceOptionItem[]>; // optionId -> selected items
    totalPrice: number;
    totalDuration: number;
    // Follow-up service fields
    followUpId?: string; // If this item is from a follow-up
    followUpDiscount?: number; // Discount rate applied (e.g., 0.5 for 50%)
    originalFollowUp?: ActiveFollowUp; // Reference to the follow-up eligibility
}

interface BookingStore {
    cart: CartItem[];
    isCartOpen: boolean; // For mobile sheet or desktop drawer if needed

    addToCart: (service: Service, selectedOptions: Record<string, ServiceOptionItem[]>) => void;
    addFollowUpToCart: (followUp: ActiveFollowUp, discountRate: number, service: Service) => void;
    updateFollowUpPrices: (bookingDate: Date) => void; // Update prices based on selected date
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    setIsCartOpen: (isOpen: boolean) => void;

    getCartTotal: () => number;
    getCartCount: () => number;
    getFollowUpIds: () => string[]; // Get all follow-up IDs in cart
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
                    // Use quantity if available, default to 1
                    const qty = item.quantity || 1;
                    optionsPrice += item.price * qty;
                    optionsDuration += (item.duration || 0) * qty;
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

            addFollowUpToCart: (followUp, discountRate, service) => {
                // Calculate discounted price
                const discountedPrice = Math.round(followUp.originalPrice * discountRate);
                
                const newItem: CartItem = {
                    itemId: `followup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    service: {
                        ...service,
                        name: followUp.followUpName,
                        price: discountedPrice,
                    },
                    selectedOptions: {},
                    totalPrice: discountedPrice,
                    totalDuration: service.duration,
                    followUpId: followUp.id,
                    followUpDiscount: discountRate,
                    originalFollowUp: followUp,
                };

                set((state) => ({ cart: [...state.cart, newItem] }));
            },

            updateFollowUpPrices: (bookingDate: Date) => {
                set((state) => {
                    const updatedCart = state.cart.map(item => {
                        if (!item.originalFollowUp) return item; // Not a follow-up item
                        
                        const followUp = item.originalFollowUp;
                        // Handle both Timestamp (with toDate) and serialized object (with seconds) formats
                        const completedAt = followUp.completedAt;
                        const completedDate = typeof completedAt.toDate === 'function'
                            ? completedAt.toDate()
                            : new Date((completedAt as any).seconds * 1000);
                        const daysDiff = Math.floor((bookingDate.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
                        
                        // Sort tiers by days
                        const sortedTiers = [...followUp.pricingTiers].sort((a, b) => a.withinDays - b.withinDays);
                        
                        // Find applicable tier
                        let discountRate = sortedTiers[sortedTiers.length - 1]?.discountRate || 1;
                        for (const tier of sortedTiers) {
                            if (daysDiff <= tier.withinDays) {
                                discountRate = tier.discountRate;
                                break;
                            }
                        }
                        
                        const newPrice = Math.round(followUp.originalPrice * discountRate);
                        
                        return {
                            ...item,
                            totalPrice: newPrice,
                            followUpDiscount: discountRate,
                            service: {
                                ...item.service,
                                price: newPrice,
                            },
                        };
                    });
                    
                    return { cart: updatedCart };
                });
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
            },

            getFollowUpIds: () => {
                return get().cart
                    .filter(item => item.followUpId)
                    .map(item => item.followUpId!);
            }
        }),
        {
            name: 'booking-cart-storage',
        }
    )
);
