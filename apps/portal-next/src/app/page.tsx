// src/app/page.tsx
"use client";

import AuthForm from "@/components/AuthForm";
import { useSupabase } from "./supabase-provider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { session, supabase } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    const checkUserRoleAndRedirect = async () => {
      if (session) {
        console.log("Session exists, checking profile role...");
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (error) {
            console.error("Error fetching profile on root page:", error);
            // Sign out if profile fetch fails
            await supabase.auth.signOut();
            router.refresh();
            return;
          }

          if (profile && profile.role === "merchant_admin") {
            console.log("User is merchant_admin, redirecting to dashboard...");
            router.push("/dashboard");
          } else {
            // If user is logged in but not merchant_admin, sign them out from the portal
            console.log("User logged in but not merchant_admin, signing out...");
            await supabase.auth.signOut();
            alert("Access denied. Only merchant administrators can log in here.");
            router.refresh();
          }
        } catch (fetchError) {
          console.error("Exception checking profile on root page:", fetchError);
          await supabase.auth.signOut();
          router.refresh();
        }
      }
    };

    checkUserRoleAndRedirect();

  }, [session, router, supabase]);

  // If there is no session, show the AuthForm
  if (!session) {
    return <AuthForm />;
  }

  // If session exists but redirection hasn't happened yet (or role check failed and signed out),
  // show a loading state or minimal content to avoid flashing AuthForm
  return (
    <div className="flex items-center justify-center min-h-screen">
      Loading...
    </div>
  );
}

