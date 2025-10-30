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
- **Authentication**: Enterprise Microsoft SSO authentication using Azure AD (@growspace.farm domain restriction), role-based access control (Staff, Manager, Corporate), automatic user provisioning with corporate email detection (robert@growspace.farm, matt@growspace.farm, matt.carlson@growspace.farm), secure session management with proper logout functionality.
- **Task Management**: CRUD operations for various task types (seeding, moving, harvesting, packing, cleaning, inventory), assignment, status tracking (pending, in_progress, completed, approved), checklist functionality with data collection, time tracking, progress tracking, manager approval workflows, and automated task instance generation from recurring patterns. Includes features for pausing and skipping tasks. **FIXED: Date filtering system with UTC-aware date comparison ensuring tasks appear only on their correct due dates.** **AUTOMATED TASK GENERATION**: Fully automated 31-day rolling buffer system that runs without manual intervention - generates tasks on app startup, when viewing task list, and maintains generation tracking in database with duplicate prevention and health monitoring dashboard. **UX OPTIMIZATIONS**: Implemented optimistic UI updates for instant feedback on all task operations (start, complete, skip, pause, resume) - UI updates immediately on button click with background API sync and automatic rollback on errors. Added comprehensive duplicate prevention system in backend that checks title, date, location, and recurring_task_id before creating tasks, automatically updating existing tasks instead of creating duplicates. **DUPLICATE CLEANUP**: Smart Refresh Tasks button with automatic duplicate detection and removal - uses composite key (title + date + location + recurringTaskId) to find duplicates, intelligently keeps the best instance (prioritizes completed/in-progress over pending/skipped, then oldest ID), deletes duplicates from database, and provides user feedback via toast notifications showing how many duplicates were removed.
- **Inventory Management**: Item tracking with categories, stock level monitoring with low-stock alerts, supplier info, restocking history, and weighted average cost calculation. **Converted from "Add New Item" to proper "Add Stock" functionality for restocking existing inventory items.** Prepared for QuickBooks integration.
- **Education System**: Training modules by category, user progress tracking, completion certificates, role-based access, module prerequisites, course creation for corporate managers, and mobile layout optimization. **BREAKTHROUGH: Converted from localStorage to central database storage with proper role assignment when courses are completed.**
- **Analytics Dashboard**: Real-time performance metrics and KPIs, task completion rates, time tracking, charts (Recharts), inventory alerts, and filter-responsive statistics.
- **Production Data Management**: Comprehensive growing systems management (towers, NFT, Ebb & Flow, Staging) with capacity tracking, system assignment, and tray split integration.
- **Tray Tracking System**: Complete tray lifecycle management (creation, movement, splitting) with unique ID generation, location history, and status progression. **Multi-variety tray system operational with default varieties (ARU, BROC, ROM) configured.**
- **Location-Based Data Quarantining**: All operational data is filtered by selected location, with corporate users having an override to view all locations.
- **Production Ready**: Application fully deployed with Microsoft SSO authentication, professional UI, disabled development features, comprehensive error handling, and clean data initialization. **BETA LAUNCH READY**: All test data removed, dynamic staff generation from Microsoft logins operational, clean production state with authentic data only. Enterprise authentication system fully functional with automatic role assignment for @growspace.farm domain users. **DEPLOYMENT OPTIMIZED**: Fixed production error handling to prevent server crashes, verified static file serving functionality, and ensured proper NODE_ENV configuration for deployment.
- **Advanced Assignment System**: Comprehensive role-based task assignment system with 12 specialized roles (Microgreens Seeder, Leafy Greens Seeder, Microgreens Harvester, Leafy Greens Harvester, Blackout Specialist, Moving Tech, Packing Tech, Cleaning Crew, Inventory Tech, Equipment Tech, Manager, General Staff). **RECURRING TASK ASSIGNMENTS**: Added assignTo field to recurring_tasks table enabling default assignment inheritance for generated daily tasks. Staff management enhanced with color-coded role badges, visual role icons, and improved UI for role assignment in staff edit modal.

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

### Integrated Services
- **Microsoft Azure AD**: Enterprise SSO authentication with @growspace.farm domain restriction
- **PostgreSQL Database**: Full database integration for production data persistence

### Future Integrations
- QuickBooks API for financial data sync
- Enhanced Microsoft Teams integration