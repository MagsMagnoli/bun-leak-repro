# Bun Memory Leak Reproduction

This repository contains a minimal reproduction of a memory leak issue in Bun's file upload handling. The application demonstrates a potential memory leak when handling file uploads over time.

## Overview

The application is a simple Express server that:
- Accepts file uploads
- Automatically creates and uploads dummy files every 2 seconds
- Monitors and displays memory usage
- Shows server information including Bun version and upload statistics

## Setup

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

## What to Observe

1. The server will start at `http://localhost:3000`
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
- Runtime: Bun
- Dependencies: Express, Multer

## Contributing

Feel free to:
1. Fork the repository
2. Create a branch for your investigation
3. Submit a pull request with your findings or fixes

## License

MIT
