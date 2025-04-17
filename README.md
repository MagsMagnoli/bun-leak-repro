# Bun Memory Leak Reproduction

This repository contains a minimal reproduction of a memory leak issue in Bun's file upload handling. The application demonstrates a potential memory leak when handling file uploads over time.

## Overview

The application is a simple Express server that:
- Accepts file uploads
- Automatically creates and uploads dummy files every 2 seconds
- Monitors and displays detailed system metrics including:
  - Memory usage
  - CPU usage
  - Allocation tracking
  - Top growing object types
- Shows server information including Bun version and upload statistics

## Setup

### Local Setup

1. Ensure you have Bun installed:
```bash
curl -fsSL https://bun.sh/install | bash
```

2. Install dependencies:
```bash
bun install
```

3. Run the server:
```bash
bun run index.ts
```

### Docker Setup (Different Bun Versions)

To test the memory leak with different Bun versions:

```bash
# Run with Bun 1.2.10
bun run start:1.2.10

# Run with Bun 1.2.7
bun run start:1.2.7

# Run with Bun 1.2.5
bun run start:1.2.5

# Run with Bun 1.2.1
bun run start:1.2.1

# Run all versions simultaneously for comparison
bun run test
```

Using `bun run test` will start all containers with proper signal handling - you can press Ctrl+C at any time to gracefully stop all containers. This is the recommended way to run the tests.

Alternatively, you can use `bun run test:all` directly, but may need to manually clean up containers with `bun run cleanup` if terminated unexpectedly.

Each version will run on a different port:
- Bun 1.2.10: http://localhost:3001
- Bun 1.2.7: http://localhost:3002
- Bun 1.2.1: http://localhost:3003
- Bun 1.2.5: http://localhost:3004

## What to Observe

1. The server will start at the specified port
2. Watch the memory and CPU usage in the console logs (every 5 seconds)
3. Notice the gradual increase in memory usage over time
4. Monitor the number of uploaded files in the `uploads` directory
5. Track allocation changes and growing object types to identify potential memory leaks

## Key Components

- Express server with multer for file upload handling
- Automatic dummy file generation and upload every 2 seconds
- Advanced performance monitoring:
  - Memory usage tracking
  - CPU usage monitoring
  - JavaScript heap allocation tracking
  - Top growing object types visualization
- Web interface showing real-time server statistics

## Expected Behavior

The memory usage should gradually increase over time due to:
- File upload handling
- Automatic dummy file creation and upload
- Potential memory not being properly released after file operations

The enhanced monitoring helps identify which specific object types are growing the most, providing insights into the exact nature of the memory leak.

## Environment

- OS: macOS 24.3.0
- Runtime: Bun (multiple versions for testing)
- Dependencies: Express, Multer
- Docker support included for version comparison

## Contributing

Feel free to:
1. Fork the repository
2. Create a branch for your investigation
3. Submit a pull request with your findings or fixes

## License

MIT
