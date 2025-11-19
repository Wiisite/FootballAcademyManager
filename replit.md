# Football School Management System

## Overview

This is a comprehensive management system for a football school (Escola de Futebol) built with a modern full-stack architecture. The system manages students (alunos), teachers (professores), classes (turmas), payments (pagamentos), and multiple branch locations (filiais). It provides centralized administration with features for enrollment management, payment tracking, class scheduling, and reporting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing instead of React Router
- TanStack Query (React Query) for server state management and data fetching

**UI Component Library**
- Shadcn UI components based on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- CSS variables for theming with light/dark mode support
- "New York" style variant from Shadcn configured in components.json

**State Management Strategy**
- Server state managed through TanStack Query with persistent caching
- Form state handled by React Hook Form with Zod validation
- Local UI state managed with React hooks
- Authentication state derived from user query endpoint

**Form Handling**
- React Hook Form for performant form management
- Zod schemas for runtime validation (shared between client and server)
- @hookform/resolvers for seamless integration
- Drizzle-zod for auto-generating validation schemas from database schema

### Backend Architecture

**Server Framework**
- Express.js server with TypeScript
- Custom middleware for request logging and error handling
- Separation between development (Vite middleware) and production (static files)
- RESTful API design with `/api` prefix for all endpoints

**Database Layer**
- PostgreSQL database via Neon serverless driver
- Drizzle ORM for type-safe database operations
- Schema-first approach with shared TypeScript types
- WebSocket connection support for serverless PostgreSQL

**Data Access Pattern**
- Storage abstraction layer (IStorage interface) for database operations
- Centralized data access through storage.ts module
- Type-safe queries using Drizzle ORM query builder
- Relations defined in schema for efficient joins

**Database Schema Design**
- **Users**: Stores authentication data (id, email, name, profile image)
- **Alunos** (Students): Core student information with references to filiais and responsáveis (guardians)
- **Professores** (Teachers): Teacher profiles with specialization and salary information
- **Turmas** (Classes): Class schedules with professor assignments, capacity limits, and pricing
- **Matriculas** (Enrollments): Junction table linking students to classes
- **Pagamentos** (Payments): Payment records with reference month and payment methods
- **Filiais** (Branches): Multiple location support with individual branch data
- **Sessions**: Server-side session storage for authentication

### Authentication & Authorization

**Replit Auth Integration**
- OpenID Connect (OIDC) authentication flow
- Passport.js strategy for user authentication
- Express session middleware with PostgreSQL session store
- Mandatory `isAuthenticated` middleware on protected routes

**Session Management**
- Server-side sessions stored in PostgreSQL via connect-pg-simple
- 7-day session TTL with httpOnly, secure cookies
- Session secret from environment variables
- User profile synchronized with authentication claims

### API Architecture

**Route Organization**
- Auth routes: `/api/auth/*` for login/logout and user info
- Resource routes: `/api/alunos`, `/api/professores`, `/api/turmas`, `/api/filiais`, `/api/pagamentos`
- Dashboard metrics: `/api/dashboard/metrics` for aggregated statistics
- All routes protected with `isAuthenticated` middleware

**Data Flow Pattern**
1. Client makes request via TanStack Query
2. Request intercepted by auth middleware
3. Storage layer executes database operations
4. Results serialized and returned as JSON
5. Client cache updated automatically

**Error Handling**
- Global error handler middleware
- Structured error responses with status codes
- Client-side error toasts via Shadcn toast component
- Validation errors caught at form level with Zod

### External Dependencies

**Database**
- Neon Serverless PostgreSQL (via @neondatabase/serverless)
- DATABASE_URL environment variable required for connection
- WebSocket support via 'ws' package for serverless compatibility
- Drizzle Kit for schema migrations

**Authentication Services**
- Replit Authentication (OpenID Connect)
- ISSUER_URL: Defaults to https://replit.com/oidc
- REPL_ID and SESSION_SECRET required environment variables
- REPLIT_DOMAINS for allowed host validation

**Development Tools**
- Replit-specific plugins for development environment integration
- @replit/vite-plugin-runtime-error-modal for error overlays
- @replit/vite-plugin-cartographer for code navigation (dev only)

**Third-Party Libraries**
- date-fns for date manipulation and formatting (pt-BR locale)
- nanoid for unique ID generation
- memoizee for caching OIDC configuration
- Radix UI primitives for accessible UI components