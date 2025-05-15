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
- Supports customizable options (colors, sizes, rounded corners)
- Provides fallback handling for image loading errors
- Implemented through a reusable UserAvatar component

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