"use server";

import { createClient } from "@/lib/supabase/server";

export async function getEvents() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select("*");

  if (error) {
    console.error("Error fetching events:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function getCurrentUserEmail() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email
  };
}