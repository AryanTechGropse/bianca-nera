import { create } from "zustand";
import { callMiddleWare } from "../httpServices/webHttpServices";
import { persist } from "zustand/middleware";

const CACHE_KEY = "home-cache";

const setCache = (data) => {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      data,
      timestamp: Date.now(),
    }),
  );
};

const getCache = () => {
  const cache = localStorage.getItem(CACHE_KEY);
  if (!cache) return null;

  const parsed = JSON.parse(cache);

  const FIVE_MIN = 1 * 1000;

  if (Date.now() - parsed.timestamp < FIVE_MIN) {
    return parsed.data;
  }

  return null;
};

// Cache for deduplication
const pendingRequests = new Map();

const deduplicateRequest = async (key, requestFn) => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = requestFn();
  pendingRequests.set(key, promise);

  // Clean up after request completes (success or error)
  promise
    .then(() => pendingRequests.delete(key))
    .catch(() => pendingRequests.delete(key));

  return promise;
};

const useHomeStore = create(
  persist(
    (set, get) => ({
      category: [],
      products: [],
      recommendedData: [],
      bestSellingData: [],
      fashionData: [],
      brandData: [],
      bannerData: [],
      trendingProduct: [],
      loading: false,
      error: null,

      criticalDataLoaded: false,
      secondaryDataLoaded: false,
      remainingDataLoaded: false,
      isFetching: false,
      lastFetchTimestamp: null,
      fetchTimeoutId: null,
      shouldFetchOnMount: true,

      // Clear any pending timeouts
      clearTimeouts: () => {
        const { fetchTimeoutId } = get();
        if (fetchTimeoutId) {
          clearTimeout(fetchTimeoutId);
          set({ fetchTimeoutId: null });
        }
      },

      // Reset store (optional, for manual refresh)
      resetStore: () => {
        get().clearTimeouts();
        set({
          category: [],
          products: [],
          recommendedData: [],
          bestSellingData: [],
          fashionData: [],
          bannerData: [],
          trendingProduct: [],
          loading: false,
          error: null,
          criticalDataLoaded: false,
          secondaryDataLoaded: false,
          remainingDataLoaded: false,
          isFetching: false,
          lastFetchTimestamp: null,
          fetchTimeoutId: null,
        });
      },

      // Disable auto-fetch on mount (for SeeAllProduct page)
      disableAutoFetch: () => {
        set({ shouldFetchOnMount: false });
      },

      // Re-enable auto-fetch
      enableAutoFetch: () => {
        set({ shouldFetchOnMount: true });
      },

      fetchHomeData: async (forceRefresh = false) => {
        const state = get();

        // ✅ 1. CHECK CACHE FIRST
        if (!forceRefresh) {
          const cachedData = getCache();

          if (cachedData) {
            console.log("🚀 Using cached homepage data");

            set({
              ...cachedData,
              criticalDataLoaded: true,
              secondaryDataLoaded: true,
              remainingDataLoaded: true,
              loading: false,
              isFetching: true,
            });

            return;
          }
        }

        set({ isFetching: true, loading: true });

        try {
          await get().fetchCriticalData();

          // ✅ 2. SAVE CACHE AFTER FETCH
          const newState = get();

          setCache({
            category: newState.category,
            bannerData: newState.bannerData,
            products: newState.products,
            bestSellingData: newState.bestSellingData,
            trendingProduct: newState.trendingProduct,
            recommendedData: newState.recommendedData,
            fashionData: newState.fashionData,
            brandData: newState.brandData,
          });
        } catch (err) {
          console.error("Error:", err);
        }
      },

      // Fetch critical homepage data first
      fetchCriticalData: async () => {
        const state = get();

        // Don't fetch if auto-fetch is disabled
        if (!state.shouldFetchOnMount) {
          console.log("Critical data fetch disabled");
          return;
        }

        try {
          // Get screenWidth from localStorage and determine platform
          let platform = "Web";
          const screenWidth = parseInt(localStorage.getItem("screenWidth"), 10);
          // You can adjust the threshold as needed for app vs web
          if (screenWidth && screenWidth <= 900) {
            platform = "App";
          }

          const [categoryRes, bannerRes] = await Promise.all([
            callMiddleWare({
              method: "PATCH",
              endpoint: "products/getCategoryList",
              data: { search: "", page: 1, pageSize: 50 },
            }),
            callMiddleWare({
              method: "PATCH",
              endpoint: "analytics/getBanners",
              data: {
                search: "",
                type: "Product",
                bannerType: "",
                categoryId: "",
                page: 1,
                pageSize: 6,
                platform: platform,
              },
            }),
          ]);

          set({
            category: categoryRes?.results?.categories || [],
            bannerData: bannerRes?.results?.banners || [],
            criticalDataLoaded: true,
            loading: false,
            isFetching: false,
          });

          console.log("--bannerRes--", bannerRes);

          // Immediately fetch secondary data (no delay)
          await get().fetchSecondaryData();
        } catch (err) {
          console.error("Critical data fetch error:", err);
          throw err; // Re-throw for deduplication cleanup
        }
      },

      // Fetch secondary data
      fetchSecondaryData: async () => {
        const state = get();

        // Don't fetch if auto-fetch is disabled
        if (!state.shouldFetchOnMount) {
          console.log("Secondary data fetch disabled");
          return;
        }

        if (state.secondaryDataLoaded) {
          return;
        }

        try {
          const [newRes, bestSellingRes, trendingRes] = await Promise.all([
            deduplicateRequest("new-products", () =>
              callMiddleWare({
                method: "PATCH",
                endpoint: "products/getNewProducts",
                data: { page: 1, pageSize: 6 },
              }),
            ),
            deduplicateRequest("best-selling", () =>
              callMiddleWare({
                method: "PATCH",
                endpoint: "products/getBestSellingProducts",
                data: { page: 1, pageSize: 6 },
              }),
            ),
            deduplicateRequest("trending", () =>
              callMiddleWare({
                method: "PATCH",
                endpoint: "products/getTrendingProducts",
                data: { page: 1, pageSize: 6 },
              }),
            ),
          ]);

          set({
            products: newRes?.results?.products || [],
            bestSellingData: bestSellingRes?.results?.products || [],
            trendingProduct: trendingRes?.results?.products || [],
            secondaryDataLoaded: true,
          });

          // Fetch remaining data
          await get().fetchRemainingData();
        } catch (err) {
          console.error("Secondary data fetch error:", err);
        }
      },

      // Fetch remaining data
      fetchRemainingData: async () => {
        const state = get();

        // Don't fetch if auto-fetch is disabled
        if (!state.shouldFetchOnMount) {
          console.log("Remaining data fetch disabled");
          return;
        }

        if (state.remainingDataLoaded) {
          return;
        }

        try {
          const [recommendedRes, brandRes, brandsIDRes] = await Promise.all([
            deduplicateRequest("recommended", () =>
              callMiddleWare({
                method: "PATCH",
                endpoint: "products/getRecomendedProducts",
                data: { page: 1, pageSize: 5 },
              }),
            ),
            deduplicateRequest("brands", () =>
              callMiddleWare({
                method: "PATCH",
                endpoint: "products/getBrandList",
                data: { search: "", page: 1, pageSize: 10 },
              }),
            ),
            deduplicateRequest("brandsID", () =>
              callMiddleWare({
                method: "PATCH",
                endpoint: "products/getProductBrandList",
                data: { search: "", page: 1, pageSize: 10 },
              }),
            ),
          ]);

          set({
            recommendedData: recommendedRes?.results?.products || [],
            fashionData: brandRes?.results?.brands || [],
            brandData: brandsIDRes?.results?.Designers || [],
            remainingDataLoaded: true,
          });
        } catch (err) {
          console.error("Remaining data fetch error:", err);
        }
      },

      // Fetch only banners (called when screen size changes)
      fetchBanners: async () => {
        try {
          // Get screenWidth from localStorage and determine platform
          let platform = "web";
          const screenWidth = parseInt(localStorage.getItem("screenWidth"), 10);
          if (screenWidth && screenWidth <= 900) {
            platform = "app";
          }

          const bannerRes = await callMiddleWare({
            method: "PATCH",
            endpoint: "analytics/getBanners",
            data: {
              search: "",
              type: "Product",
              bannerType: "Hero",
              categoryId: "",
              page: 1,
              pageSize: 6,
              platform: platform,
            },
          });

          set({
            bannerData: bannerRes?.results?.banners || [],
          });
          console.log("__bannerRes__", bannerRes);
        } catch (err) {
          console.error("Banners fetch error:", err);
        }
      },

      // Manually refresh data
      refreshHomeData: async () => {
        get().clearTimeouts();
        set({
          criticalDataLoaded: false,
          secondaryDataLoaded: false,
          remainingDataLoaded: false,
        });
        await get().fetchHomeData(true);
      },
    }),
    {
      name: "home-storage", // localStorage key

      // 🔥 Only store important data
      partialize: (state) => ({
        category: state.category,
        bannerData: state.bannerData,
        products: state.products,
        bestSellingData: state.bestSellingData,
        trendingProduct: state.trendingProduct,
        recommendedData: state.recommendedData,
        fashionData: state.fashionData,
        brandData: state.brandData,

        // optional flags
        lastFetchTimestamp: state.lastFetchTimestamp,
      }),
    },
  ),
);

export default useHomeStore;
