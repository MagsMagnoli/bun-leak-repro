import express, { type Request, type Response } from "express";
import { readdir } from "fs/promises";
import multer from "multer";
import { join } from "path";
import { heapStats } from "bun:jsc";

const app = express();
const port = 3000;

// Configure multer for file upload
const upload = multer({
  dest: join(__dirname, "uploads"),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Create uploads directory if it doesn't exist
import { mkdir, readFile, writeFile } from "fs/promises";
await mkdir(join(__dirname, "uploads"), { recursive: true });

// Store previous heap stats to track allocation changes
let prevHeapStats = heapStats();
let lastCpuUsage = process.cpuUsage();
let lastUsageTime = performance.now();

// Function to get memory usage with enhanced monitoring
function getMemoryUsage() {
  const used = process.memoryUsage();
  const currentHeapStats = heapStats();
  const currentCpuUsage = process.cpuUsage();
  const currentTime = performance.now();
  const elapsedTime = currentTime - lastUsageTime;

  // Calculate CPU usage as percentage
  const userCpuUsage = (currentCpuUsage.user - lastCpuUsage.user) / 1000; // convert to ms
  const systemCpuUsage = (currentCpuUsage.system - lastCpuUsage.system) / 1000; // convert to ms
  const totalCpuUsage = userCpuUsage + systemCpuUsage;
  const cpuPercent = (totalCpuUsage / elapsedTime) * 100;

  // Calculate allocation changes
  const allocationChanges = {
    heapSize: currentHeapStats.heapSize - prevHeapStats.heapSize,
    objectCount: currentHeapStats.objectCount - prevHeapStats.objectCount,
  };

  // Find top growing object types
  const topGrowingTypes = [];
  const currentTypes = currentHeapStats.objectTypeCounts;
  const prevTypes = prevHeapStats.objectTypeCounts;

  for (const type in currentTypes) {
    const current = currentTypes[type] || 0;
    const prev = prevTypes[type] || 0;
    const diff = current - prev;

    if (diff > 0) {
      topGrowingTypes.push({ type, growth: diff });
    }
  }

  // Sort by growth and take top 5
  topGrowingTypes.sort((a, b) => b.growth - a.growth);
  const top5GrowingTypes = topGrowingTypes.slice(0, 5);

  // Find top object types by count
  const topObjectTypes = [];
  for (const type in currentTypes) {
    const count = currentTypes[type] || 0;
    if (count > 0) {
      topObjectTypes.push({ type, count });
    }
  }

  // Sort by count and take top 5
  topObjectTypes.sort((a, b) => b.count - a.count);
  const top5ObjectTypes = topObjectTypes.slice(0, 5);

  // Update previous stats for next comparison
  prevHeapStats = currentHeapStats;
  lastCpuUsage = currentCpuUsage;
  lastUsageTime = currentTime;

  return {
    rss: `${Math.round((used.rss / 1024 / 1024) * 100) / 100} MB`,
    heapTotal: `${Math.round((used.heapTotal / 1024 / 1024) * 100) / 100} MB`,
    heapUsed: `${Math.round((used.heapUsed / 1024 / 1024) * 100) / 100} MB`,
    external: `${Math.round((used.external / 1024 / 1024) * 100) / 100} MB`,
    cpuUsage: {
      percentage: `${Math.round(cpuPercent * 100) / 100}%`,
      user: `${Math.round(userCpuUsage)}ms`,
      system: `${Math.round(systemCpuUsage)}ms`,
    },
    allocations: {
      current: {
        heapSize: currentHeapStats.heapSize,
        objectCount: currentHeapStats.objectCount,
      },
      changes: {
        heapSize: allocationChanges.heapSize,
        objectCount: allocationChanges.objectCount,
      },
    },
    topGrowingObjectTypes: top5GrowingTypes,
    topObjectTypes: top5ObjectTypes,
  };
}

// Function to get number of uploaded files
async function getUploadedFilesCount(): Promise<number> {
  try {
    const files = await readdir(join(__dirname, "uploads"));
    return files.length;
  } catch (error) {
    console.error("Error counting uploaded files:", error);
    return 0;
  }
}

// Function to get server info
async function getServerInfo() {
  const memoryUsage = getMemoryUsage();
  const uploadedFilesCount = await getUploadedFilesCount();
  return {
    ...memoryUsage,
    bunVersion: process.versions.bun,
    uploadedFilesCount,
  };
}

// Function to create and upload a dummy file
async function createAndUploadDummyFile() {
  try {
    const file = Bun.file("dummy.txt");

    const formData = new FormData();
    // @ts-ignore - Bun's FormData implementation is compatible
    formData.append("file", file);

    // Upload the file
    const response = await fetch(`http://localhost:${port}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    const result = await response.text();
    console.log("Dummy file uploaded successfully:", result);
  } catch (error) {
    console.error(
      "Error uploading dummy file:",
      error instanceof Error ? error.message : error
    );
  }
}

// Set up intervals for memory logging and dummy file uploads
setInterval(() => {
  const memoryUsage = getMemoryUsage();
  console.log("\nMemory Usage:", {
    rss: memoryUsage.rss,
    heapTotal: memoryUsage.heapTotal,
    heapUsed: memoryUsage.heapUsed,
    external: memoryUsage.external,
  });

  console.log("CPU Usage:", memoryUsage.cpuUsage);

  console.log("Allocations:", {
    current: memoryUsage.allocations.current,
    changes: memoryUsage.allocations.changes,
  });

  console.log("Top Object Types by Count:", memoryUsage.topObjectTypes);
  console.log("Top Growing Object Types:", memoryUsage.topGrowingObjectTypes);
}, 5000);

// Start automatic dummy file uploads
setInterval(createAndUploadDummyFile, 2000);

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send(`
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>File Upload</title>
        <style>
          body { 
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 15px;
            line-height: 1.5; 
          }
          h1 {
            font-size: 1.8rem;
            margin-bottom: 1rem;
          }
          h3 {
            font-size: 1.3rem;
            margin-bottom: 0.8rem;
          }
          h4 {
            font-size: 1rem;
            margin: 0 0 0.5rem 0;
          }
          .server-info { 
            background: #f5f5f5; 
            padding: 15px; 
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); 
            gap: 15px; 
          }
          .info-item { 
            background: white; 
            padding: 12px; 
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          pre {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.85rem;
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 200px;
            overflow-y: auto;
            background: #f9f9f9;
            padding: 8px;
            border-radius: 4px;
            scrollbar-width: thin;
          }
          pre::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          pre::-webkit-scrollbar-thumb {
            background-color: #ccc;
            border-radius: 3px;
          }
          .positive-change { color: #22c55e; }
          .negative-change { color: #ef4444; }
          
          /* Mobile adjustments */
          @media (max-width: 640px) {
            body { 
              padding: 10px;
            }
            .server-info {
              padding: 10px;
            }
            .info-grid {
              gap: 10px;
            }
            .info-item {
              padding: 10px;
            }
            pre {
              font-size: 0.75rem;
              max-height: 150px;
            }
          }
        </style>
      </head>
      <body>
        <h1>File Upload Server</h1>
        <div class="server-info">
          <h3>Server Information:</h3>
          <div class="info-grid">
            <div class="info-item">
              <h4>Memory Usage</h4>
              <pre id="memoryUsage">Loading...</pre>
            </div>
            <div class="info-item">
              <h4>CPU Usage</h4>
              <pre id="cpuUsage">Loading...</pre>
            </div>
            <div class="info-item">
              <h4>Allocations</h4>
              <pre id="allocations">Loading...</pre>
            </div>
            <div class="info-item">
              <h4>Top Object Types</h4>
              <pre id="topTypes">Loading...</pre>
            </div>
            <div class="info-item">
              <h4>Top Growing Types</h4>
              <pre id="topGrowingTypes">Loading...</pre>
            </div>
            <div class="info-item">
              <h4>Bun Version</h4>
              <pre id="bunVersion">Loading...</pre>
            </div>
            <div class="info-item">
              <h4>Uploaded Files</h4>
              <pre id="uploadedFiles">Loading...</pre>
            </div>
          </div>
        </div>
        <script>
          function updateServerInfo() {
            fetch('/server-info')
              .then(res => res.json())
              .then(data => {
                document.getElementById('memoryUsage').textContent = JSON.stringify({
                  rss: data.rss,
                  heapTotal: data.heapTotal,
                  heapUsed: data.heapUsed,
                  external: data.external
                }, null, 2);
                document.getElementById('cpuUsage').textContent = JSON.stringify(data.cpuUsage, null, 2);
                
                // Format allocations to show current values and changes
                const allocationsEl = document.getElementById('allocations');
                allocationsEl.textContent = JSON.stringify({
                  current: data.allocations.current,
                  changes: data.allocations.changes
                }, null, 2);
                
                document.getElementById('topTypes').textContent = JSON.stringify(data.topObjectTypes, null, 2);
                document.getElementById('topGrowingTypes').textContent = JSON.stringify(data.topGrowingObjectTypes, null, 2);
                document.getElementById('bunVersion').textContent = data.bunVersion;
                document.getElementById('uploadedFiles').textContent = data.uploadedFilesCount;
              })
              .catch(err => {
                console.error('Error fetching server info:', err);
              });
          }
          
          // Update immediately and then every 5 seconds
          updateServerInfo();
          setInterval(updateServerInfo, 5000);
        </script>
      </body>
    </html>
  `);
});

app.get("/server-info", async (req: Request, res: Response) => {
  res.json(await getServerInfo());
});

app.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    for (let i = 0; i < 10; i++) {
      console.log(`Reading and writing file ${req.file.filename}`);
      const data = await readFile(req.file.path);

      console.log(`Writing file ${req.file.filename}`);

      await writeFile(join(__dirname, "storage", req.file.filename), data);
    }

    res.send(`File uploaded successfully: ${req.file.filename}`);
  }
);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
