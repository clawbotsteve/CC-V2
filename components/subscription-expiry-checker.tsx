'use client';

import { useEffect } from 'react';

export default function SubscriptionExpiryChecker() {
  useEffect(() => {
    const checkSubscriptionExpiring = async () => {
      try {
        const lastChecked = localStorage.getItem("lastSubscriptionCheck");

        // Already checked within 24 hours
        if (lastChecked && Date.now() - parseInt(lastChecked) < 24 * 60 * 60 * 1000) {
          return;
        }

        await fetch("/api/user/update-payment", { method: "POST" });
        localStorage.setItem("lastSubscriptionCheck", Date.now().toString());
      } catch (err) {
        console.error("Subscription check failed", err);
      }
    };

    checkSubscriptionExpiring();
  }, []);

  return null;
}
