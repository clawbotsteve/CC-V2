"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageContainer from "@/components/page-container";
import { useUserContext } from "@/components/layout/user-context";

interface Transaction {
  id: string;
  amount_total: number;
  currency: string;
  status: string;
  mode: string;
  created: number;
  metadata: Record<string, string>;
}

export default function PaymentHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useUserContext();


  const fetchTransactions = async (cursorParam: string | null = null) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        userId: userId as string,
        limit: "20",
      });
      if (cursorParam) {
        params.append("cursor", cursorParam);
      }

      const res = await fetch(`/api/billing/pz/transactions?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Error fetching transactions: ${res.statusText}`);
      }

      const json = await res.json();

      setTransactions((prev) =>
        cursorParam ? [...prev, ...json.data] : json.data
      );
      setHasMore(json.has_more);
      setCursor(json.next_cursor);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatAmount = (amount: number, currency: string) =>
    `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;

  return (
    <PageContainer scrollable>
      <div className="w-full px-4 sm:px-6">
        {/* Header - Improved mobile spacing */}
        <div className="flex items-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
          <div className="p-2 sm:p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/20">
            <History className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payment History</h1>
        </div>

        {/* Payment History Table - Mobile optimized */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-2 sm:px-6">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader className="hidden sm:table-header-group">
                  <TableRow>
                    <TableHead className="py-3 sm:py-5">Date</TableHead>
                    <TableHead className="py-3 sm:py-5">Plan Type</TableHead>
                    <TableHead className="text-right py-3 sm:py-5">Amount</TableHead>
                    <TableHead className="py-3 sm:py-5 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((payment) => (
                      <TableRow key={payment.id} className="block sm:table-row border-b">
                        {/* Mobile stacked layout */}
                        <div className="sm:hidden p-3 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Date:</span>
                            <span>{formatDate(payment.created)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Plan:</span>
                            <span>
                              {payment.metadata.planId ||
                                payment.metadata.packId ||
                                payment.mode}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Amount:</span>
                            <span>
                              {formatAmount(payment.amount_total, payment.currency)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <span>{payment.status}</span>
                          </div>
                        </div>

                        {/* Desktop table layout */}
                        <TableCell className="hidden sm:table-cell font-medium">
                          {formatDate(payment.created)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {payment.metadata.planId ||
                            payment.metadata.packId ||
                            payment.mode}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right">
                          {formatAmount(payment.amount_total, payment.currency)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-center">
                          {payment.status}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-8 sm:py-12"
                      >
                        {loading ? "Loading..." : "No payment history found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-4 sm:mt-6">
            <button
              onClick={() => fetchTransactions(cursor)}
              className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition text-sm sm:text-base"
            >
              Load More
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <p className="text-center text-muted-foreground mt-4 text-sm sm:text-base">
            Loading...
          </p>
        )}

        {/* Error display */}
        {error && (
          <p className="text-center text-red-600 mt-4 text-sm sm:text-base">
            Error loading transactions: {error}
          </p>
        )}
      </div>
    </PageContainer>
  );
}
