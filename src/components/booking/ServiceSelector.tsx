import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useServices } from '../../hooks/useServices';
import { useServiceCategories } from '../../hooks/useServiceCategories';
import { useGlobalSettings } from '../../hooks/useGlobalSettings';
import type { Service } from '../../types/service';
import type { ActivePass } from '../../types/user';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../common/LoadingSpinner';
import CartSidebar from './CartSidebar';
import MobileCartBar from './MobileCartBar';
import { SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';


import type { PlanContentItem } from '../../types/seasonPass';

// Skeleton Card Component
const ServiceCardSkeleton = () => (
    <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex gap-4 animate-pulse">
        <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/4 mb-2" />
            </div>
            <div className="h-5 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="w-24 h-24 rounded-lg bg-gray-200 shrink-0" />
    </div>
);

interface ServiceSelectorProps {
    initialCategory?: string | null;
    onNext: () => void;
    onServiceClick: (service: Service) => void;
    passMode?: boolean; // When true, show only isPlanOnly services
    hasActivePass?: boolean; // When true, show '季卡方案' category first
    activePass?: ActivePass | null;
    passContentItems?: PlanContentItem[];
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onNext, onServiceClick, passContentItems, hasActivePass = false, activePass }) => {
    const [searchParams] = useSearchParams();
    const { services, isLoading, error } = useServices();
    const { categories } = useServiceCategories();
    const { userProfile } = useAuthStore();
    const { settings } = useGlobalSettings();
    const promo = settings.seasonPassPromo;

    const [activeCategory, setActiveCategory] = useState<string>('全部');
    const [imagesLoaded, setImagesLoaded] = useState(false);

    // Get all service images that need to be loaded
    const serviceImages = services.filter(s => s.available && s.imageUrl).map(s => s.imageUrl!);
    const totalImages = serviceImages.length;

    // Preload all images
    useEffect(() => {
        if (totalImages === 0) {
            setImagesLoaded(true);
            return;
        }

        setImagesLoaded(false);

        const imagePromises = serviceImages.map(src => {
            return new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Still resolve on error to not block loading
                img.src = src;
            });
        });

        Promise.all(imagePromises).then(() => {
            setImagesLoaded(true);
        });
    }, [services]);

    // Initialize active category from URL or Default
    useEffect(() => {
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
            setActiveCategory(categoryParam);
        } else {
            // Only reset to '全部' if no param is explicitly cleared? 
            // Logic: If on page load we have no param, we show '全部'.
            // If we have param, show that.
            // We set default state to '全部' already.
            // But if we navigate properly we want to update it.
            setActiveCategory('全部');
        }
    }, [searchParams]);

    const handleCategoryChange = (category: string) => {
        setActiveCategory(category);
        // Optional: Update URL? maybe not needed for user flow within SPA, but good for shareable links
        // setSearchParams({ category }); // Use with caution if preserving other params
    };

    if (isLoading) {
        return <div className="flex justify-center p-4"><LoadingSpinner /></div>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    const getPriceForUser = (service: Service) => {
        if (userProfile?.role === 'platinum' && service.platinumPrice) {
            return { price: service.platinumPrice, isPlatinum: true, originalPrice: service.price };
        }
        return { price: service.price, isPlatinum: false };
    };

    const groupedServices = services
        .filter(s => {
            if (!s.available) return false;
            // Always exclude plan-only services from main groups (they go to '季卡專屬')
            return !s.isPlanOnly;
        })
        .reduce((acc, service) => {
            const category = service.category || '其他';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(service);
            return acc;
        }, {} as Record<string, Service[]>);


    // Get Plan Only Services for the special category
    const planOnlyServices = services.filter(s => s.available && s.isPlanOnly);

    // 確保分類順序
    const sortedCategories = Object.keys(groupedServices).sort((a, b) => {
        const indexA = categories.findIndex(c => c.name === a);
        const indexB = categories.findIndex(c => c.name === b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    const displayCategories = hasActivePass
        ? ['全部', '季卡專屬', ...sortedCategories]
        : ['全部', ...sortedCategories];



    const categoriesToShow = activeCategory === '全部'
        ? (hasActivePass ? ['季卡專屬', ...sortedCategories] : sortedCategories)
        : activeCategory === '季卡專屬'
            ? ['季卡專屬']
            : sortedCategories.filter(c => c === activeCategory);

    return (
        <div className="flex bg-[#FAF9F6] h-full overflow-hidden relative ">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">

                {/* Category Tabs - Static in Flex Column */}
                <div className="bg-[#FAF9F6] z-30 shadow-sm border-b border-gray-200 overflow-x-auto no-scrollbar flex-none">
                    <div className="flex px-4 items-center h-14 space-x-6 whitespace-nowrap">
                        {displayCategories.map(category => (
                            <button
                                key={category}
                                onClick={() => handleCategoryChange(category)}
                                className={`
                                h-full relative px-1 font-medium text-sm transition-colors
                                ${activeCategory === category
                                        ? 'text-[#2C2825] font-bold'
                                        : 'text-gray-400 hover:text-gray-600'
                                    }
                            `}
                            >
                                {category}
                                {activeCategory === category && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2C2825]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Service List */}
                <div className="flex-1 overflow-y-auto pb-24">
                    {/* Season Pass Promo Card - Only for non-pass users */}
                    {!hasActivePass && promo?.enabled && promo.title && (
                        <div className="max-w-3xl mx-auto px-4 pt-4">
                            <Link
                                to={promo.ctaLink || '/member/pass'}
                                className="block bg-[#9F9586]  rounded-2xl px-2 py-3 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="grid grid-cols-5 gap-4">
                                    {promo.imageUrl ? (
                                        <div className="col-span-2 flex-1 rounded-xl bg-gray-100 overflow-hidden border border-gray-100">
                                            <img src={promo.imageUrl} alt="Promo" className="w-full h-full object-cover" loading="lazy" />
                                        </div>
                                    ) : (
                                        <div className="col-span-2 w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center shrink-0">
                                            <SparklesIcon className="w-6 h-6 text-white" />
                                        </div>
                                    )}
                                    <div className=" col-span-3 min-w-0">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                                            {promo.title}
                                        </h3>
                                        {promo.description && (
                                            <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">
                                                {promo.description}
                                            </p>
                                        )}
                                        <div >
                                            <span className="flex pt-4 justify-end items-end flex-1 gap-1 text-sm font-semibold text-white group-hover:gap-2 transition-all">
                                                {promo.ctaText || '了解更多'}
                                                <ArrowRightIcon className="w-4 h-4" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )}
                    <div className="max-w-3xl mx-auto p-4 space-y-8">
                        {/* Show skeletons while loading images */}
                        {!imagesLoaded ? (
                            <>
                                {['skeleton-1', 'skeleton-2'].map(key => (
                                    <div key={key} className="pb-8 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-4 mb-6 px-2">
                                            <div className="h-7 bg-gray-200 rounded w-24 animate-pulse" />
                                            <div className="h-px bg-gray-100 flex-1" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[1, 2, 3, 4].map(i => (
                                                <ServiceCardSkeleton key={i} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            categoriesToShow.map(category => {
                                // Determine which services to show for this category
                                const categoryServices = category === '季卡專屬'
                                    ? planOnlyServices
                                    : groupedServices[category] || [];

                                if (categoryServices.length === 0) return null;

                                return (
                                    <div
                                        key={category}
                                        className="pb-8 border-b border-gray-100 last:border-0"
                                    >
                                        <div className="flex items-center gap-4 mb-6 px-2 w-f">
                                            <h3 className="text-2xl font-sans font-bold text-primary-dark tracking-wide">
                                                {category}
                                            </h3>
                                            <div className="h-px bg-primary/20 flex-1"></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {categoryServices.map((service: Service) => {
                                                const { price, isPlatinum, originalPrice } = getPriceForUser(service);

                                                // Logic: Find the content item that maps to this service ID
                                                let remainingCount = undefined;
                                                if (activePass) {
                                                    // Default: use service ID (fallback)
                                                    remainingCount = activePass.remainingUsages?.[service.id];



                                                    // If we have mapping, try to find specific item
                                                    if (passContentItems) {
                                                        const contentItem = passContentItems.find(item => item.serviceId === service.id);

                                                        if (contentItem) {
                                                            remainingCount = activePass.remainingUsages?.[contentItem.id];

                                                        }
                                                    }
                                                }

                                                const isDisabled = remainingCount === 0;

                                                return (
                                                    <div
                                                        key={service.id}
                                                        onClick={() => !isDisabled && onServiceClick(service)}
                                                        className={`
                                                p-4 rounded-xl border shadow-sm transition-all flex gap-4 group relative
                                                ${isDisabled
                                                                ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed grayscale'
                                                                : 'bg-white border-gray-100 hover:shadow-md cursor-pointer'
                                                            }
                                            `}
                                                    >
                                                        {remainingCount !== undefined && (
                                                            <div className="absolute top-2 right-2 z-10">
                                                                {remainingCount === -1 ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border shadow-sm bg-purple-100 text-purple-800 border-purple-200">
                                                                        季卡權益
                                                                    </span>
                                                                ) : remainingCount > 0 ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border shadow-sm bg-amber-100 text-amber-800 border-amber-200">
                                                                        剩餘 {remainingCount} 次
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border shadow-sm bg-red-50 text-red-500 border-red-100">
                                                                        已用完 (0次)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {/* Text Content */}
                                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                            <div>
                                                                <div>
                                                                    <h4 className="font-bold text-text-main text-lg mb-1 group-hover:text-primary transition-colors">
                                                                        {service.name}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                                                                        {service.duration} 分鐘
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className={`flex items-baseline gap-2 ${price == 0 ? 'hidden' : ''}`}>
                                                                <span className={`text-lg font-serif font-bold`}>
                                                                    ${isPlatinum ? originalPrice : price}<span className={`text-xs `}> 起</span>
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Image */}
                                                        {service.imageUrl ? (
                                                            <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                                <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-24 h-24 rounded-lg  flex items-center justify-center text-gray-300 shrink-0">

                                                            </div>
                                                        )}

                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar Cart (Desktop) */}
            <div className="hidden lg:block w-96 shrink-0 h-full relative z-30">
                <CartSidebar onNext={onNext} />
            </div>

            {/* Mobile Floating Bar */}
            <div className="lg:hidden">
                <MobileCartBar onNext={onNext} />
            </div>

        </div>
    );
};
export default ServiceSelector;