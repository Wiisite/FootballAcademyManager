# EscolaFut - Sistema de Gestão para Escola de Futebol

## Overview

EscolaFut is a comprehensive management system for football schools, designed to manage multiple units, students, instructors, classes, payments, and physical assessments. It supports administrators, unit managers, and guardians, handling the complete lifecycle from enrollment and scheduling to payment tracking and performance evaluations. The system features a centralized administration panel with decentralized unit management, allowing for semi-independent branch operations while maintaining data synchronization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Technology Stack**: React 18 (TypeScript), Vite, Wouter, TanStack Query, Shadcn UI (Radix UI), Tailwind CSS, React Hook Form (Zod).
- **Design Patterns**: Component-based architecture, custom hooks for authentication, Context API for unit authentication, protected routes for role-based access, centralized API request handling, form abstraction.
- **Routing**: Admin dashboard (`/`), entity management (`/alunos`, `/professores`), unit manager routes (`/unidade/*`), guardian portal (`/responsavel/*`).

### Backend

- **Technology Stack**: Node.js (Express.js), TypeScript, Drizzle ORM, Express session (PostgreSQL store), bcrypt.
- **API Design**: RESTful API, session-based authentication (three contexts: admin, unit manager, guardian), role-based middleware, shared schema definitions, centralized error handling.
- **Authentication**: Separate session-based flows for Admin, Unit Manager, and Guardian, each with dedicated login endpoints and middleware.
- **Data Synchronization**: Sync manager (`server/sync.ts`) uses a queue-based approach for synchronizing data between central and unit systems, with critical operations triggering immediate syncs.

### Database

- **Technology**: PostgreSQL (Neon serverless), Drizzle ORM.
- **Core Schema**:
    - **User Management**: `adminUsers`, `gestoresUnidade`, `responsaveis`.
    - **Student/Class Management**: `alunos`, `professores`, `turmas`, `matriculas`, `presencas`.
    - **Financial Management**: `pagamentos`, `eventos`, `uniformes`, `inscricoesEventos`, `comprasUniformes`, `pacotesTreino`, `assinaturasPacotes`, `combosAulas`.
    - **Physical Assessment**: `categoriasTestes`, `testes`, `avaliacoesFisicas`, `resultadosTestes`, `metasAlunos`.
    - **Multi-Unit Management**: `filiais` (unit-scoped queries).
    - **Document Sharing**: `documentosCompartilhados`, `visualizacoesDocumentos`.
- **Key Patterns**: Serial primary keys, timestamp fields, soft deletes (`ativo`), JSON for metadata, foreign key relationships, data URLs (base64) for inline document/image storage.

## External Dependencies

- **Payment Integration**: Stripe.js and React Stripe.js.
- **Database Services**: Neon serverless PostgreSQL.
- **Session Management**: `express-session`, `connect-pg-simple`.
- **UI Component Libraries**: Radix UI, Shadcn UI, Lucide React.
- **Utilities**: date-fns, jspdf, bcrypt, Zod, nanoid.