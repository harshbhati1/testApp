import React from 'react';

/**
 * UserAvatar component that displays a user or company avatar
 * Uses UI Avatars API for generating avatars when no image is provided
 */
const UserAvatar = ({
  name, 
  image, 
  size = 'md',
  className = '',
  background = 'random',
  color = 'fff',
  rounded = true
}) => {
  // Size mapping
  const sizeMap = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };
  
  // Pixel sizes for API
  const pixelSizeMap = {
    xs: 64,
    sm: 96,
    md: 128,
    lg: 192,
    xl: 256
  };
  
  const sizeClass = sizeMap[size] || sizeMap.md;
  const pixelSize = pixelSizeMap[size] || pixelSizeMap.md;
  
  // Generate avatar URL if no image is provided
  const avatarUrl = image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${background}&color=${color}&size=${pixelSize}${rounded ? '&rounded=true' : ''}`;
  
  return (
    <img 
      src={avatarUrl} 
      alt={name || 'User'} 
      className={`${sizeClass} rounded-full object-cover shadow-sm ${className}`}
      onError={(e) => {
        // Fallback if image fails to load
        e.target.onerror = null;
        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name ? name.charAt(0) : 'U')}&background=gray&color=${color}&size=${pixelSize}${rounded ? '&rounded=true' : ''}`;
      }}
    />
  );
};

export default UserAvatar;
