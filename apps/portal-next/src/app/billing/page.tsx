// src/app/billing/page.tsx
"use client";

import { useSupabase } from "@/app/supabase-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BillingPage() {
  const { session, supabase } = useSupabase();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push("/");
    } else {
      // Fetch simulated subscription status
      // In a real app, fetch from your backend which might interact with Stripe
      // For now, simulate fetching a status (e.g., 'active', 'trialing')
      // Replace with actual API call to GET /api/v1/billing/subscription?store_id=...
      setSubscriptionStatus("active (simulated)");
      setLoading(false);
    }
  }, [session, router]);

  const handleManageSubscription = async () => {
    // In a real app, call your backend to get a Stripe Portal session URL
    // POST /api/v1/billing/subscription/manage?store_id=...
    alert("Simulation: Redirecting to Stripe Customer Portal...");
    // const response = await fetch("/api/v1/billing/subscription/manage", { method: "POST" });
    // const data = await response.json();
    // window.location.href = data.url;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading Billing...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Billing & Subscription</h1>
        <a href="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</a>
      </header>
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Current Plan</h2>
        <p className="text-gray-600 mb-4">Your current subscription status is: <span className="font-semibold">{subscriptionStatus || "Loading..."}</span></p>
        {/* Placeholder for Stripe Portal Button */}
        <button
          onClick={handleManageSubscription}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200"
        >
          Manage Subscription (Simulated)
        </button>
        <p className="text-sm text-gray-500 mt-2">Clicking this would normally redirect you to Stripe to manage your payment methods and subscription plan.</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Invoice History</h2>
        {/* Placeholder for Invoice List */}
        <p className="text-gray-500">Your past invoices will be listed here.</p>
        {/* Example Invoice Item */}
        <div className="mt-4 border-t pt-4">
          <p>Invoice #12345 - May 1, 2025 - $19.99 (Paid)</p>
          <a href="#" className="text-blue-600 hover:underline text-sm">Download PDF (Simulated)</a>
        </div>
      </div>
    </div>
  );
}

