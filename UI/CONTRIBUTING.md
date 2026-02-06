# Contributing to Patient Admin App

Thank you for considering contributing to this project! Here are some guidelines to help you get started.

## Code of Conduct

Please be respectful and considerate in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Potential implementation approach

### Pull Requests

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/patient-admin-app.git
   cd patient-admin-app
   npm install
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Changes**
   - Write clean, maintainable code
   - Follow existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Test Your Changes**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   npm run build
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve bug"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting, etc.)
   - `refactor:` Code refactoring
   - `test:` Adding or updating tests
   - `chore:` Maintenance tasks

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   
   Then create a Pull Request on GitHub with:
   - Clear title and description
   - Link to related issues
   - Screenshots/recordings if applicable

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Testing

- Write unit tests for utilities and hooks
- Write integration tests for components
- Aim for >80% code coverage
- Use MSW for API mocking

### Component Guidelines

- Use functional components with hooks
- Keep components small and reusable
- Use TypeScript for prop types
- Document complex props with JSDoc

### State Management

- Use React Context for global state
- Use SWR for server state
- Use local state for component-specific state

### API Integration

- Add new endpoints to appropriate service files
- Update TypeScript types in `src/types/`
- Add MSW handlers for mocking
- Handle errors appropriately

## Project Setup

### Environment Setup

1. Copy `.env.example` to `.env.local`
2. Configure environment variables
3. Enable mocks if needed: `VITE_ENABLE_MOCKS=true`

### Running Locally

```bash
# Development with hot reload
npm run dev

# Run tests in watch mode
npm run test

# Run linter
npm run lint

# Format code
npm run format
```

## Questions?

Feel free to open an issue for any questions or clarifications.

Thank you for contributing! 🎉
