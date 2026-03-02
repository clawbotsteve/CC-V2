"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { SubscriptionTier } from "@prisma/client";

/**
 * Type describing the user's daily usage summary.
 */
type DailyUsageType = {
  date: string;
  creditUsed: number;
  imageCountLeft: number;
  maxPerDay: number | null; // null means unlimited daily quota
  imageUsed: number;
};

/**
 * Type describing the credit costs map returned from the server.
 * The key is the tool name, and the value is either:
 * - a record mapping variant string keys to their credit cost number, or
 * - an empty string key "" representing the base tool cost if no variant.
 *
 * Example:
 * {
 *   IMAGE_GENERATOR: { "": 3 },
 *   VIDEO_GENERATOR: { standard_5s: 6, standard_10s: 8 }
 * }
 */
type CreditCostsMap = Record<string, number | Record<string, number>>;

type MetaType = {
  firstVisit: boolean;
  degraded?: boolean;
};

/**
 * The shape of the User Context, providing subscription and usage data
 * about the currently logged-in user.
 */
type UserContextType = {
  userId?: string;
  planId?: string;
  customerId?: string;
  plan?: string;
  isAdmin?: boolean;
  avatarCreated?: number;
  maxAvatar?: number;
  availableCredit?: number;
  totalCredit?: number;
  dailyUsage?: DailyUsageType;
  creditCosts?: CreditCostsMap;
  plans?: Omit<SubscriptionTier, "speed" | "support" | "status" | "createdAt" | "updatedAt">[];
  isLoading: boolean;
  meta: MetaType;
  error?: string | null;
  /**
   * Refetches the user data from the server.
   */
  refetch: () => void;
};

/**
 * React Context for storing and accessing user subscription and usage data.
 */
const UserContext = createContext<UserContextType>({
  userId: undefined,
  planId: undefined,
  customerId: undefined,
  plan: undefined,
  isAdmin: false,
  avatarCreated: undefined,
  maxAvatar: undefined,
  availableCredit: undefined,
  totalCredit: undefined,
  dailyUsage: undefined,
  creditCosts: undefined,
  plans: undefined,
  isLoading: true,
  meta: {
    firstVisit: false,
  },
  error: null,
  refetch: () => { },
});

/**
 * Hook to easily consume the UserContext.
 * @returns UserContextType
 */
export const useUserContext = () => useContext(UserContext);

/**
 * UserProvider component that fetches and provides user subscription,
 * usage data, and tool credit costs to the rest of the app.
 *
 * Fetches user data when the Clerk user is loaded and available.
 * Exposes a `refetch` method to reload the data on demand.
 *
 * @param children React children components
 * @returns JSX.Element wrapping children with UserContext provider
 */
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();

  const [userData, setUserData] = useState<Omit<UserContextType, "refetch">>({
    userId: undefined,
    planId: undefined,
    customerId: undefined,
    plan: undefined,
    isAdmin: false,
    avatarCreated: undefined,
    maxAvatar: undefined,
    availableCredit: undefined,
    totalCredit: undefined,
    dailyUsage: undefined,
    creditCosts: undefined,
    plans: undefined,
    isLoading: true,
    meta: {
      firstVisit: false,
      degraded: false,
    },
    error: null,
  });

  /**
   * Fetches user subscription, usage, and credit costs info from the API.
   * Updates local state accordingly.
   */
  const fetchUserData = useCallback(async () => {
    if (!user?.id) return;

    setUserData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await axios.post<Partial<UserContextType>>("/api/user/info");
      const data = res.data;

      setUserData({
        userId: user.id,
        plan: data.plan,
        planId: data.planId,
        isAdmin: data.isAdmin,
        customerId: data.customerId,
        avatarCreated: data.avatarCreated,
        maxAvatar: data.maxAvatar,
        totalCredit: data.totalCredit,
        availableCredit: data.availableCredit,
        dailyUsage: data.dailyUsage,
        creditCosts: data.creditCosts,
        plans: data.plans,
        meta: {
          firstVisit: data.meta?.firstVisit!,
        },
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Failed to fetch user data:", error);
      setUserData((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.message ?? "Failed to load user data",
      }));
    }
  }, [user?.id]);

  /**
   * Effect that triggers data fetch once the Clerk user is loaded.
   */
  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchUserData();

      if (process.env.NODE_ENV === "development") {
        console.log('[DEBUG] User Id', user.id)
      }
    }
  }, [isLoaded, user?.id, fetchUserData]);

  // Memoize context value to avoid unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      ...userData,
      refetch: fetchUserData,
    }),
    [userData, fetchUserData]
  );

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export type { UserContextType, DailyUsageType, CreditCostsMap };
