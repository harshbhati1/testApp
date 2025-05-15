# Vendor-Supplier Verification (VSV)

A platform for verifying vendor-supplier relationships through anonymous reviews and payment tracking.

## Description
VSV is a public platform where companies can look up vendors, read anonymous ratings, and track payment requests. Suppliers can open payment requests, vendors can mark them as paid, and both parties can leave anonymous reviews after confirmation.

## Tech Stack
- Frontend: React 18 (Vite) + Tailwind CSS + DaisyUI (cyberpunk theme)
- Backend: Node.js + Express + MongoDB
- External APIs: UI Avatars (for profile/company images)

## Features
- User authentication and role-based access (suppliers and vendors)
- Company profiles with ratings and reviews
- Payment request system with status tracking
- Anonymous review system for confirmed transactions
- Dynamic user and company avatars via UI Avatars API
- Responsive UI with mobile and desktop support

## UI Avatars Integration
The application uses UI Avatars API to generate profile images and company logos:
- Automatically generates avatars based on user or company names
- Implements consistent color generation:
  - Same user/company has the same avatar color across all application views
  - Colors are deterministically generated from user/company names
  - Ensures visual consistency for user identification across the platform
- Supports extensive customization options:
  - Multiple size presets (xs, sm, md, lg, xl, 2xl)
  - Predefined color schemes (purple, blue, green, red, amber, teal, gray, dark, light)
  - Custom background and text colors
  - Control over avatar shape (rounded/square)
  - Text customization (bold, character length)
- Performance optimizations:
  - Lazy loading support for images
  - Error handling with graceful fallbacks
  - Efficient React state management
- Consistent styling across the application
- Reusable components:
  - `UserAvatar` component for displaying avatars
  - `ReviewItem` component for consistent review display
  - `avatars.js` utilities for generating avatar URLs

### Avatar Utility Functions
- `getAvatarUrl()`: Base function for generating avatar URLs
- `getUserAvatar()`: User-specific avatar generation with consistent colors
- `getCompanyAvatar()`: Company-specific avatar generation with consistent colors
- `getReviewerAvatar()`: Reviewer avatar generation with anonymous support

### Color Consistency
The avatar system uses a deterministic color generation algorithm that ensures:
- Each user/company gets a unique but consistent color across the entire application
- Colors are derived from the user/company name using a hash function
- The same user will have the same avatar appearance in profile pages, comments, transaction listings, and throughout the application

## Deployment
- Frontend: https://vsv.vercel.app
- Backend: https://api-vsv.onrender.com

## Group Members
- [Your Name]
- [Group Member 2]
- [Group Member 3]

## Contact
[Your Email]

## Demo
[YouTube Demo Link] 