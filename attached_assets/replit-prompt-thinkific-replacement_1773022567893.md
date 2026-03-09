# Replit Prompt: Full Thinkific Replacement — Online Course Platform

## Copy everything below this line into Replit Agent or Replit AI Chat:

---

Build me a full-stack online course platform (a complete Thinkific replacement) called **"LearnEngine"**. This is a SaaS platform where course creators can build, sell, and market online courses, and students can enroll, learn, and track progress. Use **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **PostgreSQL** (via Prisma ORM), and **NextAuth.js** for authentication.

---

## CORE ARCHITECTURE

### Tech Stack
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API routes + server actions
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js (credentials + Google + GitHub OAuth)
- **File Storage**: S3-compatible storage (use presigned URLs for uploads)
- **Payments**: Stripe (subscriptions + one-time purchases)
- **Email**: Resend (transactional + marketing emails)
- **Video**: Mux or direct upload with HLS streaming support
- **Real-time**: Server-Sent Events for notifications
- **Search**: Full-text search via PostgreSQL tsvector

### Database Schema (Prisma)

Create these models with full relations:

**Users & Auth:**
- `User` — id, name, email, hashedPassword, avatar, role (ADMIN | INSTRUCTOR | STUDENT), emailVerified, createdAt, updatedAt
- `Account` — OAuth account linking (NextAuth)
- `Session` — session management
- `VerificationToken` — email verification

**Courses & Content (CMS):**
- `Course` — id, title, slug, description, shortDescription, thumbnail, promoVideo, price, salePrice, currency, status (DRAFT | PUBLISHED | ARCHIVED), categoryId, instructorId, enrollmentType (FREE | PAID | SUBSCRIPTION), maxStudents, language, level (BEGINNER | INTERMEDIATE | ADVANCED), prerequisites, learningOutcomes (JSON array), certificate (boolean), createdAt, updatedAt
- `Category` — id, name, slug, parentId (self-referencing for subcategories)
- `Chapter` — id, title, description, position (ordering), courseId, isFree (preview chapter)
- `Lesson` — id, title, description, type (VIDEO | TEXT | QUIZ | ASSIGNMENT | DOWNLOAD | AUDIO | LIVE), position, chapterId, duration, content (rich text JSON), videoUrl, attachments (JSON), isFree, isPreview, dripDate, dripDays
- `Quiz` — id, lessonId, title, passingScore, attempts, timeLimit, shuffleQuestions
- `QuizQuestion` — id, quizId, question, type (MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER | FILL_BLANK), options (JSON), correctAnswer, explanation, points, position
- `Assignment` — id, lessonId, title, instructions, dueType, maxScore

**Enrollment & Progress:**
- `Enrollment` — id, userId, courseId, status (ACTIVE | COMPLETED | EXPIRED | SUSPENDED), enrolledAt, completedAt, expiresAt, progress (float 0-100)
- `LessonProgress` — id, enrollmentId, lessonId, status (NOT_STARTED | IN_PROGRESS | COMPLETED), watchTime, lastPosition, completedAt
- `QuizAttempt` — id, enrollmentId, quizId, answers (JSON), score, passed, startedAt, completedAt
- `AssignmentSubmission` — id, enrollmentId, assignmentId, content, attachments (JSON), grade, feedback, submittedAt, gradedAt
- `Certificate` — id, enrollmentId, certificateNumber, issuedAt, templateId

**Commerce:**
- `Order` — id, userId, courseId, amount, currency, status (PENDING | COMPLETED | REFUNDED | FAILED), stripePaymentId, couponId, createdAt
- `Subscription` — id, userId, planId, stripeSubscriptionId, status, currentPeriodStart, currentPeriodEnd
- `Plan` — id, name, price, interval (MONTHLY | YEARLY), features (JSON), stripePriceId
- `Coupon` — id, code, type (PERCENTAGE | FIXED), value, maxUses, usedCount, expiresAt, courseId (null = all courses)

**Email & Marketing (Retargeting):**
- `EmailCampaign` — id, name, subject, body (HTML), status (DRAFT | SCHEDULED | SENT | CANCELLED), type (BROADCAST | AUTOMATED | RETARGET), scheduledAt, sentAt, audienceFilter (JSON)
- `EmailTemplate` — id, name, subject, body, type (WELCOME | ENROLLMENT | COMPLETION | ABANDONED_CART | DRIP | REMINDER | WINBACK | CUSTOM)
- `EmailLog` — id, campaignId, userId, status (SENT | DELIVERED | OPENED | CLICKED | BOUNCED | UNSUBSCRIBED), sentAt, openedAt, clickedAt
- `EmailAutomation` — id, name, trigger (ENROLLMENT | COMPLETION | INACTIVITY | ABANDONED_CART | SIGNUP | LESSON_COMPLETE | QUIZ_FAIL), delay (minutes), templateId, isActive, conditions (JSON)
- `AbandonedCart` — id, userId, courseId, createdAt, recoveredAt, emailsSent
- `Subscriber` — id, email, userId, tags (JSON), subscribedAt, unsubscribedAt, source

**Community & Engagement:**
- `Discussion` — id, lessonId, courseId, userId, title, content, parentId (for replies), isPinned, createdAt
- `Review` — id, courseId, userId, rating (1-5), comment, isVerified, createdAt
- `Notification` — id, userId, type, title, message, link, read, createdAt

**Site Builder:**
- `SitePage` — id, title, slug, content (JSON blocks), isPublished, type (LANDING | ABOUT | CUSTOM | BLOG)
- `SiteSettings` — id, siteName, logo, favicon, primaryColor, secondaryColor, customCSS, customDomain, analyticsId, socialLinks (JSON)
- `BlogPost` — id, title, slug, content, excerpt, thumbnail, authorId, isPublished, publishedAt, tags (JSON)

---

## PAGES & FEATURES TO BUILD

### 1. Public-Facing Pages

**Homepage / Landing Page**
- Hero section with CTA
- Featured courses carousel
- Categories grid
- Testimonials / reviews section
- Instructor spotlights
- Stats (students enrolled, courses, completion rate)

**Course Catalog (`/courses`)**
- Grid/list view toggle
- Filter by: category, price (free/paid), level, rating, language
- Sort by: newest, popular, highest rated, price
- Search with autocomplete
- Pagination or infinite scroll

**Course Detail Page (`/courses/[slug]`)**
- Course thumbnail + promo video player
- Title, description, instructor info with avatar
- Curriculum outline (chapters & lessons) — show free preview lessons
- Learning outcomes, prerequisites, level badge
- Price with sale price strike-through, coupon input
- Enroll / Buy Now / Add to Cart buttons
- Reviews section with star distribution bar chart
- Related courses
- Share buttons
- FAQ accordion

**Instructor Profile (`/instructors/[id]`)**
- Bio, avatar, social links
- Courses by this instructor
- Total students, average rating

**Blog (`/blog`)**
- Blog listing page with tags
- Individual blog post page

### 2. Student Dashboard (Protected)

**My Courses (`/dashboard`)**
- Enrolled courses grid with progress bars
- Continue learning button (takes to last lesson)
- Completed courses section
- Certificates earned

**Course Player (`/learn/[courseSlug]`)**
- Sidebar: chapter/lesson navigation with completion checkmarks
- Main area: video player (with resume position), text content (rich text renderer), quizzes inline, assignment submission form
- Progress bar at top
- Mark as complete button
- Discussion thread below each lesson
- Next/Previous lesson navigation
- Collapsible sidebar for focused learning
- Keyboard shortcuts (space = play/pause, arrow keys = navigate)
- Playback speed control
- Notes (per-lesson personal notes saved to DB)

**Quizzes**
- Timed quiz interface
- Multiple question types rendered appropriately
- Instant feedback with explanations
- Score summary with pass/fail
- Retry option (if attempts remain)

**Assignments**
- Rich text submission
- File attachment upload
- View grade and instructor feedback

**Certificates (`/dashboard/certificates`)**
- List of earned certificates
- Download as PDF (generated with course name, student name, date, unique ID)
- Shareable link

**Student Profile Settings (`/dashboard/settings`)**
- Edit name, avatar, bio
- Change password
- Email preferences / unsubscribe toggles
- Connected accounts
- Delete account

### 3. Instructor / Admin Dashboard (Protected)

**Overview (`/admin`)**
- Revenue chart (daily/weekly/monthly)
- Enrollments chart
- Active students count
- Course completion rates
- Recent orders
- Top performing courses

**Course Builder (`/admin/courses/[id]/edit`)**
- THIS IS THE MOST IMPORTANT FEATURE — build a full drag-and-drop course CMS:
- Step 1: Course Info — title, slug (auto-generated), description (rich text editor), category, level, language, thumbnail upload, promo video upload
- Step 2: Curriculum Builder — drag-and-drop chapters, drag-and-drop lessons within chapters, reorder everything, inline rename, bulk actions
- Step 3: Lesson Editor — per lesson type:
  - **Video**: upload video, set duration, add captions/subtitles
  - **Text**: rich text editor (headings, bold, italic, lists, code blocks, images, embeds)
  - **Quiz**: add questions with drag-and-drop ordering, set passing score, time limit
  - **Assignment**: instructions editor, grading rubric
  - **Download**: upload files for students to download
  - **Audio**: upload audio files
- Step 4: Pricing — free/paid toggle, price input, sale price, coupon creation
- Step 5: Drip Content — set lesson availability by days after enrollment or specific dates
- Step 6: Settings — enrollment limits, prerequisites, certificate toggle, SEO (meta title, description, OG image)
- Step 7: Preview & Publish — preview as student, publish/unpublish toggle

**Student Management (`/admin/students`)**
- Searchable student list
- View per-student: enrolled courses, progress, quiz scores, last active
- Manually enroll/unenroll students
- Send direct email to student
- Export student list as CSV

**Order Management (`/admin/orders`)**
- Orders table with filters (status, date range, course)
- Order detail view
- Process refunds via Stripe
- Revenue breakdown by course

**Email Marketing (`/admin/email`) — FULL RETARGETING SYSTEM**
- **Campaigns**: create broadcast emails with rich text editor, schedule send, select audience (all subscribers, specific course enrollees, inactive users, tag-based)
- **Automations**: set up trigger-based email sequences:
  - Welcome sequence (on signup): Day 0, Day 3, Day 7 emails
  - Enrollment confirmation
  - Course completion congratulations
  - Abandoned cart recovery (1 hour, 24 hours, 3 days after cart abandonment)
  - Inactivity win-back (7 days, 14 days, 30 days of no login)
  - Lesson completion follow-up
  - Quiz failure encouragement
  - Drip content notifications
  - Expiring enrollment reminders
  - Review request (3 days after completion)
- **Templates**: library of pre-built email templates, visual template editor
- **Audience**: subscriber management, tagging system, segmentation builder (filter by: enrollment status, last active, courses purchased, quiz scores, tags, signup date)
- **Analytics**: per-campaign open rate, click rate, unsubscribe rate, conversion tracking (email → enrollment), revenue attribution
- **Retargeting Pixels**: generate a tracking pixel for external sites, track which courses users viewed, trigger retargeting emails based on page views

**Analytics (`/admin/analytics`)**
- Revenue over time (line chart)
- Enrollments over time
- Course completion funnel (enrolled → started → 50% → completed)
- Student engagement heatmap (which lessons get most engagement)
- Quiz performance analytics
- Traffic sources
- Email campaign performance
- Refund rate
- Top-performing lessons
- Drop-off points (which lessons cause students to stop)

**Site Builder (`/admin/site`)**
- Edit homepage sections (drag-and-drop blocks)
- Brand settings: logo, colors, fonts, favicon
- Custom domain configuration
- Custom CSS injection
- Navigation menu editor
- Footer editor
- SEO global settings

**Coupons (`/admin/coupons`)**
- Create percentage or fixed-amount coupons
- Set expiration, max uses, course-specific or global
- Track usage

**Reviews (`/admin/reviews`)**
- Moderate reviews (approve, hide, respond)
- Flag inappropriate reviews

**Settings (`/admin/settings`)**
- General: site name, timezone, currency
- Payments: Stripe connect setup
- Email: SMTP/Resend configuration, sender name, reply-to
- Integrations: Zapier webhook URL, Google Analytics ID
- Webhooks: custom webhook endpoints for events (enrollment, purchase, completion)

### 4. API Routes

Build REST API endpoints for all CRUD operations:
- `/api/auth/[...nextauth]` — authentication
- `/api/courses` — CRUD courses
- `/api/courses/[id]/enroll` — enrollment
- `/api/courses/[id]/progress` — update progress
- `/api/lessons/[id]/complete` — mark lesson complete
- `/api/quizzes/[id]/submit` — submit quiz
- `/api/assignments/[id]/submit` — submit assignment
- `/api/orders` — create order, verify payment
- `/api/email/campaigns` — CRUD campaigns
- `/api/email/send` — trigger email send
- `/api/email/automations` — CRUD automations
- `/api/email/track/[id]` — tracking pixel (1x1 transparent gif)
- `/api/webhooks/stripe` — Stripe webhook handler
- `/api/upload` — presigned URL generation for file uploads
- `/api/analytics` — dashboard analytics data
- `/api/coupons` — CRUD coupons
- `/api/reviews` — CRUD reviews
- `/api/subscribers` — subscriber management
- `/api/certificates/[id]/download` — generate and download PDF certificate

---

## EMAIL RETARGETING SYSTEM — DETAILED SPEC

This is critical. Build a complete email retargeting and automation engine:

### Tracking
- Track page views via a lightweight JS snippet (installable on external sites)
- Track email opens via invisible tracking pixel
- Track link clicks via redirect URLs with UTM params
- Track cart additions and abandonments (store in `AbandonedCart` table)
- Track login/activity timestamps on User model

### Automation Engine
Build a background job system (use a cron job or BullMQ-style queue):
- Every 5 minutes, check for triggered automations:
  - New signups → trigger welcome sequence
  - Cart abandoned > 1 hour → send first recovery email
  - Cart abandoned > 24 hours → send second recovery email with discount
  - User inactive > 7 days → send re-engagement email
  - Course completed → send review request + upsell related course
  - Quiz failed → send encouragement + study tips
- Respect unsubscribe preferences
- Rate limit: max 1 automated email per user per 24 hours (configurable)
- Track email delivery status via webhooks from Resend

### Segmentation
- Build audience segments with AND/OR logic:
  - "Enrolled in Course X AND last active > 30 days ago"
  - "Purchased Course X BUT NOT Course Y"
  - "Opened email campaign Z AND did not click"
  - "Tagged as 'interested-marketing' OR 'interested-design'"
- Save segments for reuse
- Estimate audience size before sending

---

## UI / UX REQUIREMENTS

- Clean, modern design — use shadcn/ui components as base
- Responsive: mobile-first, works on all screen sizes
- Dark mode toggle
- Loading skeletons for all async content
- Toast notifications for actions (enrolled, saved, error)
- Optimistic UI updates where possible
- Accessible (WCAG 2.1 AA): proper aria labels, keyboard navigation, focus management
- Page transitions / animations using Framer Motion
- Command palette (Cmd+K) for quick navigation in admin

---

## SEED DATA

Create a seed script (`prisma/seed.ts`) that generates:
- 3 instructors, 10 students
- 5 courses across different categories, each with 3-5 chapters, each chapter with 3-7 lessons of mixed types
- Sample quizzes with questions
- Sample enrollments with varied progress
- Sample orders and reviews
- Sample email templates and 2 automation sequences
- Sample coupons

---

## ENVIRONMENT VARIABLES NEEDED

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=
S3_REGION=
S3_ENDPOINT=
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

## BUILD ORDER (suggested)

1. Set up Next.js project, Prisma, PostgreSQL, and auth
2. Build the database schema and seed data
3. Build public pages (homepage, catalog, course detail)
4. Build student dashboard and course player
5. Build admin dashboard overview
6. Build the course builder CMS (most complex piece)
7. Build Stripe payment integration
8. Build email system (templates, campaigns, automations, retargeting)
9. Build analytics dashboard
10. Build site builder
11. Polish UI, add animations, dark mode
12. Test everything end-to-end
