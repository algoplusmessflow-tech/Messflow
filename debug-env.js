// Debug script to check environment variables
// Run this in Supabase Edge Functions logs

console.log("Environment Variables Check:");
console.log("GDRIVE_SERVICE_ACCOUNT_EMAIL:", Deno.env.get("GDRIVE_SERVICE_ACCOUNT_EMAIL") ? "✓ Set" : "✗ Missing");
console.log("GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY:", Deno.env.get("GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY") ? "✓ Set" : "✗ Missing");
console.log("GDRIVE_ROOT_FOLDER_ID:", Deno.env.get("GDRIVE_ROOT_FOLDER_ID") ? "✓ Set" : "✗ Missing");

// Check private key format
const privateKey = Deno.env.get("GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY");
if (privateKey) {
  console.log("Private key starts with:", privateKey.substring(0, 30));
  console.log("Private key contains newlines:", privateKey.includes("\\n"));
}