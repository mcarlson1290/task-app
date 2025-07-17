# Grow Space Task App 2.0

## Overview
Task management system for Grow Space Vertical Farms replacing Power Apps solution.

## Users
- Farm Technicians: Complete daily tasks (seeding, harvesting, cleaning)
- Managers: Oversee operations, view analytics
- Corporate: Create training, manage multiple locations

## Key Features
1. **Task Manager**: Daily tasks with checklists, timing, and data collection
2. **Inventory**: Track supplies, automated reorder alerts  
3. **Education**: Training modules that unlock roles
4. **Analytics**: Performance tracking and insights

## Design System
- Colors: #F5F5F5 (bg), #FFFFFF (cards), #203B17 (accent), #2D8028 (buttons)
- Style: Clean, modern, mobile-first, slightly playful
- Use emojis: 🌱 for seeding, 🌿 for growing, 🥬 for harvest
- Add micro-celebrations (confetti on task completion)

## Technical Requirements
- React + TypeScript
- Mobile responsive
- Mock auth for development (3 test users)
- Eventually: Teams SSO, QuickBooks sync

## Task Types
- Seeding (plant new trays)
- Moving (relocate plants between systems)
- Harvesting (collect mature plants, track weights)
- Packing (prepare orders)
- Cleaning (sanitation tasks)
- Inventory (monthly audits)

## Special Features
- Tasks can include checklists with data collection steps
- Recurring tasks auto-generate daily tasks
- Time tracking on all tasks
- Manager approval required for new staff
