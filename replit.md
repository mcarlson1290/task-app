# Grow Space Task App 2.0

## Overview
This application is a task management system for Grow Space Vertical Farms, designed to replace an existing Power Apps solution. It facilitates task management, inventory tracking, education, and analytics for Farm Technicians, Managers, and Corporate users. The business vision is to streamline farm operations, enhance productivity, and provide robust data insights for vertical farming.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI components with shadcn/ui
- **Styling**: Tailwind CSS with custom CSS variables
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **Design System**: Mobile-first responsive design, clean modern interface with slight playfulness (e.g., emoji visual indicators, confetti animations), consistent spacing and typography, custom color palette (e.g., Accent: #203B17, Primary: #2D8028), reusable components, and accessibility features.
- **Date Utilities**: Custom date handling utilities in `client/src/utils/dateUtils.ts` for consistent UTC-aware date comparison and formatting

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **API Design**: RESTful API with typed endpoints
- **Session Management**: Basic in-memory storage (designed for future Teams SSO integration)

### Key Features
- **Authentication**: Role-based access control (technician, manager, corporate), mock authentication for development, account approval workflow, prepared for Microsoft Teams SSO.
- **Task Management**: CRUD operations for various task types (seeding, moving, harvesting, packing, cleaning, inventory), assignment, status tracking (pending, in_progress, completed, approved), checklist functionality with data collection, time tracking, progress tracking, manager approval workflows, and automated task instance generation from recurring patterns. Includes features for pausing and skipping tasks. **FIXED: Date filtering system with UTC-aware date comparison ensuring tasks appear only on their correct due dates.**
- **Inventory Management**: Item tracking with categories, stock level monitoring with low-stock alerts, supplier info, restocking history, and weighted average cost calculation. **Converted from "Add New Item" to proper "Add Stock" functionality for restocking existing inventory items.** Prepared for QuickBooks integration.
- **Education System**: Training modules by category, user progress tracking, completion certificates, role-based access, module prerequisites, course creation for corporate managers, and mobile layout optimization. **BREAKTHROUGH: Converted from localStorage to central database storage with proper role assignment when courses are completed.**
- **Analytics Dashboard**: Real-time performance metrics and KPIs, task completion rates, time tracking, charts (Recharts), inventory alerts, and filter-responsive statistics.
- **Production Data Management**: Comprehensive growing systems management (towers, NFT, Ebb & Flow, Staging) with capacity tracking, system assignment, and tray split integration.
- **Tray Tracking System**: Complete tray lifecycle management (creation, movement, splitting) with unique ID generation, location history, and status progression. **Multi-variety tray system operational with default varieties (ARU, BROC, ROM) configured.**
- **Location-Based Data Quarantining**: All operational data is filtered by selected location, with corporate users having an override to view all locations.
- **Soft Launch Preparation**: Application prepared for beta testing with disabled Production Data and Task Data tabs, beta banner, error boundaries, and first-time user welcome messaging.

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL) with Drizzle ORM
- **UI Components**: Radix UI primitives with shadcn/ui
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Icons**: Lucide React

### Development Tools
- **TypeScript**: For type safety
- **Vite**: Development server with HMR
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Fast bundling for production

### Future Integrations
- Microsoft Teams SSO for authentication
- QuickBooks API for financial data sync
- Replit deployment infrastructure