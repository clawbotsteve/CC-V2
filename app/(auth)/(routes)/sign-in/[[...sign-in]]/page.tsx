"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    // Fix body overflow to ensure component is visible
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    
    // Ensure html has proper height
    document.documentElement.style.height = "100%";
    document.documentElement.style.overflow = "auto";
    
    return () => {
      // Restore original styles on unmount
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.height = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 1
    }}>
      <SignIn 
        routing="path"
        path="/sign-in"
        afterSignInUrl="/dashboard"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
