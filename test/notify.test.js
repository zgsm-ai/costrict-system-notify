import assert from "node:assert";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const srcPath = path.join(__dirname, "..", "src", "index.js");

const moduleContent = await fs.readFile(srcPath, "utf-8");

const exports = {};

const mockProcess = {
  env: {},
};

const mockImport = async (module) => {
  if (module === "node-notifier") {
    return {
      notify: (options, callback) => {
        callback(null, "success");
      },
    };
  }
  if (module === "axios") {
    return {
      default: {
        get: async () => ({ data: "success" }),
      },
    };
  }
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
  SystemNotifier,
  BarkNotifier,
  sendNotification,
  CoStrictSystemNotifyPlugin
};
`
);

const { SystemNotifier, BarkNotifier, sendNotification, CoStrictSystemNotifyPlugin } =
  loadNotifierFunction(mockProcess, mockImport);

console.log("Running SystemNotifier tests...");

const systemNotifier = new SystemNotifier();

try {
  await systemNotifier.notify("Test Title", "Test Message");
  console.log("✓ SystemNotifier.notify: Success");
} catch (error) {
  console.log("✗ SystemNotifier.notify: Failed -", error.message);
  process.exit(1);
}

console.log("\nRunning BarkNotifier tests...");

mockProcess.env.BARK_URL = "https://api.day.app/test";

const barkNotifier = new BarkNotifier();

try {
  await barkNotifier.notify("Test Title", "Test Message");
  console.log("✓ BarkNotifier.notify: Success");
} catch (error) {
  console.log("✗ BarkNotifier.notify: Failed -", error.message);
  process.exit(1);
}

try {
  mockProcess.env.BARK_URL = undefined;
  const barkNotifierNoUrl = new BarkNotifier();
  await barkNotifierNoUrl.notify("Test Title", "Test Message");
  console.log("✗ BarkNotifier without URL: Should have thrown error");
  process.exit(1);
} catch (error) {
  if (error.message === "Bark URL not configured") {
    console.log("✓ BarkNotifier without URL: Correctly throws error");
  } else {
    console.log("✗ BarkNotifier without URL: Wrong error -", error.message);
    process.exit(1);
  }
}

console.log("\nRunning sendNotification tests...");

mockProcess.env.NOTIFY_ENABLE_SYSTEM = "true";
mockProcess.env.NOTIFY_ENABLE_BARK = "false";

try {
  const result = await sendNotification("Test Title", "Test Message");
  assert.strictEqual(result, true, "sendNotification should return true");
  console.log("✓ sendNotification (system only): Success");
} catch (error) {
  console.log("✗ sendNotification (system only): Failed -", error.message);
  process.exit(1);
}

mockProcess.env.NOTIFY_ENABLE_SYSTEM = "false";
mockProcess.env.NOTIFY_ENABLE_BARK = "true";
mockProcess.env.BARK_URL = "https://api.day.app/test";

try {
  const result = await sendNotification("Test Title", "Test Message");
  assert.strictEqual(result, true, "sendNotification should return true");
  console.log("✓ sendNotification (bark only): Success");
} catch (error) {
  console.log("✗ sendNotification (bark only): Failed -", error.message);
  process.exit(1);
}

mockProcess.env.NOTIFY_ENABLE_SYSTEM = "true";
mockProcess.env.NOTIFY_ENABLE_BARK = "true";

try {
  const result = await sendNotification("Test Title", "Test Message");
  assert.strictEqual(result, true, "sendNotification should return true");
  console.log("✓ sendNotification (both): Success");
} catch (error) {
  console.log("✗ sendNotification (both): Failed -", error.message);
  process.exit(1);
}

console.log("\nRunning CoStrictSystemNotifyPlugin tests...");

mockProcess.env.NOTIFY_ENABLE_SYSTEM = "true";

try {
  const plugin = await CoStrictSystemNotifyPlugin();

  const testCases = [
    {
      type: "permission",
      data: { message: "Test permission message" },
      expectedTitle: "需要权限",
      expectedMessage: "Test permission message",
    },
    {
      type: "question",
      data: { questions: [{ question: "Test question?" }] },
      expectedTitle: "问题",
      expectedMessage: "Test question?",
    },
    {
      type: "idle",
      data: {},
      expectedTitle: "会话空闲",
      expectedMessage: "AI 正在等待您的输入",
    },
  ];

  for (const testCase of testCases) {
    const output = {};
    await plugin["intervention.required"]({ ...testCase }, output);
    assert.strictEqual(output.handled, true, "Plugin should handle the event");
    console.log(
      `✓ Plugin handles ${testCase.type} event: Success`
    );
  }
} catch (error) {
  console.log("✗ CoStrictSystemNotifyPlugin: Failed -", error.message);
  process.exit(1);
}

console.log("\n✓ All tests passed!");
