# BLEM — Project Progress & Engineering Log

## Architecture & Conventions
- **App Name**: BLEM (Mini Social Media Web Application)
- **Tech Stack**:
  - Frontend: Vanilla HTML5, Modern CSS (Glassmorphism, dark/light theme tokens, responsive layouts), Vanilla JavaScript (ES6+ modular components, state management, reactive DOM updates)
  - Backend: Express.js (Node.js 24)
  - Database: MongoDB via Mongoose ODM
  - Authentication: JWT (JSON Web Tokens) with bcryptjs password hashing
  - Testing: Node.js native test runner (`node:test`, `node:assert/strict`) with automated API integration tests via `supertest`
- **Key Modules**:
  - `src/config`: Environment configurations & MongoDB connection manager with in-memory fallback
  - `src/models`: User, Post, Comment Mongoose schemas
  - `src/routes`: RESTful API routes (`/api/auth`, `/api/users`, `/api/posts`, `/api/comments`, `/api/health`)
  - `src/controllers` & `src/services`: Decoupled business logic & request handling
  - `src/middleware`: JWT authentication, request schema validators, centralized error handling & not-found handler
  - `public`: Single-page / client-side driven frontend with responsive design and rich micro-interactions

---

## 2026-10-08 — Project Initialization & Architecture Setup

**Request**
- Initialize the BLEM mini social media MVP with registration/login, user profiles, posts, comments, likes/unlikes, follow/unfollow, and feed.

**Changes**
- `package.json` — Initialized Node.js project and dependencies.
- `progress.md` — Created initial execution history and design specifications.

**Decisions**
- Use layered MVC/service architecture to strictly decouple route definitions, HTTP transport/controllers, data services, and Mongoose persistence models.
- Implement comprehensive native Node test suite to verify all REST endpoints without heavy external test framework overhead.

**Verification**
- `npm init -y` — PASS
- `npm install` — PASS

**Remaining**
- Complete full backend, frontend, and tests.

---

## 2026-10-08 — Complete MVP Implementation & Verification

**Request**
- Build maintainable MVP of BLEM with registration/login, user profiles, posts, comments, likes/unlikes, follow/unfollow, and basic feed.

**Changes**
- `src/config/env.js` — Centralized environment variables configuration.
- `src/config/db.js` — Mongoose database connection manager with automatic fallback to in-memory MongoDB.
- `src/config/seed.js` — Demo database seeder populating initial creators, posts, comments, likes, and follows.
- `src/models/User.js` — User schema with bcryptjs password hashing, email validation, and follower references.
- `src/models/Post.js` — Post schema with compound indexes, author ref, likes array, and comment counter.
- `src/models/Comment.js` — Comment schema with post/author references and index.
- `src/middleware/auth.js` — Bearer JWT authentication middleware & optional guest authentication.
- `src/middleware/validate.js` — Request payload validation and ObjectId validation.
- `src/middleware/errorHandler.js` — Centralized error handler normalizing Mongoose errors and ApiErrors.
- `src/middleware/notFound.js` — 404 resource handler.
- `src/services/authService.js` — Registration, credentials login, and active user session service.
- `src/services/userService.js` — User profile, profile update, follow/unfollow, and user search service.
- `src/services/postService.js` — Post creation, single post, author deletion, likes toggle, timeline, and feed algorithm.
- `src/services/commentService.js` — Post comment creation, listing, author deletion, and count maintenance.
- `src/controllers/authController.js` — Auth HTTP controllers.
- `src/controllers/userController.js` — User HTTP controllers.
- `src/controllers/postController.js` — Post HTTP controllers.
- `src/controllers/commentController.js` — Comment HTTP controllers.
- `src/routes/authRoutes.js` — `/api/auth` endpoints.
- `src/routes/userRoutes.js` — `/api/users` endpoints.
- `src/routes/postRoutes.js` — `/api/posts` endpoints.
- `src/routes/commentRoutes.js` — `/api/comments` endpoints.
- `src/routes/index.js` — Master API router with `/api/health`.
- `src/app.js` — Express application setup, security headers, static asset mounting, and SPA fallback.
- `src/server.js` — HTTP listener with graceful shutdown on SIGINT/SIGTERM.
- `public/index.html` — Semantic HTML5 structure with accessible `<dialog>` modals and responsive 3-column layout.
- `public/css/styles.css` — Modern glassmorphic dark theme, contrast tokens, animations, and micro-interactions.
- `public/js/api.js` — Client API client handling JWT tokens and REST requests.
- `public/js/state.js` — Client-side reactive state store.
- `public/js/ui.js` — DOM component renderer with HTML sanitization for XSS prevention.
- `public/js/app.js` — Event handlers, debounced search, feed switcher, and 1-click demo login.
- `tests/helpers/testDb.js` — In-memory test database manager.
- `tests/auth.test.js` — 8 integration tests for authentication.
- `tests/users.test.js` — 8 integration tests for profiles and follow/unfollow.
- `tests/posts.test.js` — 8 integration tests for posts and likes.
- `tests/comments.test.js` — 5 integration tests for comments.
- `tests/feed.test.js` — 3 integration tests for feed algorithms.
- `README.md` — Comprehensive project overview, architecture guide, API docs, and run instructions.

**Decisions**
- Configured default port to 5050 to avoid port collisions with macOS AirPlay Receiver on port 5000.
- Implemented automatic fallback to in-memory MongoDB in development/test so reviewers can clone and run instantly without external services.
- Implemented both personalized home feed (following + self) and global explore feed with automatic empty-feed fallback.

**Verification**
- `npm test` — PASS (32 of 32 tests passing across 5 test suites)
- `curl http://localhost:5050/api/health` — PASS (Status: ok)
- Live end-to-end user scenario (register, follow, post, like, comment, feed) — PASS

**Remaining**
- None

## 2026-10-08 — Ignore Environment and Secret Files

**Request**
- Keep environment variables and secret material out of Git.

**Changes**
- `.gitignore` — Added rules for `.env` variants, secret/credential files and directories, and private key/certificate formats.
- `.gitignore` — Added an exception so `.env.example` remains shareable.

**Decisions**
- Environment templates remain trackable for onboarding, while local overrides and credential material are ignored.

**Verification**
- `git check-ignore -v .env .env.local app.secret secrets/token credentials/user.json private.pem certificate.crt` — PASS
- `git check-ignore -v --no-index .env.example` — PASS (explicitly unignored)

**Remaining**
- None

---

## 2026-10-08 — Remove MVP Badge from Logo

**Request**
- Remove the "MVP" text badge written next to the BLEM logo in the top navbar.

**Changes**
- `public/index.html` — Removed `<span class="app-tag">MVP</span>` element from header brand container.

**Decisions**
- Cleaned up navbar branding so only the BLEM sparkle glyph and logo title remain displayed.

**Verification**
- `curl -s http://localhost:5050/ | grep -i "brand-logo" -A 5` — PASS (confirmed absence of MVP badge)
- `npm test` — PASS (32 of 32 tests passing)

**Remaining**
- None

## 2026-10-08 — Normalize Git Main Branch

**Request**
- Resolve `git push -u origin main` failing after the project folder was renamed from `social-media` to `BLEM`.

**Changes**
- Git metadata — Renamed the local branch from case-sensitive `Main` to `main` using a temporary branch name to avoid the macOS case-insensitive ref collision.
- Git remote — Published `main` to `origin` and configured upstream tracking.

**Decisions**
- The parent-folder rename was not the direct cause; the local branch was named `Main` with an uppercase `M`, while the push command targeted lowercase `main`.

**Verification**
- `git status --short --branch` — PASS (`## main...origin/main`, clean worktree)
- `git ls-remote --heads origin` — PASS (`refs/heads/main` points to `5e6e955`)

**Remaining**
- None
