# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HiveChat is a team-oriented AI chat application designed for small and medium teams. It supports multiple AI models (DeepSeek, OpenAI, Claude, Gemini, etc.) with a comprehensive admin system for managing users, models, and integrations.

## Development Commands

### Core Development
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build the application for production
- `npm run start` - Start production server on port 3000
- `npm run lint` - Run ESLint to check code quality

### Database Operations
- `npm run initdb` - Initialize/update database schema and seed data
- `npm run db:seedProvider` - Seed LLM providers
- `npm run db:seedModel` - Seed AI models
- `npm run db:seedBot` - Seed bot templates
- `npm run db:seedGroup` - Seed user groups

## Architecture

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v5 with multiple providers
- **UI**: Tailwind CSS with Ant Design components
- **State Management**: Zustand

### Key Directory Structure
- `app/` - Next.js app directory with pages and API routes
- `app/components/` - Reusable UI components
- `app/api/` - Backend API routes
- `app/db/` - Database schema, migrations, and seed data
- `app/admin/` - Admin panel pages and components
- `app/chat/` - Chat-related pages and functionality
- `types/` - TypeScript type definitions

### Database Schema
The application uses a comprehensive PostgreSQL schema with these key tables:
- `users` - User accounts with role-based access
- `llm_settings` - AI provider configurations
- `models` - AI model definitions with capabilities
- `chats` - Chat conversations
- `messages` - Individual messages with metadata
- `groups` - User groups with model access controls
- `mcp_servers` - Model Context Protocol server configurations

### Authentication System
- Multiple providers: Email/Password, Feishu, WeChat Work, DingTalk
- Role-based access with admin privileges
- Group-based model access control
- Token usage tracking per user

### AI Integration
- Multi-provider support (OpenAI, Claude, Gemini, DeepSeek, etc.)
- Streaming responses with different API styles
- Vision and tool calling capabilities
- Web search integration
- MCP (Model Context Protocol) server support

## Environment Configuration

Key environment variables required:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Authentication encryption key
- `ADMIN_CODE` - Admin setup authorization code
- `NEXTAUTH_URL` - Application base URL
- Provider-specific auth configs (FEISHU_*, WECOM_*, DINGDING_*)

## Development Guidelines

### File Organization
- Components are organized by feature area under `app/components/`
- API routes follow RESTful patterns under `app/api/`
- Database operations use Drizzle ORM queries
- Type definitions are centralized in `types/` directory

### Code Patterns
- Server Actions for form handling and data mutations
- Client components for interactive UI elements
- Streaming API responses for AI model interactions
- Middleware for authentication routing protection

### Database Migrations
- Use `npm run initdb` after schema changes
- Seed data is managed through separate seed scripts
- Foreign key relationships are properly defined in schema

## Testing and Quality

- ESLint configuration for code quality
- TypeScript for type safety
- Proper error handling in API routes
- Loading states for async operations

## Deployment

The application supports multiple deployment methods:
- Local development with PostgreSQL
- Docker containerization with docker-compose
- Vercel deployment with Neon PostgreSQL
- Standalone Next.js build for custom hosting