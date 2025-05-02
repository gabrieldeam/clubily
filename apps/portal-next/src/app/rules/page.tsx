// src/app/rules/page.tsx
"use client";

import { useSupabase } from "@/app/supabase-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RulesPage() {
  const { session, supabase } = useSupabase();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push("/");
    } else {
       // Optional: Verify role again if needed
       setLoading(false);
    }
  }, [session, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading Rules...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Loyalty Rules</h1>
        <a href="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</a>
      </header>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Rules List & Editor</h2>
        {/* Placeholder for CRUD operations (List, Create, Update, Delete forms/buttons) */}
        <p className="text-gray-500">Rule management interface will be implemented here.</p>
        {/* Example: Button to add new rule */}
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200">
          Add New Rule
        </button>
      </div>
    </div>
  );
}

