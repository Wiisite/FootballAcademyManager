# EscolaFut - Sistema de Gestão para Escola de Futebol

## Overview

EscolaFut is a comprehensive management system for football schools, designed to handle multiple units (branches), students, instructors, classes, payments, and physical assessments. The system supports three distinct user roles: administrators (central management), unit managers (branch-level management), and guardians (parents/responsible parties who can view student information).

The application manages the complete lifecycle of a football school operation, from student enrollment and class scheduling to payment tracking and performance evaluations. It features a centralized administration panel with decentralized unit management capabilities, allowing each branch to operate semi-independently while maintaining data synchronization with the central system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- Shadcn UI component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with a custom theme
- React Hook Form with Zod for form validation

**Design Patterns:**
- Component-based architecture with reusable UI components in `client/src/components`
- Custom hooks for authentication (`useAdminAuth`, `useResponsavel`, `useUnidadeAuth`)
- Context API for unit-level authentication state management (`UnidadeContext`)
- Protected route components for role-based access control
- Centralized API request handling through `apiRequest` utility
- Form abstraction with dedicated form components for different entities

**Routing Structure:**
- `/` - Admin dashboard (protected)
- `/admin-login` - Administrator authentication
- `/alunos`, `/professores`, `/turmas` - Entity management pages (admin)
- `/unidade/*` - Unit manager routes (protected)
- `/portal-unidade` - Unit manager login and system access
- `/responsavel/*` - Guardian portal routes (protected)

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js framework
- TypeScript for type safety across the stack
- Drizzle ORM for database operations
- Express session with PostgreSQL session store for authentication
- bcrypt for password hashing

**API Design:**
- RESTful API architecture with resource-based endpoints
- Session-based authentication with three distinct authentication contexts
- Role-based middleware (`requireAdminAuth`, `requireGestorAuth`, `requireResponsavelAuth`)
- Shared schema definitions between client and server via `@shared/schema`
- Centralized error handling middleware

**Authentication Strategy:**
The system implements three separate authentication flows:
1. **Admin Authentication**: Session-based with `adminId` and `adminUser` in session data
2. **Unit Manager Authentication**: Session-based with `gestorUnidadeId` and `filialId` 
3. **Guardian Authentication**: Session-based with `responsavelId`

Each authentication type has dedicated login endpoints and middleware for access control, ensuring proper isolation between user roles.

**Data Synchronization:**
- Sync manager (`server/sync.ts`) handles data synchronization between central system and units
- Queue-based approach for handling offline operations
- Critical operations (payments) trigger immediate synchronization
- Background scheduler processes pending synchronizations

### Database Architecture

**Database Technology:**
- PostgreSQL via Neon serverless database
- Drizzle ORM with migration support
- WebSocket connections for serverless environment compatibility

**Core Schema Design:**

**User Management:**
- `users` - Replit Auth integration (legacy/compatibility)
- `adminUsers` - Administrative users with role-based permissions
- `gestoresUnidade` - Unit managers with branch-specific access
- `responsaveis` - Student guardians with authentication credentials

**Student and Class Management:**
- `alunos` - Student records with personal information, payment status, and unit assignment
- `professores` - Instructors assigned to specific units
- `turmas` - Classes with schedules, capacity, and instructor assignments
- `matriculas` - Student enrollments linking students to classes
- `presencas` - Attendance tracking by date and class

**Financial Management:**
- `pagamentos` - Payment records with method, amount, and reference month
- `eventos` - Special events with registration fees
- `uniformes` - Uniform inventory and pricing
- `inscricoesEventos` - Event registrations
- `comprasUniformes` - Uniform purchase records
- `pacotesTreino` - Training package definitions
- `assinaturasPacotes` - Student package subscriptions
- `combosAulas` - Class combo packages with pricing

**Physical Assessment:**
- `categoriasTestes` - Test categories (speed, strength, endurance, etc.)
- `testes` - Specific test definitions within categories
- `avaliacoesFisicas` - Physical evaluation sessions
- `resultadosTestes` - Individual test results
- `metasAlunos` - Student performance goals

**Multi-Unit Management:**
- `filiais` - Branch/unit locations with contact and operational details
- Unit-scoped queries filter data by `filialId`
- Centralized reporting aggregates across all units

**Key Database Patterns:**
- Serial primary keys for all entities
- Timestamp fields (`createdAt`, `updatedAt`) for audit trails
- Soft deletes via `ativo` boolean flags
- JSON fields for flexible metadata storage
- Foreign key relationships with proper indexing

### External Dependencies

**Payment Integration:**
- Stripe.js and React Stripe.js for payment processing
- Configured for Brazilian market (BRL currency)

**Database Services:**
- Neon serverless PostgreSQL for scalable database hosting
- WebSocket support for real-time capabilities
- Connection pooling for efficient resource usage

**Session Management:**
- `express-session` for session handling
- `connect-pg-simple` for PostgreSQL-backed session storage
- Sessions stored in `sessions` table with expiration management

**Development Tools:**
- Replit-specific plugins for development environment integration
- Vite plugins for error overlay and code mapping
- ESBuild for production bundling

**UI Component Libraries:**
- Radix UI primitives for accessible, unstyled components
- Shadcn UI for pre-styled, customizable components
- Lucide React for consistent iconography

**Utilities:**
- date-fns for date manipulation and formatting (pt-BR locale)
- jspdf and jspdf-autotable for PDF report generation
- bcrypt for secure password hashing
- Zod for runtime type validation
- nanoid for unique ID generation

## Recent Changes

### Guardian Portal Fix (November 2025)
**Problem**: Guardians (responsáveis) could register and login, but the portal failed to load data after authentication.

**Root Cause**: Missing API endpoint GET `/api/responsaveis/me` to fetch guardian data with associated students.

**Solution Implemented**:
1. **Backend** (`server/routes.ts`):
   - Added GET `/api/responsaveis/me` endpoint with `requireResponsavelAuth` middleware
   - Returns complete `ResponsavelWithAlunos` object including list of students
   - Leverages existing `storage.getResponsavelWithAlunos()` function

2. **Frontend** (`client/src/hooks/useResponsavel.ts`):
   - Added TypeScript typing: `useQuery<ResponsavelWithAlunos | null>`
   - Fixed logout endpoint to use correct route `/api/responsavel/logout`
   - Improved type safety across the guardian authentication flow

3. **UI** (`client/src/pages/ResponsavelPortal.tsx`):
   - Removed duplicate loading state code
   - Removed unnecessary type casting
   - Updated logout handler to use proper API call instead of localStorage manipulation

**Authentication Flow**:
- POST `/api/responsavel/login` → creates session with `responsavelId`
- GET `/api/responsaveis/me` → fetches guardian data (requires session)
- POST `/api/responsavel/logout` → destroys session

**Impact**: Guardian portal now loads correctly after login, displaying student information and payment status.