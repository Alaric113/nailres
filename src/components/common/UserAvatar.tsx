import React, { useState } from 'react';

export const DEFAULT_AVATAR = 'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/user-solid.svg?alt=media&token=e5336262-2473-4888-a741-055155153a63';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  alt?: string;
}

/**
 * Robust UserAvatar component with graceful error fallback:
 * 1. Tries loading `src` (e.g. LINE CDN profile image).
 * 2. If `src` is missing or fails to load (HTTP 404 / 403 on expired LINE URLs),
 *    falls back to user's first letter initial or default SVG avatar.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  className = '',
  size = 'custom',
  alt = 'Avatar'
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    custom: ''
  };

  const initial = (name || '').trim().charAt(0).toUpperCase();

  if (!src || hasError) {
    if (initial) {
      return (
        <div
          className={`rounded-full bg-[#EFECE5] text-[#9F9586] font-bold flex items-center justify-center select-none flex-shrink-0 ${sizeClasses[size]} ${className}`}
          title={name || alt}
        >
          {initial}
        </div>
      );
    }
    return (
      <img
        src={DEFAULT_AVATAR}
        alt={alt}
        className={`rounded-full object-cover bg-gray-100 flex-shrink-0 ${sizeClasses[size]} ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`rounded-full object-cover flex-shrink-0 ${sizeClasses[size]} ${className}`}
      loading="lazy"
    />
  );
};

export default UserAvatar;
