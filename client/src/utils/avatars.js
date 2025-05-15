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
 * @param {boolean} options.bold - Whether to use bold text (default: true)
 * @param {number} options.length - Number of characters to include (default: 2)
 * @param {string} options.colorScheme - Predefined color scheme (optional)
 * @returns {string} - URL to the generated avatar
 */
export const getAvatarUrl = (name, options = {}) => {
  // Default options
  const {
    background = 'random',
    color = 'fff',
    size = 128,
    rounded = true,
    bold = true,
    length = 2,
    colorScheme
  } = options;
  // If no name is provided, use a generic avatar
  const displayName = name || 'User';
  
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
  
  // Deterministic color generation based on name
  // This ensures the same user always gets the same color
  const generateConsistentColor = (str) => {
    if (!str) return 'gray';
    
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
  
  // Apply color scheme if specified
  let bgColor = background;
  let txtColor = color;
  
  if (colorScheme && colorSchemes[colorScheme]) {
    bgColor = colorSchemes[colorScheme].background;
    txtColor = colorSchemes[colorScheme].color;
  } else if (background === 'random' || background === 'consistent') {
    // Use consistent color generation when 'random' or 'consistent' is specified
    bgColor = generateConsistentColor(displayName);
  }
  
  // Build the query parameters
  const params = new URLSearchParams({
    name: displayName,
    background: bgColor,
    color: txtColor,
    size,
    length
  });

  if (rounded) {
    params.append('rounded', 'true');
  }
  
  if (bold) {
    params.append('bold', 'true');
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
  // If the user already has a valid logo/avatar, use that
  if (user?.logo && typeof user.logo === 'string' && user.logo.trim() !== '') {
    return user.logo;
  }
  
  // For companies, use their name
  if (user?.company?.name) {
    return getAvatarUrl(user.company.name, options);
  }
  
  // Customize default options for users
  const userDefaults = {
    background: 'consistent', // Use our consistent color generation
    length: 1,                // Use just the first letter by default
    ...options
  };
  
  // Get the most reliable identifier - prefer ID for consistency, fallback to name
  const identifier = user?.id || user?.name || 'User';
  
  // Otherwise, generate an avatar from the user's name with consistent color
  return getAvatarUrl(user?.name, userDefaults);
};

/**
 * Generate an avatar for a company
 * @param {object} company - Company object with name property
 * @param {object} options - Avatar options (see getAvatarUrl)
 * @returns {string} - URL to the company's avatar
 */
export const getCompanyAvatar = (company, options = {}) => {
  // If the company already has a valid logo, use that
  if (company?.logo && typeof company.logo === 'string' && company.logo.trim() !== '') {
    return company.logo;
  }
  
  // Customize default options for companies
  const companyDefaults = {
    background: 'consistent', // Use consistent color generation
    size: 192,                // Larger size for companies
    length: 2,                // Two letters for companies
    bold: true,
    ...options
  };
  
  // Otherwise, generate an avatar from the company's name with consistent color
  return getAvatarUrl(company?.name, companyDefaults);
};

/**
 * Generate an avatar for a reviewer (anonymous or identified)
 * @param {object} reviewer - Reviewer data with name property
 * @param {boolean} isAnonymous - Whether the reviewer is anonymous
 * @param {object} options - Avatar options
 * @returns {string} - URL to the reviewer's avatar
 */
export const getReviewerAvatar = (reviewer, isAnonymous = false, options = {}) => {
  if (isAnonymous) {
    // For anonymous reviewers, use a generic avatar with gray theme
    // We'll use the reviewer's role to ensure supplier/vendor anonymous avatars are consistent
    const rolePrefix = reviewer?.role || 'A';
    return getAvatarUrl(`${rolePrefix}-Anonymous`, {
      background: 'consistent', // Use consistent colors even for anonymous users
      length: 1,
      ...options
    });
  }
  
  // For identified reviewers
  if (reviewer?.logo) {
    return reviewer.logo;
  }
  
  // Custom defaults for reviewers
  const reviewerDefaults = {
    background: 'consistent', // Use consistent color generation
    ...options
  };
  
  return getAvatarUrl(reviewer?.name, reviewerDefaults);
};

export default {
  getAvatarUrl,
  getUserAvatar,
  getCompanyAvatar,
  getReviewerAvatar
};
