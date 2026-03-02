'use client';

import React, { useState } from 'react';

export default function ExtendSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/user/subscription/notify', { method: 'POST' });
      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setResult(
        `Processed: ${data.totalProcessed}, Success: ${data.totalSuccess}, Failures: ${data.totalFailed}`
      );
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Extend Subscriptions & Notify'}
      </button>

      {result && <p className="mt-2 text-green-600">{result}</p>}
      {error && <p className="mt-2 text-red-600">Error: {error}</p>}
    </div>
  );
}
