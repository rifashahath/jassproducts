/**
 * Utility script to create or update an Admin account in Supabase Auth.
 * Usage:
 *   node scripts/set-admin-password.js <email> <password>
 * Example:
 *   node scripts/set-admin-password.js dr.jass@jassproducts.com "jassproducts123#2026"
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://duxjhmhgiacmuuqzfjxs.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eGpobWhnaWFjbXV1cXpmanhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU5NTA4NywiZXhwIjoyMTA0MTcxMDg3fQ._X4hT06eNEhvFWA7y7TmFH23dZX1Tw-1QSW3znsPBeo";

const email = process.argv[2] || "dr.jass@jassproducts.com";
const password = process.argv[3];

if (!password) {
  console.error("Error: Please provide a password.");
  console.log("Usage: node scripts/set-admin-password.js <email> <password>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log(`Setting up admin account for: ${email}...`);

  // 1. Check if user already exists
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to list users:", listError.message);
    process.exit(1);
  }

  const existing = userList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  let userId;
  if (existing) {
    console.log(`User found (ID: ${existing.id}). Updating password...`);
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { role: "SUPER_ADMIN", full_name: "Dr. Jass" },
    });
    if (error) {
      console.error("Failed to update user:", error.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log("Password updated successfully.");
  } else {
    console.log("User not found. Creating new admin user in Supabase Auth...");
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "SUPER_ADMIN", full_name: "Dr. Jass" },
    });
    if (error) {
      console.error("Failed to create user:", error.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log(`User created successfully with ID: ${userId}`);
  }

  // 2. Ensure role is SUPER_ADMIN in public.profiles table
  console.log("Updating role in public.profiles table...");
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    email,
    full_name: "Dr. Jass",
    role: "SUPER_ADMIN",
  });

  if (profileError) {
    console.warn("Could not upsert profile:", profileError.message);
  } else {
    console.log("Profile updated to SUPER_ADMIN.");
  }

  console.log("\n SUCCESS: Admin account configured with strong password in Supabase Auth.");
  console.log(`Email: ${email}`);
}

main().catch(console.error);
