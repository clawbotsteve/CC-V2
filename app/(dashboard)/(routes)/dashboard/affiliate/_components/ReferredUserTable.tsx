"use client";

import { Referral } from "../page";

interface ReferredUsersTableProps {
  referrals: Referral[];
  loading: boolean;
}

export const ReferredUsersTable = ({ referrals, loading }: ReferredUsersTableProps) => {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <div className="flex flex-col space-y-1.5 p-4 sm:p-6">
        <div className="font-semibold leading-none tracking-tight text-base sm:text-lg">
          Referred Users
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Showing first purchase amounts only
        </p>
      </div>
      <div className="p-2 sm:p-6 pt-0">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <table className="w-full">
              <thead className="sr-only sm:not-sr-only"> {/* Hide header on mobile */}
                <tr className="border-b">
                  <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">User</th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">
                    Joined
                  </th>
                  <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm">Purchases</th>
                  <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm">Commission</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-sm">
                      Loading...
                    </td>
                  </tr>
                ) : referrals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                      No referred users yet
                    </td>
                  </tr>
                ) : (
                  referrals.map((ref) => (
                    <tr key={ref.id} className="border-b text-sm">
                      <td className="py-3 px-2 sm:px-4 font-medium">
                        <div className="block sm:hidden text-xs text-muted-foreground">User</div>
                        {ref.referredUser?.name || "Unnamed"}
                      </td>
                      <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
                        {ref.referredUser
                          ? new Date(ref.referredUser.createdAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <div className="flex justify-between sm:justify-end">
                          <span className="sm:hidden text-xs text-muted-foreground">Purchases</span>
                          <span>{ref.planId ?? "-"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <div className="flex justify-between sm:justify-end">
                          <span className="sm:hidden text-xs text-muted-foreground">Commission</span>
                          <span>${ref.commission ?? '0.00'}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
