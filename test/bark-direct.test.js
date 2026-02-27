import axios from "axios";

const barkUrl = process.env.BARK_URL;
const title = "CoStrict 验证测试";
const message = "Bark 通知功能正常工作";

console.log("Testing Bark API directly...\n");
console.log("BARK_URL:", barkUrl);
console.log("Title:", title);
console.log("Message:", message);
console.log();

if (!barkUrl) {
  console.log("✗ BARK_URL not configured");
  process.exit(1);
}

try {
  const url = `${barkUrl}/${encodeURIComponent(title)}/${encodeURIComponent(message)}`;
  console.log("Sending request to:", url);
  
  const response = await axios.get(url, { params: { timeout: 5 } });
  
  console.log("\nResponse status:", response.status);
  console.log("Response data:", JSON.stringify(response.data, null, 2));
  console.log("\n✓ Bark notification sent successfully!");
} catch (error) {
  console.log("\n✗ Bark notification failed:", error.message);
  if (error.response) {
    console.log("  Response status:", error.response.status);
    console.log("  Response data:", JSON.stringify(error.response.data, null, 2));
  }
  process.exit(1);
}
