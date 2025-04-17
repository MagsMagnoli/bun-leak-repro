#!/usr/bin/env bun
import { spawnSync, spawn } from 'child_process';

// Array of docker tags to clean up if needed
const dockerTags = [
  'upload-server:1.2.1',
  'upload-server:1.2.5',
  'upload-server:1.2.7',
  'upload-server:1.2.10'
];

// Function to clean up any running containers for our image tags
function cleanup(): void {
  console.log('\nCleaning up containers...');
  
  for (const tag of dockerTags) {
    // Find containers with this image
    const findCmd = spawnSync('docker', ['ps', '-q', '--filter', `ancestor=${tag}`]);
    const containerIds = findCmd.stdout.toString().trim();
    
    if (containerIds) {
      console.log(`Stopping containers for ${tag}...`);
      // Split by newlines in case there are multiple containers
      containerIds.split('\n').forEach(id => {
        if (id) {
          spawnSync('docker', ['stop', id]);
          console.log(`Stopped container ${id}`);
        }
      });
    }
  }
  
  console.log('Cleanup complete.');
}

// Register cleanup on various termination signals
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT (Ctrl+C)');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM');
  cleanup();
  process.exit(0);
});

// Also handle unhandled exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught exception:', err);
  cleanup();
  process.exit(1);
});

console.log('Starting all test containers...');
console.log('Press Ctrl+C to stop all containers and exit');

// Run the concurrently command with our test:all
const child = spawn('bun', ['run', 'test:all'], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code: number) => {
  console.log(`Child process exited with code ${code}`);
  cleanup();
});

// Forward signals to child process
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    if (!child.killed) {
      child.kill(signal as NodeJS.Signals);
    }
  });
}); 