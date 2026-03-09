# LearnEngine - Online Course Platform

## Overview
LearnEngine is a full-stack online course platform (Thinkific-style) where instructors can build and manage courses, and students can enroll, learn, and track progress.

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui + wouter routing
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based authentication with scrypt password hashing
- **Rich Text**: TipTap editor (headings, text styles, images, YouTube videos)

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
    rich-text-editor.tsx - TipTap rich text editor component
  pages/
    home.tsx        - Landing page
    auth.tsx        - Login/Register
    courses.tsx     - Course catalog
    course-detail.tsx - Course detail page
    dashboard.tsx   - Student dashboard
    course-player.tsx - Course player/learner
    admin/
      index.tsx     - Admin dashboard
      setup.tsx     - Super admin setup page
      course-editor.tsx - Course builder/editor (3-level hierarchy)
      students.tsx  - Student management
      users.tsx     - User role management

server/
  index.ts          - Express server setup
  routes.ts         - API routes
  storage.ts        - Database storage layer
  auth.ts           - Shared password hashing utilities
  db.ts             - Database connection
  seed.ts           - Seed data

shared/
  schema.ts         - Drizzle schema (3-level hierarchy)
```

## Content Hierarchy
Course → Subject → Module → Lesson (3-level structure)
- **Subject**: Top-level grouping within a course (e.g., "Foundations", "Frontend Development")
- **Module**: Second-level grouping within a subject (e.g., "Getting Started", "CSS & Layout")
- **Lesson**: Individual content unit with rich text (HTML) content and optional video

## Database Models
- users (ADMIN, INSTRUCTOR, STUDENT roles)
- categories
- courses (with status: DRAFT, PUBLISHED, ARCHIVED)
- subjects (course_id, position, cascade delete)
- modules (subject_id, position, cascade delete)
- lessons (module_id, VIDEO/TEXT types, HTML content via TipTap)
- enrollments (progress tracking)
- lesson_progress (per-lesson completion)
- reviews

## Admin Pages
- /admin - Dashboard with overview stats, quick links, course list
- /admin/analytics - Comprehensive analytics (courses, categories, instructors, enrollments)
- /admin/courses/new - Create new course
- /admin/courses/:id/edit - Edit course with 3-level curriculum builder
- /admin/students - Student management
- /admin/users - User role management (ADMIN only)
- /admin/setup - Super admin promotion page

## Key API Routes
- Auth: /api/auth/login, /api/auth/register, /api/auth/me, /api/auth/logout
- Courses: /api/courses, /api/courses/:slug
- Enrollment: /api/courses/:id/enroll, /api/enrollments, /api/enrollments/check/:slug
- Learning: /api/learn/:slug, /api/lessons/:id/complete
- Admin: /api/admin/courses, /api/admin/subjects, /api/admin/modules, /api/admin/lessons
- Users: /api/admin/users, /api/admin/users/:id/role

## Admin Setup
- Navigate to /admin/setup while logged in
- Enter the ADMIN_SECRET env var value to promote your account to super admin
- Super admins can manage all users, courses, and promote others to instructor/admin

## Seed Accounts
- Admin: admin / admin123
- Instructor: markchen / instructor123
- Instructor: sarahdesign / instructor123
- Student: student / student123

## Environment Variables
- ADMIN_SECRET: Secret key for promoting accounts to super admin (learnengine-super-admin-2026)
- SESSION_SECRET: Express session secret
- DATABASE_URL: PostgreSQL connection string

## TipTap Editor Features
- Text formatting: Bold, Italic, Underline, Strikethrough
- Headings: H1, H2, H3
- Text alignment: Left, Center, Right
- Lists: Bullet, Ordered
- Blockquote, Code Block, Horizontal Rule
- Image insertion (URL)
- YouTube video embedding
- Undo/Redo
