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
  let url = `${barkUrl}/${encodeURIComponent(title)}/${encodeURIComponent(message)}`;
  url += '?timeout=5';
  console.log("Sending request to:", url);
  
  const response = await fetch(url);
  
  console.log("\nResponse status:", response.status);
  const data = await response.json();
  console.log("Response data:", JSON.stringify(data, null, 2));
  console.log("\n✓ Bark notification sent successfully!");
} catch (error) {
  console.log("\n✗ Bark notification failed:", error.message);
  process.exit(1);
}
