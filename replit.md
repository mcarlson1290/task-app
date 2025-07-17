# Grow Space Task App 2.0

## Overview
This is a task management system for Grow Space Vertical Farms, designed to replace an existing Power Apps solution. The application serves three types of users: Farm Technicians (who complete daily tasks), Managers (who oversee operations), and Corporate users (who create training content). The system includes task management, inventory tracking, education modules, and analytics features.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful API with typed endpoints
- **Session Management**: Basic in-memory storage for development (designed for future Teams SSO integration)

### Key Components

#### Authentication System
- Mock authentication with three test users for development
- Role-based access control (technician, manager, corporate)
- Account approval workflow for new users
- Prepared for future Microsoft Teams SSO integration

#### Task Management
- CRUD operations for tasks with multiple types (seeding, moving, harvesting, packing, cleaning, inventory)
- Task assignment and status tracking (pending, in_progress, completed, approved)
- Checklist functionality with data collection capabilities
- Time tracking for task completion
- Progress tracking and manager approval workflows

#### Inventory Management
- Item tracking with categories (seeds, nutrients, supplies, equipment)
- Stock level monitoring with automated low-stock alerts
- Supplier information and restocking history
- Prepared for future QuickBooks integration

#### Education System
- Training modules organized by categories (operations, safety, quality, equipment)
- User progress tracking and completion certificates
- Role-based access to training content
- Module prerequisites and unlocking system

#### Analytics Dashboard
- Real-time performance metrics and KPIs
- Task completion rates and time tracking
- Charts and visualizations using Recharts
- Inventory alerts and status monitoring

## Data Flow

### Client-Server Communication
1. Client makes API requests through TanStack Query
2. Express.js routes handle authentication and business logic
3. Drizzle ORM manages database operations
4. Responses are cached client-side for performance

### Database Schema
- **Users**: Authentication, roles, and approval status
- **Tasks**: Task details, assignments, checklists, and progress
- **Inventory**: Item tracking, stock levels, and supplier info
- **Training**: Modules, user progress, and completion tracking
- **Task Logs**: Detailed activity and time tracking

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL) with Drizzle ORM
- **UI Components**: Radix UI primitives with shadcn/ui
- **Charts**: Recharts for analytics visualizations
- **Date Handling**: date-fns for date operations
- **Icons**: Lucide React icon library

### Development Tools
- **TypeScript**: Full type safety across the stack
- **Vite**: Development server with HMR
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Fast bundling for production

### Future Integrations
- Microsoft Teams SSO for authentication
- QuickBooks API for financial data sync
- Replit deployment infrastructure

## Deployment Strategy

### Development Environment
- Vite development server for client-side code
- Express.js server with middleware for API routes
- Hot module replacement for rapid development
- Replit-specific plugins for development environment

### Production Build
- Vite builds optimized client bundle
- ESBuild compiles server code to single file
- Static assets served from Express
- Database migrations managed through Drizzle Kit

### Environment Configuration
- Environment variables for database connection
- Separate development and production configurations
- Replit-specific deployment optimizations

## Design System

### Color Palette
- Background: #F5F5F5 (light gray)
- Cards: #FFFFFF (white)
- Accent: #203B17 (dark green)
- Primary: #2D8028 (medium green)
- Interactive elements use CSS custom properties

### User Experience
- Mobile-first responsive design
- Emoji-based visual indicators for task types
- Micro-celebrations with confetti animations
- Clean, modern interface with slight playfulness
- Accessibility features through Radix UI components

### Component Architecture
- Reusable UI components built on Radix primitives
- Consistent spacing and typography through Tailwind
- Theme-aware components using CSS custom properties
- TypeScript interfaces for all component props

## Recent Changes
- **July 17, 2025**: Successfully rebuilt task workflow from scratch with simplified architecture
  - Implemented single `handleTaskAction` function managing all task state changes
  - Fixed critical completion bug where task ID was becoming null/undefined
  - Simplified TaskCard components to show single button based on status (pending→Start, in_progress→Collaborate, completed→View Details)
  - Streamlined TaskModal to always show checklist and proper action buttons
  - Removed complex mutation system and replaced with unified task action handler
  - Verified task completion flow working correctly with proper status updates and server persistence
  - **Add Task Feature**: Fixed date type validation issue in task creation API
  - **Account Page Enhancement**: Implemented comprehensive account information page with:
    - Personal information display with generated email addresses
    - Work information including role-based training badges
    - Real-time activity statistics calculated from actual task data
    - Training progress tracking with role-specific completion rates
    - Recent activity feed showing last 5 user tasks with relative timestamps
    - Responsive design with proper card layout and visual hierarchy
  - **Inventory Page Enhancement**: Enhanced existing inventory management with:
    - Email-based reorder functionality with pre-filled request details
    - Advanced filtering including low stock only and sorting options
    - Role-based access control for edit functionality (managers only)
    - Improved toolbar with search, category filter, sort, and low stock toggle
    - Enhanced reorder buttons in both main grid and low stock alerts
    - Professional reorder email templates with all item details
  - **Added pause and skip functionality**: Tasks can now be paused (with resume capability) or skipped (with mandatory reason)
  - Enhanced database schema with pause/skip fields (pausedAt, resumedAt, skippedAt, skipReason)
  - Added visual styling for paused (yellow) and skipped (gray) task states
  - Fixed modal button display after resume to show correct action buttons
  - Added pause/skip options to status filter dropdown
  - **Education System Enhancement**: Implemented comprehensive course prerequisites and creation system:
    - Added prerequisite system with course dependency validation
    - Visual prerequisite indicators showing required courses and completion status
    - Course locking mechanism preventing access until prerequisites are met
    - Added "Basic Safety & Orientation" as foundation course for all others
    - Created course creation modal for corporate managers with:
      - Full course metadata editing (title, description, role, time, icon)
      - Section-based content structure with multiple content types
      - Prerequisites selection with multi-course dependencies
      - Manager approval requirements for advanced courses
      - Real-time validation and form management
    - Updated CourseCard component to display prerequisite requirements
    - Enhanced course progression with proper dependency chains
    - Added role-based course creation access (corporate users only)