# Bun Memory Leak Reproduction

This repository contains a minimal reproduction of a memory leak issue in Bun's file upload handling. The application demonstrates a potential memory leak when handling file uploads over time.

## Overview

The application is a simple Express server that:
- Accepts file uploads
- Automatically creates and uploads dummy files every 2 seconds
- Monitors and displays memory usage
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
# Run with Bun 1.2.7
bun run start:1.2.7

# Run with Bun 1.2.1
bun run start:1.2.1
```

Each version will run on a different port:
- Bun 1.2.7: http://localhost:3002
- Bun 1.2.1: http://localhost:3003

## What to Observe

1. The server will start at the specified port
2. Watch the memory usage in the console logs (every 5 seconds)
3. Notice the gradual increase in memory usage over time
4. Monitor the number of uploaded files in the `uploads` directory

## Key Components

- Express server with multer for file upload handling
- Automatic dummy file generation and upload every 2 seconds
- Memory usage monitoring
- Web interface showing real-time server statistics

## Expected Behavior

The memory usage should gradually increase over time due to:
- File upload handling
- Automatic dummy file creation and upload
- Potential memory not being properly released after file operations

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
