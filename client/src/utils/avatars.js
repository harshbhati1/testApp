/**
 * Avatar helper utility for generating consistent user avatars
 * Uses UI Avatars API (https://ui-avatars.com)
 */

/**
 * Generates a UI Avatars URL based on the user's name
 * @param {string} name - User's display name
 * @param {object} options - Customization options
 * @param {string} options.background - Background color (default: "random")
 * @param {string} options.color - Text color (default: "fff" - white)
 * @param {number} options.size - Image size in pixels (default: 128)
 * @param {boolean} options.rounded - Whether to use rounded avatars
 * @returns {string} - URL to the generated avatar
 */
export const getAvatarUrl = (name, options = {}) => {
  // Default options
  const {
    background = 'random',
    color = 'fff',
    size = 128,
    rounded = true
  } = options;

  // If no name is provided, use a generic avatar
  const displayName = name || 'User';
  
  // Build the query parameters
  const params = new URLSearchParams({
    name: displayName,
    background,
    color,
    size
  });

  if (rounded) {
    params.append('rounded', 'true');
  }

  return `https://ui-avatars.com/api/?${params.toString()}`;
};

/**
 * Generate an avatar for a user
 * @param {object} user - User object with name property
 * @param {object} options - Avatar options (see getAvatarUrl)
 * @returns {string} - URL to the user's avatar
 */
export const getUserAvatar = (user, options = {}) => {
  // If the user already has a logo/avatar, use that
  if (user?.logo) {
    return user.logo;
  }
  
  // For companies, use their name
  if (user?.company?.name) {
    return getAvatarUrl(user.company.name, options);
  }
  
  // Otherwise, generate an avatar from the user's name
  return getAvatarUrl(user?.name, options);
};

/**
 * Generate an avatar for a company
 * @param {object} company - Company object with name property
 * @param {object} options - Avatar options (see getAvatarUrl)
 * @returns {string} - URL to the company's avatar
 */
export const getCompanyAvatar = (company, options = {}) => {
  // If the company already has a logo, use that
  if (company?.logo) {
    return company.logo;
  }
  
  // Otherwise, generate an avatar from the company's name
  return getAvatarUrl(company?.name, {
    background: 'random',
    size: 192,
    ...options
  });
};

export default {
  getAvatarUrl,
  getUserAvatar,
  getCompanyAvatar
};
