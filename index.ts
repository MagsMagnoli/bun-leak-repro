import express, { type Request, type Response } from "express";
import { readdir } from "fs/promises";
import multer from "multer";
import { join } from "path";

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
import { mkdir } from "fs/promises";
await mkdir(join(__dirname, "uploads"), { recursive: true });

// Function to get memory usage
function getMemoryUsage() {
  const used = process.memoryUsage();
  return {
    rss: `${Math.round((used.rss / 1024 / 1024) * 100) / 100} MB`,
    heapTotal: `${Math.round((used.heapTotal / 1024 / 1024) * 100) / 100} MB`,
    heapUsed: `${Math.round((used.heapUsed / 1024 / 1024) * 100) / 100} MB`,
    external: `${Math.round((used.external / 1024 / 1024) * 100) / 100} MB`,
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
  console.log("\nMemory Usage:", memoryUsage);
}, 5000);

// Start automatic dummy file uploads
setInterval(createAndUploadDummyFile, 2000);

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send(`
    <html>
      <head>
        <title>File Upload</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .server-info { background: #f5f5f5; padding: 10px; border-radius: 4px; }
          .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
          .info-item { background: white; padding: 10px; border-radius: 4px; }
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
                document.getElementById('bunVersion').textContent = data.bunVersion;
                document.getElementById('uploadedFiles').textContent = data.uploadedFilesCount;
              });
          }
          setInterval(updateServerInfo, 5000);
          updateServerInfo();
        </script>
      </body>
    </html>
  `);
});

app.get("/server-info", async (req: Request, res: Response) => {
  res.json(await getServerInfo());
});

app.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  res.send(`File uploaded successfully: ${req.file.filename}`);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
