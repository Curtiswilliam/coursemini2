# LearnEngine - Online Course Platform

## Overview
LearnEngine is a full-stack online course platform (Thinkific-style) where instructors can build and manage courses, and students can enroll, learn, and track progress.

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui + wouter routing
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based authentication with scrypt password hashing

## Project Structure
```
client/src/
  App.tsx           - Main app with routes
  lib/auth.tsx      - Auth context and hooks
  lib/queryClient.ts - React Query setup
  components/
    navbar.tsx      - Navigation bar
    footer.tsx      - Footer
    course-card.tsx - Reusable course card
    theme-provider.tsx - Dark/light theme
  pages/
    home.tsx        - Landing page
    auth.tsx        - Login/Register
    courses.tsx     - Course catalog
    course-detail.tsx - Course detail page
    dashboard.tsx   - Student dashboard
    course-player.tsx - Course player/learner
    admin/
      index.tsx     - Admin dashboard
      course-editor.tsx - Course builder/editor
      students.tsx  - Student management

server/
  index.ts          - Express server setup
  routes.ts         - API routes
  storage.ts        - Database storage layer
  db.ts             - Database connection
  seed.ts           - Seed data

shared/
  schema.ts         - Drizzle schema (users, courses, chapters, lessons, enrollments, etc.)
```

## Key Features (MVP)
- User authentication (register/login/logout)
- Course catalog with search, filters (category, level), sort
- Course detail pages with curriculum outline
- Student enrollment and progress tracking
- Course player with lesson navigation and completion
- Admin dashboard with course management
- Course builder (create/edit courses, chapters, lessons)
- Student management
- Dark/light theme toggle
- Responsive design

## Database Models
- users (ADMIN, INSTRUCTOR, STUDENT roles)
- categories
- courses (with status: DRAFT, PUBLISHED, ARCHIVED)
- chapters (ordered by position)
- lessons (VIDEO, TEXT types)
- enrollments (progress tracking)
- lesson_progress (per-lesson completion)
- reviews

## Seed Accounts
- Admin: admin / admin123
- Instructor: markchen / instructor123
- Instructor: sarahdesign / instructor123
- Student: student / student123
