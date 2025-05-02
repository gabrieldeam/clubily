// src/app/dashboard/page.tsx
"use client";

import { useSupabase } from "@/app/supabase-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for the chart
const visitData = [
  { name: 'Mon', visits: 400 },
  { name: 'Tue', visits: 300 },
  { name: 'Wed', visits: 200 },
  { name: 'Thu', visits: 278 },
  { name: 'Fri', visits: 189 },
  { name: 'Sat', visits: 239 },
  { name: 'Sun', visits: 349 },
];

export default function Dashboard() {
  const { session, supabase } = useSupabase();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      console.log("No session found, redirecting to login...");
      router.push("/");
    } else {
      // Optional: Fetch profile again to ensure role and get name
      const fetchProfile = async () => {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", session.user.id)
            .single();

          if (error || !profile) {
            console.error("Error fetching profile or profile not found:", error);
            await supabase.auth.signOut();
            router.push("/");
          } else if (profile.role !== "merchant_admin") {
            console.log("User is not merchant_admin, signing out...");
            await supabase.auth.signOut();
            alert("Access denied.");
            router.push("/");
          } else {
            setUserName(profile.full_name);
            setLoading(false);
          }
        } catch (e) {
          console.error("Exception fetching profile:", e);
          await supabase.auth.signOut();
          router.push("/");
        }
      };
      fetchProfile();
    }
  }, [session, router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Merchant Dashboard</h1>
        <div>
          <span className="mr-4 text-gray-600">Welcome, {userName || session?.user?.email}!</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Placeholder KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Visits (Last 7 Days)</h2>
          <p className="text-3xl font-bold text-blue-600">1,955</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Points Awarded (Today)</h2>
          <p className="text-3xl font-bold text-green-600">8,500</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Active Campaigns</h2>
          <p className="text-3xl font-bold text-purple-600">12</p>
        </div>
      </div>

      {/* Placeholder Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Weekly Visits</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={visitData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="visits" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Links to other sections */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="/rules" className="block bg-blue-500 hover:bg-blue-600 text-white text-center font-bold py-4 px-6 rounded-lg shadow transition duration-200">Manage Rules</a>
        <a href="/surveys" className="block bg-green-500 hover:bg-green-600 text-white text-center font-bold py-4 px-6 rounded-lg shadow transition duration-200">Manage Surveys</a>
        <a href="/ads" className="block bg-purple-500 hover:bg-purple-600 text-white text-center font-bold py-4 px-6 rounded-lg shadow transition duration-200">Manage Ads</a>
        <a href="/billing" className="block bg-yellow-500 hover:bg-yellow-600 text-white text-center font-bold py-4 px-6 rounded-lg shadow transition duration-200">Billing</a>
      </div>
    </div>
  );
}

