import React, { useState, useEffect } from 'react';

/**
 * UserAvatar component that displays a user or company avatar
 * Uses UI Avatars API for generating avatars when no image is provided
 * Features optimized loading and enhanced customization options
 */
const UserAvatar = ({
  name, 
  image, 
  size = 'md',
  className = '',
  background = 'consistent', // Changed to 'consistent' as default
  color = 'fff',
  colorScheme,
  rounded = true,
  bold = true,  length = 1,  // Number of characters to use in the avatar (changed default to 1)
  loading = 'lazy'  // Lazy loading for better performance
}) => {
  const [imageError, setImageError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Check if the image is valid on mount
  useEffect(() => {
    // Validate image URL if provided
    if (image && typeof image === 'string' && image.trim() !== '') {
      // Preload image to check if it's valid
      const img = new Image();
      img.onload = () => setImageError(false);
      img.onerror = () => setImageError(true);
      img.src = image;
    } else if (image === null || image === undefined || image === '') {
      // Explicitly set imageError if image is empty/null
      setImageError(true);
    }
  }, [image]);
  
  // Deterministic color generation based on name
  // This ensures the same user always gets the same color
  const generateConsistentColor = (str) => {
    if (!str) return '718096'; // Default gray
    
    // List of vibrant colors that work well as avatar backgrounds
    const colors = [
      '6b46c1', // Purple
      '3182ce', // Blue
      '38a169', // Green
      'e53e3e', // Red
      'd97706', // Amber
      '319795', // Teal
      'dd6b20', // Orange
      '805ad5', // Light Purple
      '2b6cb0', // Dark Blue
      '2c7a7b', // Dark Teal
      '975a16', // Brown
      'b7791f'  // Gold
    ];
    
    // Hash the name to get a consistent index
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert to positive number and get modulo the array length
    const index = Math.abs(hash % colors.length);
    return colors[index];
  };
  
  // Size mapping
  const sizeMap = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
    '2xl': 'w-48 h-48'
  };
  
  // Pixel sizes for API
  const pixelSizeMap = {
    xs: 64,
    sm: 96,
    md: 128,
    lg: 192,
    xl: 256,
    '2xl': 384
  };
  
  // Predefined color schemes
  const colorSchemes = {
    purple: { background: '6b46c1', color: 'fff' },
    blue: { background: '3182ce', color: 'fff' },
    green: { background: '38a169', color: 'fff' },
    red: { background: 'e53e3e', color: 'fff' },
    gray: { background: '718096', color: 'fff' },
    amber: { background: 'd97706', color: 'fff' },
    teal: { background: '319795', color: 'fff' },
    dark: { background: '1a202c', color: 'fff' },
    light: { background: 'f7fafc', color: '4a5568' }
  };
    const sizeClass = sizeMap[size] || sizeMap.md;
  const pixelSize = pixelSizeMap[size] || pixelSizeMap.md;
  
  // Set background and color based on colorScheme if provided
  let bgColor = background;
  let txtColor = color;
  
  if (colorScheme && colorSchemes[colorScheme]) {
    bgColor = colorSchemes[colorScheme].background;
    txtColor = colorSchemes[colorScheme].color;
  } else if (background === 'consistent') {
    // Use consistent color generation based on name
    bgColor = generateConsistentColor(name);
  }  // Generate avatar URL when component mounts or inputs change
  useEffect(() => {
    try {
      // Always generate avatar for consistent look across the app
      if (image === undefined || image === null || image === '' || 
          typeof image !== 'string' || image.trim() === '' || imageError) {        
        // Generate UI Avatar
        // Make sure we have valid values with fallbacks
        // For consistent background, ALWAYS use generateConsistentColor
        const consistentBgColor = background === 'consistent' ? generateConsistentColor(name) : (bgColor || '718096');
        const safeColor = txtColor || 'fff';        // Default white if txtColor is undefined
        
        // Always force uppercase and use only the first character for consistency
        const safeName = ((name || 'User').toUpperCase()).charAt(0);
        
        // Build the query parameters
        const params = new URLSearchParams({
          name: safeName,
          background: consistentBgColor,
          color: safeColor,
          size: pixelSize,
          length: 1, // Always force length=1 for consistency
          uppercase: 'true' // Always use uppercase letters for consistency
        });
        
        if (rounded) params.append('rounded', 'true');
        if (bold) params.append('bold', 'true');
        
        setAvatarUrl(`https://ui-avatars.com/api/?${params.toString()}`);
      } else {
        // Use the provided image URL
        setAvatarUrl(image);
      }
    } catch (error) {
      console.error('Error generating avatar URL:', error);
      // Fallback to a very simple avatar URL if anything goes wrong
      setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent('U')}&background=718096&color=fff&size=${pixelSize}`);
    }
  }, [name, image, imageError, bgColor, txtColor, pixelSize, rounded, bold]);
  
  return (
    <img 
      src={avatarUrl} 
      alt={name || 'User'} 
      loading={loading}
      className={`${sizeClass} rounded-full object-cover shadow-sm ${className}`}      onError={(e) => {
        // Fallback if image fails to load
        e.target.onerror = null;
        setImageError(true);
        try {
          // Try to use safe values - ensuring we get just the first letter for consistent look
          const safeFirstChar = name && typeof name === 'string' ? name.charAt(0).toUpperCase() : 'U';
          // For consistent background, always use generateConsistentColor with the name
          const consistentBgColor = background === 'consistent' ? generateConsistentColor(name) : (bgColor || '718096');
          const safeColor = txtColor || 'fff';
          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(safeFirstChar)}&background=${consistentBgColor}&color=${safeColor}&size=${pixelSize}&rounded=true&length=1`;
        } catch (error) {
          console.error('Error in avatar fallback:', error);
          // Ultimate fallback - gray box with 'U'
          e.target.src = `https://ui-avatars.com/api/?name=U&background=718096&color=fff&size=${pixelSize}&rounded=true&length=1`;
        }
      }}
    />
  );
};

export default UserAvatar;
