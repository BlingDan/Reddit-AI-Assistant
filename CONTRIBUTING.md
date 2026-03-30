# Contributing

Contributions are welcome! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/BlingDan/Reddit-AI-Assistant.git
cd reddit-ai-assistant
npm install
npm run dev          # Chrome dev mode with hot reload
npm run dev:firefox  # Firefox dev mode
```

## Making Changes

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Build to verify: `npm run build`
4. Commit with clear messages
5. Open a Pull Request

## Code Style

- TypeScript throughout
- Follow existing patterns in the codebase
- Keep content scripts lightweight — heavy logic goes in the background worker

## Reporting Issues

- Use [GitHub Issues](https://github.com/BlingDan/Reddit-AI-Assistant/issues)
- Include browser version, extension version, and steps to reproduce
- Screenshots help!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.