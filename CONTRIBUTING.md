# Contributing to Free SeoAnalyser

First off, thank you for considering contributing to Free SeoAnalyser! It's people like you that help keep this tool free and accessible for everyone in the SEO community.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and expected**
- **Include screenshots if possible**
- **Include your environment details** (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Provide specific examples to demonstrate the feature**
- **Describe the current behavior and expected behavior**
- **Explain why this enhancement would be useful**

### Your First Code Contribution

Unsure where to begin? You can start by looking through these issues:

- Issues labeled `good first issue` - should only require a few lines of code
- Issues labeled `help wanted` - more involved than beginner issues

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** following our coding standards
4. **Add tests** if applicable
5. **Ensure tests pass**: `npm test` (if available)
6. **Update documentation** if needed
7. **Commit your changes** using descriptive commit messages
8. **Push to your fork** and submit a pull request

## Development Setup

1. **Clone your fork**
```bash
git clone https://github.com/YOUR_USERNAME/seoanalyser.git
cd seoanalyser
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Set up database**
```bash
# Make sure PostgreSQL is running
npm run db:migrate
```

5. **Start development server**
```bash
npm run dev
```

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Keep functions small and focused

### React Components

- Use functional components with hooks
- Keep components small and reusable
- Use proper TypeScript types for props
- Follow the existing file structure

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
Add AI-powered keyword suggestion feature

- Implement DeepSeek API integration
- Add keyword analysis algorithm
- Update UI components for suggestions
- Add tests for new features

Closes #123
```

## Testing

- Write tests for new features when applicable
- Ensure all tests pass before submitting PR
- Test your changes in different browsers
- Test responsive design on different screen sizes

## Documentation

- Update README.md if needed
- Add JSDoc comments to new functions
- Update API documentation for new endpoints
- Include examples for new features

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

## Recognition

Contributors will be recognized in our README.md file. We appreciate every contribution, no matter how small!

---

Thank you for contributing to Free SeoAnalyser! 🚀