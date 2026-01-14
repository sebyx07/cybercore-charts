# Contributing to CYBERCORE CHARTS

Thank you for your interest in contributing to CYBERCORE CHARTS. This document
provides guidelines for contributing to the project.

## Code of Conduct

Be respectful and constructive. We welcome contributors of all experience levels.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature`

## Development Workflow

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run linter
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

## Project Structure

```
src/
├── charts/     # Chart type implementations
├── utils/      # Shared utilities
├── styles/     # Theme and style definitions
├── types.ts    # TypeScript definitions
└── index.ts    # Main exports
```

## Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Provide explicit return types for public functions
- Use `import type` for type-only imports
- Document public APIs with JSDoc comments

### SVG Output

- All charts must output valid SVG 1.1
- Use `currentColor` for themeable colors
- Support both string and element output
- Ensure SSR compatibility (no DOM dependencies in render path)

### Testing

- Write unit tests for all public APIs
- Include visual regression tests for chart output
- Test both Node.js and browser environments
- Maintain >80% code coverage

### Code Style

- Use Prettier for formatting
- Follow ESLint rules
- Use meaningful variable names
- Keep functions focused and small

## Pull Request Process

1. **Branch**: Create a feature branch from `main`
2. **Develop**: Make your changes following the coding standards
3. **Test**: Ensure all tests pass (`npm run test`)
4. **Lint**: Fix any linting issues (`npm run lint:fix`)
5. **Commit**: Use clear commit messages

   ```
   feat: Add radar chart animation support
   fix: Correct pie chart label positioning
   docs: Update API reference for bar chart
   refactor: Simplify scale calculation logic
   ```

6. **Push**: Push your branch to your fork
7. **PR**: Open a pull request with a clear description

### PR Description Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Visual tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated if needed
```

## Adding a New Chart Type

1. Create `src/charts/your-chart.ts`
2. Implement the chart class extending base chart
3. Export from `src/charts/index.ts`
4. Add to main `src/index.ts` exports
5. Write unit tests in `tests/charts/your-chart.test.ts`
6. Add visual regression test
7. Update documentation
8. Add demo page example

### Chart Implementation Template

```typescript
import type { ChartOptions, DataPoint } from '../types';
import { BaseChart } from './base';

export interface YourChartOptions extends ChartOptions {
  data: DataPoint[];
  // chart-specific options
}

export class YourChart extends BaseChart<YourChartOptions> {
  constructor(options: YourChartOptions) {
    super(options);
  }

  render(): string {
    // Return SVG string
  }

  toElement(): SVGElement {
    // Return SVG element
  }
}
```

## Reporting Bugs

Use GitHub Issues with the following information:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser/Node.js version
- Minimal reproduction code

## Feature Requests

Open a GitHub Issue with:

- Clear description of the feature
- Use case and motivation
- Proposed API (if applicable)
- Willingness to implement

## Questions

For questions, use GitHub Discussions rather than Issues.

---

Thank you for contributing to CYBERCORE CHARTS.
