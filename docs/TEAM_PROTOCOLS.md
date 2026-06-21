# Team Protocols

## Git Workflow
- Main development branch: `claude/software-dev-agent-team-60tq24`
- Always pull before pushing: `git pull origin claude/software-dev-agent-team-60tq24`
- Commit messages follow: `feat|fix|docs|chore(scope): description`
- Scopes: backend, frontend, 3d, excel, electrical, drafter, arch, pm

## Code Standards

### Backend (Python)
- Type hints required on all functions
- Pydantic models for all API schemas
- No bare `except:` - always catch specific exceptions
- Function names: snake_case
- Class names: PascalCase

### Frontend (TypeScript)
- No `any` types
- React functional components only (no class components)
- Props interfaces defined for all components
- File names: PascalCase for components, camelCase for utilities

## Communication Protocol
- Each agent documents what it built in its commit message
- If file conflict: pull, resolve by keeping both sets of changes
- Architecture decisions go in `docs/` folder

## Testing Requirements (Phase 2)
- Backend: pytest with 80% coverage minimum
- Frontend: React Testing Library for components
- Integration: Playwright for E2E tests
