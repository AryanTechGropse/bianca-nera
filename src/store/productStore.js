import { create } from "zustand";
import { persist } from "zustand/middleware";
import { callMiddleWare } from "../httpServices/webHttpServices";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const useProductStore = create(
  persist(
    (set, get) => ({
      products: [],
      attributesData: [],
      attributeValues: {},
      designerData: null,
      totalPages: 1,
      currentPage: 1,
      lastParams: null, // To check if filters changed
      lastFetchTimestamp: null,
      loading: false,
      error: null,

      // Helper to check if cache is valid for given params
      isCacheValid: (params) => {
        const { lastParams, lastFetchTimestamp, products } = get();
        if (!products || products.length === 0) {
          console.log("❌ Cache invalid: No products");
          return false;
        }
        if (
          !lastFetchTimestamp ||
          Date.now() - lastFetchTimestamp > CACHE_TTL
        ) {
          console.log("❌ Cache invalid: Expired or no timestamp");
          return false;
        }

        // Better comparison: ignore 'append' and other transient flags if they don't affect data
        const cleanParams = { ...params };
        delete cleanParams.append;

        const cleanLastParams = { ...(lastParams || {}) };
        delete cleanLastParams.append;

        const isValid =
          JSON.stringify(cleanParams) === JSON.stringify(cleanLastParams);

        if (!isValid) {
          console.log("❌ Cache invalid: Params mismatch", {
            cleanParams,
            cleanLastParams,
          });
        } else {
          console.log("✅ Cache valid");
        }

        return isValid;
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setProducts: (products) => set({ products }),
      setDesignerData: (designerData) => set({ designerData }),

      fetchProducts: async (params, force = false) => {
        const { isCacheValid } = get();

        if (!force && isCacheValid(params)) {
          console.log("🚀 Using cached product data");
          return;
        }

        set({ loading: true, error: null });

        try {
          let response;
          if (params.type === "BEST_SELLING") {
            response = await callMiddleWare({
              method: "PATCH",
              endpoint: "products/getbestSellingProducts",
              data: {
                page: params.page,
                pageSize: params.pageSize,
                filterIds: params.filterIds,
                sortBy: params.sortBy,
              },
            });
          } else {
            response = await callMiddleWare({
              method: "PATCH",
              endpoint: "products/getProducts",
              data: params,
            });
          }

          const newProducts = response?.results?.products || [];
          const totalPages = response?.results?.totalPages || 1;

          set((state) => ({
            products: params.append
              ? [...state.products, ...newProducts]
              : newProducts,
            totalPages,
            lastParams: params,
            lastFetchTimestamp: Date.now(),
            loading: false,
          }));
        } catch (err) {
          console.error("Error fetching products:", err);
          set({ error: err.message, loading: false });
        }
      },

      fetchAttributes: async (force = false) => {
        const { attributesData, lastFetchTimestamp } = get();

        if (
          !force &&
          attributesData.length > 0 &&
          lastFetchTimestamp &&
          Date.now() - lastFetchTimestamp < CACHE_TTL
        ) {
          console.log("🚀 Using cached attributes data");
          return;
        }

        set({ loading: true });

        try {
          const response = await callMiddleWare({
            method: "PATCH",
            endpoint: "products/getAttributes",
          });
          const attrs = response?.results?.attributes || [];

          // Fetch values for all attributes in parallel
          const valuesPromises = attrs.map((attr) =>
            callMiddleWare({
              method: "PATCH",
              endpoint: "products/getValues",
              data: {
                attributeIds: [attr._id],
                type: attr._id,
                pageSize: 1000,
              },
            }).then((res) => ({
              id: attr._id,
              values: res?.results?.values || [],
            })),
          );

          const valuesResults = await Promise.all(valuesPromises);
          const valuesMap = {};
          valuesResults.forEach(({ id, values }) => {
            valuesMap[id] = values;
          });

          set({
            attributesData: attrs,
            attributeValues: valuesMap,
            lastFetchTimestamp: Date.now(),
            loading: false,
          });
        } catch (err) {
          console.error("Error fetching attributes:", err);
          set({ loading: false });
        }
      },

      fetchBrandDetails: async (brandId, force = false) => {
        const { designerData } = get();
        if (!force && designerData && designerData._id === brandId) return;

        try {
          const response = await callMiddleWare({
            method: "GET",
            endpoint: "products/getBrandDetails",
            id: brandId,
          });
          set({ designerData: response?.results?.Brand });
        } catch (error) {
          console.error("Error fetching brand details:", error);
        }
      },

      clearCache: () => {
        set({
          products: [],
          attributesData: [],
          attributeValues: {},
          designerData: null,
          lastParams: null,
          lastFetchTimestamp: null,
        });
      },
    }),
    {
      name: "product-listing-storage",
      partialize: (state) => ({
        products: state.products,
        attributesData: state.attributesData,
        attributeValues: state.attributeValues,
        designerData: state.designerData,
        totalPages: state.totalPages,
        lastParams: state.lastParams,
        lastFetchTimestamp: state.lastFetchTimestamp,
      }),
    },
  ),
);

export default useProductStore;
