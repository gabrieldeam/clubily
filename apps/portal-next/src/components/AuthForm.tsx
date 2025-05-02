// src/components/AuthForm.tsx
"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthForm() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          console.log("User signed in, checking profile...");
          // Fetch profile to check role after sign-in
          try {
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", session.user.id)
              .single();

            if (error) {
              console.error("Error fetching profile:", error);
              // Handle error, maybe sign out user or show error message
              await supabase.auth.signOut();
              router.refresh(); // Refresh to reflect signed-out state
              return;
            }

            console.log("Profile fetched:", profile);

            if (profile && profile.role === "merchant_admin") {
              console.log("User is merchant_admin, redirecting to dashboard...");
              router.push("/dashboard");
            } else {
              console.log("User is not merchant_admin, signing out...");
              // If user is not a merchant admin, sign them out from the portal
              await supabase.auth.signOut();
              // Optionally show a message indicating access denied
              alert("Access denied. Only merchant administrators can log in here.");
              router.refresh(); // Refresh to reflect signed-out state
            }
          } catch (fetchError) {
            console.error("Exception fetching profile:", fetchError);
            await supabase.auth.signOut();
            router.refresh();
          }
        } else if (event === "SIGNED_OUT") {
          console.log("User signed out, redirecting to login page...");
          // Ensure user is redirected to login page on sign out
          // No need to push here, the page logic should handle lack of session
          router.refresh(); // Refresh page to update UI based on session state
        }
      }
    );

    // Cleanup function
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Merchant Portal Login</h2>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="light"
          providers={["google", "github"]} // Add providers as needed
          redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`} // Adjust if using a callback route
          localization={{
            variables: {
              sign_in: {
                email_label: "Email address",
                password_label: "Password",
                button_label: "Sign in",
                social_provider_text: "Sign in with {{provider}}",
                link_text: "Already have an account? Sign in",
              },
              sign_up: {
                 email_label: "Email address",
                 password_label: "Password",
                 button_label: "Sign up",
                 social_provider_text: "Sign up with {{provider}}",
                 link_text: "Don\'t have an account? Sign up",
                 // Add metadata for role on signup if needed
                 // This requires backend function `handle_new_user` to read it
                 // user_meta: { role: 'merchant_admin' } // Example - Be cautious with this
              },
              forgotten_password: {
                email_label: "Email address",
                button_label: "Send reset instructions",
                link_text: "Forgot your password?",
              },
            },
          }}
        />
      </div>
    </div>
  );
}

