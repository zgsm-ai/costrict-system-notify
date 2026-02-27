import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const srcPath = path.join(__dirname, "..", "src", "index.js");

const moduleContent = await fs.readFile(srcPath, "utf-8");

const mockProcess = {
  env: {
    BARK_URL: process.env.BARK_URL,
    NOTIFY_ENABLE_BARK: process.env.NOTIFY_ENABLE_BARK,
    NOTIFY_ENABLE_SYSTEM: process.env.NOTIFY_ENABLE_SYSTEM,
  },
};

const mockImport = async (module) => {
  return {};
};

const loadNotifierFunction = new Function(
  "mockProcess",
  "mockImport",
  `
${moduleContent
  .replace(/export async function/g, "async function")
  .replace(/process\.env/g, "mockProcess.env")
  .replace(/await import\(/g, "await mockImport(")}
  
return {
  BarkNotifier,
  sendNotification
};
`
);

const { BarkNotifier, sendNotification } = loadNotifierFunction(mockProcess, mockImport);

console.log("Testing Bark notification with real API...\n");
console.log("Environment variables:");
console.log("  BARK_URL:", mockProcess.env.BARK_URL);
console.log("  NOTIFY_ENABLE_BARK:", mockProcess.env.NOTIFY_ENABLE_BARK);
console.log();

try {
  const barkNotifier = new BarkNotifier();
  
  console.log("Sending test notification via Bark...");
  console.log("  Title: CoStrict 测试通知");
  console.log("  Message: 这是一条测试消息");
  
  await barkNotifier.notify(
    "CoStrict 测试通知",
    "这是一条测试消息",
    { timeout: 5 }
  );
  
  console.log("\n✓ Bark notification sent successfully!");
  
  console.log("\nTesting sendNotification with Bark enabled...");
  
  mockProcess.env.NOTIFY_ENABLE_SYSTEM = "false";
  mockProcess.env.NOTIFY_ENABLE_BARK = "true";
  
  const result = await sendNotification(
    "CoStrict 测试通知 2",
    "通过 sendNotification 发送",
    { timeout: 5 }
  );
  
  if (result) {
    console.log("✓ sendNotification with Bark: Success!");
  } else {
    console.log("✗ sendNotification with Bark: Failed");
    process.exit(1);
  }
  
} catch (error) {
  console.log("\n✗ Bark notification failed:", error.message);
  process.exit(1);
}
