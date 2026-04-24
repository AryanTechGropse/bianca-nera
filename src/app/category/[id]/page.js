"use client";
import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  memo,
  useRef,
} from "react";
import Header from "@/header/Header";
import Footer from "@/footer/Footer";
import { useParams, useSearchParams, usePathname, useRouter } from "next/navigation";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import Products from "../../Products/Products";
import Chatbot from "../../HomeComponents/ChatBot";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import { set } from "react-hook-form";
import useHomeStore from "@/store/homeStore"; // Import the store
import useProductStore from "@/store/productStore"; // Import the store
import { create } from "zustand";
import { persist } from "zustand/middleware";
// import Head from "next/head";

// Custom hook for responsive behavior
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};

// Skeleton Components - Memoized
const FilterSkeleton = memo(() => (
  <div className="filterpart">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="filterbox mb-3">
        <div
          className="fiterboxhead skeleton-loader"
          style={{ height: "40px", marginBottom: "10px" }}
        />
        <div className="filterboxinner">
          {[1, 2, 3].map((j) => (
            <div
              key={j}
              className="skeleton-loader mb-2"
              style={{ height: "20px", width: "80%" }}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
));

const DesignerBannerSkeleton = memo(() => (
  <div className="designerbanner">
    <div className="designerimg skeleton-loader" style={{ height: "300px" }} />
    <div className="designerlogo">
      <div
        className="skeleton-loader"
        style={{ width: "120px", height: "120px", borderRadius: "50%" }}
      />
    </div>
  </div>
));

// Constants
const SORT_BY_OPTIONS = [
  { id: 1, name_en: "New Arrivals", name_ar: "الوافدون الجدد" },
  { id: 2, name_en: "Name (A-Z)", name_ar: "الاسم (أ-ي)" },
  { id: 3, name_en: "Name (Z-A)", name_ar: "الاسم (ي-أ)" },
  {
    id: 4,
    name_en: "Price: Low to High",
    name_ar: "السعر: من الأقل إلى الأعلى",
  },
  {
    id: 5,
    name_en: "Price: High to Low",
    name_ar: "السعر: من الأعلى إلى الأقل",
  },
];

// Product type mapping for /Product/All/ URLs
const PRODUCT_TYPE_MAPPING = {
  "Trending-Products": {
    type: "TRENDING",
    title_en: "Trending Products",
    title_ar: "المنتجات الرائجة",
  },
  "New-Arrival": {
    type: "NEW",
    title_en: "New Arrivals Products",
    title_ar: "منتجات جديدة",
  },
  "Recommended-Products": {
    type: "RECOMENDED",
    title_en: "Recommended Products",
    title_ar: "المنتجات الموصى بها",
  },
  "Best-Selling-Products": {
    type: "BEST_SELLING",
    title_en: "Best Selling Products",
    title_ar: "المنتجات الأكثر مبيعاً",
  },
};

// Product type mapping for /Product/All/ URLs

export default function CategoryPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { t } = useTranslation();

  // Use custom hook for responsive behavior
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Refs for cleanup
  const abortControllerRef = useRef(null);
  const urlSyncTimeoutRef = useRef(null);

  // State management
  const [selectedSort, setSelectedSort] = useState("");
  const {
    products,
    attributesData,
    attributeValues,
    designerData,
    totalPages,
    loading: storeLoading,
    error: storeError,
    fetchProducts,
    fetchAttributes,
    fetchBrandDetails,
    setProducts,
    setDesignerData,
  } = useProductStore();

  const [loading, setLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false); // Default to false if we have cache
  const [designerLoading, setDesignerLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedFilters, setExpandedFilters] = useState({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [userRemovedDesignerFilter, setUserRemovedDesignerFilter] =
    useState(false);
  const [userRemovedCategoryFilter, setUserRemovedCategoryFilter] =
    useState(false);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // You can adjust this as needed
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);

  // Support quick re-trigger when reaching bottom during an in-flight load
  const pendingScrollLoadRef = useRef(false);

  const filterRefs = useRef({});
  const modalRef = useRef(null);

  const [orderedFilters, setOrderedFilters] = useState([]);

  useEffect(() => {
    setOrderedFilters(attributesData || []);
  }, [attributesData]);

  // Memoize path analysis
  const pathInfo = useMemo(() => {
    // const pathname = location?.pathname || "";
    const isDesignerPage = pathname.startsWith("/Designer/");
    const isBrandPage = pathname.startsWith("/Brand/");
    const isCategoryPage = pathname.startsWith("/category/");
    const isProductAllPage = pathname.startsWith("/Product/All/");
    const productTypeSlug = isProductAllPage
      ? pathname.replace("/Product/All/", "")
      : null;
    const productTypeData = productTypeSlug
      ? PRODUCT_TYPE_MAPPING[productTypeSlug]
      : null;

    return {
      pathname,
      isDesignerPage,
      isBrandPage,
      isCategoryPage,
      isProductAllPage,
      productTypeSlug,
      productTypeData,
    };
  }, [pathname]);

  const {
    isDesignerPage,
    isBrandPage,
    isCategoryPage,
    isProductAllPage,
    productTypeData,
  } = pathInfo;
  const [selectedFilters, setSelectedFilters] = useState(() => {
    // Initialize filters from URL (only once)
    const params = [];
    searchParams.forEach((value, key) => {
      if (key.startsWith("filter_")) {
        const attributeId = key.replace("filter_", "");
        value.split(",").forEach((valueId) => {
          if (valueId) params.push({ attributeId, valueId });
        });
      }
    });
    return params;
  });

  // Get localized names with memoization
  const getLocalizedName = useCallback((item, fallback = "") => {
    if (!item) return fallback;
    if (i18n.language === "ar" && item.name_ar) return item.name_ar;
    console.log(item, "Items-----");
    return item.name_en || item.name || item.value || fallback;
  }, []);

  // Memoize category/designer names
  const { categoryName, designerName } = useMemo(() => {
    let catName = t("products.category");
    let desName = t("products.designer");

    if (id && attributeValues.Category && isCategoryPage) {
      const category = attributeValues.Category.find((cat) => cat._id === id);
      if (category) catName = getLocalizedName(category, catName);
    }

    if (id && attributeValues.Designer && isDesignerPage) {
      const designer = attributeValues.Designer.find((des) => des._id === id);
      if (designer) desName = getLocalizedName(designer, desName);
    }

    return { categoryName: catName, designerName: desName };
  }, [
    id,
    attributeValues.Category,
    attributeValues.Designer,
    isCategoryPage,
    isDesignerPage,
    getLocalizedName,
    t,
  ]);

  // Memoized category info
  const categoryInfo = useMemo(() => {
    if (isCategoryPage && id) {
      return {
        id: id,
        displayName: categoryName,
        isCategoryPage: true,
        isDesignerPage: false,
        isProductAllPage: false,
      };
    }

    if (isDesignerPage && id && !userRemovedDesignerFilter) {
      return {
        id: id,
        displayName: designerName || t("products.designerProducts"),
        isCategoryPage: false,
        isDesignerPage: true,
        isProductAllPage: false,
      };
    }

    if (isProductAllPage && productTypeData) {
      return {
        displayName:
          i18n.language === "ar"
            ? productTypeData.title_ar
            : productTypeData.title_en,
        type: productTypeData.type,
        isCategoryPage: false,
        isDesignerPage: false,
        isProductAllPage: true,
      };
    }

    return {
      displayName: t("products.allProducts"),
      isCategoryPage: false,
      isDesignerPage: false,
      isProductAllPage: false,
    };
  }, [
    isCategoryPage,
    isDesignerPage,
    isProductAllPage,
    id,
    categoryName,
    designerName,
    productTypeData,
    t,
    userRemovedDesignerFilter,
  ]);

  // Get current designer ID from filters or URL
  const currentDesignerId = useMemo(() => {
    // First check if there's a designer filter selected
    const designerFilter = selectedFilters.find(
      (f) => f.attributeId === "Designer",
    );
    if (designerFilter) {
      return designerFilter.valueId;
    }
    // Fall back to URL id if on designer page and user hasn't removed the filter
    return isDesignerPage && !userRemovedDesignerFilter ? id : null;
  }, [selectedFilters, isDesignerPage, id, userRemovedDesignerFilter]);

  // Fetch designer/brand details with store
  const getBrandDetails = useCallback(
    async (brandId) => {
      if (!brandId) return;
      setDesignerLoading(true);
      await fetchBrandDetails(brandId);
      setDesignerLoading(false);
    },
    [fetchBrandDetails],
  );

  // Fetch products with store
  const getSeeAllProducts = useCallback(
    async (page = 1, append = false, force = false) => {
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const data = {
          search: "",
          page: page,
          pageSize: itemsPerPage,
          productBrandId: isBrandPage ? id : "",
          append,
        };

        // Build filters array
        let effectiveFilters = [...selectedFilters];

        if (isCategoryPage && id && !userRemovedCategoryFilter) {
          const hasCategoryFilter = effectiveFilters.some(
            (f) => f.attributeId === "Category" && f.valueId === id,
          );
          if (!hasCategoryFilter) {
            effectiveFilters.push({ attributeId: "Category", valueId: id });
          }
        }

        if (isDesignerPage && id && !userRemovedDesignerFilter) {
          const hasDesignerFilter = effectiveFilters.some(
            (f) => f.attributeId === "Designer" && f.valueId === id,
          );
          if (!hasDesignerFilter) {
            effectiveFilters.push({ attributeId: "Designer", valueId: id });
          }
        }

        const transformedFilters = effectiveFilters.map((filter) => {
          if (filter.attributeId === "Price" && Array.isArray(filter.valueId)) {
            return { attributeId: filter.attributeId, valueId: filter.valueId };
          }
          return { attributeId: filter.attributeId, valueId: filter.valueId };
        });

        data["type"] = categoryInfo.type || "";
        data.filterIds =
          transformedFilters.length > 0 ? transformedFilters : undefined;
        data.sortBy = selectedSort || undefined;

        await fetchProducts(data, force);

        // Read totalPages fresh from the store (closure value is stale)
        const updatedTotalPages = useProductStore.getState().totalPages;
        setHasMorePages(page < updatedTotalPages);
      } catch (err) {
        setError(err?.message);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
        if (pendingScrollLoadRef.current) {
          pendingScrollLoadRef.current = false;
          loadNextPage();
        }
      }
    },
    [
      selectedSort,
      selectedFilters,
      categoryInfo.type,
      isProductAllPage,
      isCategoryPage,
      isDesignerPage,
      id,
      userRemovedDesignerFilter,
      userRemovedCategoryFilter,
      itemsPerPage,
      fetchProducts,
    ],
  );

  // Fetch attributes with store
  const getAttributes = useCallback(async () => {
    // If we have attributes and it's within TTL, expand filters and return
    if (attributesData.length > 0) {
      const expandedState = {};
      attributesData.forEach((attr) => {
        expandedState[attr._id] =
          attr._id === "Category" ||
          selectedFilters.some((f) => f.attributeId === attr._id);
      });
      setExpandedFilters(expandedState);
      setFiltersLoading(false);
    }

    try {
      setFiltersLoading(true);
      await fetchAttributes();

      // Initialize expanded state after fetch
      const initialExpanded = {};
      attributesData.forEach((attr) => {
        initialExpanded[attr._id] =
          attr._id === "Category" ||
          selectedFilters.some((f) => f.attributeId === attr._id);
      });
      setExpandedFilters(initialExpanded);
    } catch (err) {
      console.error("Error fetching attributes:", err?.message);
    } finally {
      setFiltersLoading(false);
    }
  }, [attributesData, selectedFilters, fetchAttributes]);

  // Initial data fetch - only once
  useEffect(() => {
    // Disable homeStore auto-fetch on this page
    useHomeStore.getState().disableAutoFetch();

    getAttributes();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (urlSyncTimeoutRef.current) {
        clearTimeout(urlSyncTimeoutRef.current);
      }
      // Re-enable homeStore auto-fetch when leaving this page
      useHomeStore.getState().enableAutoFetch();
    };
  }, []); // Empty dependency array - only run once

  // Re-fetch products when currency/country changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      if (!filtersLoading) {
        getSeeAllProducts();
      }
    };
    const handleStorageChange = (e) => {
      if (e.key === "country" && !filtersLoading) {
        getSeeAllProducts();
      }
    };

    window.addEventListener("currencyChanged", handleCurrencyChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("currencyChanged", handleCurrencyChange);
      window.removeEventListener("storage", handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersLoading, getSeeAllProducts]);

  // Fetch designer details when designer ID changes
  useEffect(() => {
    if (currentDesignerId) {
      getBrandDetails(currentDesignerId);
    } else {
      setDesignerData(null);
    }
  }, [currentDesignerId, getBrandDetails]);

  // Infinite scroll handler
  const loadNextPage = useCallback(() => {
    if (isLoadingMore || !hasMorePages || loading || filtersLoading) return;

    // Read totalPages fresh from the store
    const latestTotalPages = useProductStore.getState().totalPages;
    const nextPage = currentPage + 1;
    if (nextPage <= latestTotalPages) {
      setCurrentPage(nextPage);
      getSeeAllProducts(nextPage, true);
    }
  }, [
    currentPage,
    isLoadingMore,
    hasMorePages,
    loading,
    filtersLoading,
    getSeeAllProducts,
  ]);

  const handleScroll = useCallback(() => {
    if (!hasMorePages || loading || filtersLoading) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= documentHeight - 1000) {
      if (isLoadingMore) {
        pendingScrollLoadRef.current = true;
        return;
      }
      loadNextPage();
    }
  }, [hasMorePages, loading, filtersLoading, isLoadingMore, loadNextPage]);

  // Add scroll listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    // If category/sort/filter updates while we are already near bottom, try loading next page.
    if (
      pendingScrollLoadRef.current &&
      !isLoadingMore &&
      !loading &&
      !filtersLoading
    ) {
      pendingScrollLoadRef.current = false;
      loadNextPage();
    }
  }, [isLoadingMore, loading, filtersLoading, loadNextPage]);

  // Reset page to 1 when filters, sort, or route changes
  useEffect(() => {
    setCurrentPage(1);
    setHasMorePages(true);
    setProducts([]); // Clear products when filters change
    if (!filtersLoading) {
      getSeeAllProducts(1, false, true); // force=true to bypass stale cache
    }
  }, [
    selectedSort,
    selectedFilters,
    categoryInfo.type,
    isProductAllPage,
    isCategoryPage,
    isDesignerPage,
    id,
    userRemovedDesignerFilter,
    userRemovedCategoryFilter,
    filtersLoading,
  ]);

  // Debounced URL sync
  useEffect(() => {
    if (urlSyncTimeoutRef.current) {
      clearTimeout(urlSyncTimeoutRef.current);
    }

    urlSyncTimeoutRef.current = setTimeout(() => {
      const newParams = new URLSearchParams();
      const filtersByAttr = {};

      selectedFilters.forEach((filter) => {
        if (!filtersByAttr[filter.attributeId]) {
          filtersByAttr[filter.attributeId] = [];
        }
        filtersByAttr[filter.attributeId].push(filter.valueId);
      });

      Object.entries(filtersByAttr).forEach(([attrId, values]) => {
        newParams.set(`filter_${attrId}`, values.join(","));
      });

      const currentParamsString = searchParams.toString();
      const newParamsString = newParams.toString();

      if (currentParamsString !== newParamsString) {
        router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
      }
    }, 300); // 300ms debounce
  }, [selectedFilters]);

  // Auto-select category/designer filters - combined effect
  useEffect(() => {
    const updates = [];

    // Category filter
    if (id && attributeValues.Category && isCategoryPage) {
      const categoryExists = attributeValues.Category.some(
        (cat) => cat._id === id,
      );
      if (categoryExists) {
        const isCategorySelected = selectedFilters.some(
          (filter) =>
            filter.attributeId === "Category" && filter.valueId === id,
        );
        if (!isCategorySelected) {
          updates.push({ type: "category", id });
        }
      }
    }

    // Designer filter
    if (
      id &&
      attributeValues.Designer &&
      isDesignerPage &&
      !userRemovedDesignerFilter
    ) {
      const designerExists = attributeValues.Designer.some(
        (des) => des._id === id,
      );
      if (designerExists) {
        const isDesignerSelected = selectedFilters.some(
          (filter) =>
            filter.attributeId === "Designer" && filter.valueId === id,
        );
        if (!isDesignerSelected) {
          updates.push({ type: "designer", id });
        }
      }
    }

    // Apply updates if any
    if (updates.length > 0) {
      setSelectedFilters((prev) => {
        let newFilters = [...prev];
        updates.forEach((update) => {
          if (update.type === "category") {
            newFilters = newFilters.filter((f) => f.attributeId !== "Category");
            newFilters.push({ attributeId: "Category", valueId: update.id });
          } else if (update.type === "designer") {
            newFilters = newFilters.filter((f) => f.attributeId !== "Designer");
            newFilters.push({ attributeId: "Designer", valueId: update.id });
          }
        });
        return newFilters;
      });
    }
  }, [
    id,
    attributeValues.Category,
    attributeValues.Designer,
    isCategoryPage,
    isDesignerPage,
    userRemovedDesignerFilter,
  ]);

  // Filter handlers - all properly memoized
  const toggleFilter = useCallback((attributeId) => {
    setExpandedFilters((prev) => {
      const isCurrentlyOpen = !!prev[attributeId];
      // if we're opening this filter, close all others first
      if (!isCurrentlyOpen) {
        const newState = {};
        Object.keys(prev).forEach((key) => {
          newState[key] = false;
        });
        newState[attributeId] = true;
        return newState;
      }
      // otherwise we're closing it, simply set it false
      return { ...prev, [attributeId]: false };
    });
  }, []);

  const handleFilterChange = useCallback(
    (attributeId, valueId, isChecked) => {
      setSelectedFilters((prev) =>
        isChecked
          ? [...prev, { attributeId, valueId }]
          : prev.filter(
              (f) => !(f.attributeId === attributeId && f.valueId === valueId),
            ),
      );

      // Track when user manually removes category filter
      if (
        attributeId === "Category" &&
        !isChecked &&
        isCategoryPage &&
        valueId === id
      ) {
        setUserRemovedCategoryFilter(true);
      }

      // Track when user manually removes designer filter
      if (
        attributeId === "Designer" &&
        !isChecked &&
        isDesignerPage &&
        valueId === id
      ) {
        setUserRemovedDesignerFilter(true);
      }
    },
    [isDesignerPage, isCategoryPage, id],
  );

  const isFilterSelected = useCallback(
    (attributeId, valueId) =>
      selectedFilters.some(
        (f) => f.attributeId === attributeId && f.valueId === valueId,
      ),
    [selectedFilters],
  );

  // Clear all filters handler
  const clearAllFilters = useCallback(() => {
    setSelectedFilters([]);
    // Set to true so route-based filters don't get auto-added back
    if (isDesignerPage && id) {
      setUserRemovedDesignerFilter(true);
    }
    if (isCategoryPage && id) {
      setUserRemovedCategoryFilter(true);
    }
  }, [isDesignerPage, isCategoryPage, id]);

  const handleFilterClick = (attrId) => {
    toggleFilter(attrId);
  };

  // Memoized FilterSection component
  const FilterSection = useMemo(() => {
    const Component = ({ isMobile = false }) => (
      <div className={isMobile ? "mobile-filter-body" : "filterpart"}>
        {filtersLoading ? (
          <FilterSkeleton />
        ) : (
          attributesData?.map((attr) => (
            <div
              className={
                isMobile
                  ? `filterbox ${expandedFilters[attr._id] ? "active" : ""}`
                  : `filterbox ${expandedFilters[attr._id] ? "active" : ""}`
              }
              key={attr._id}
              ref={(el) => (filterRefs.current[attr._id] = el)}
            >
              {isMobile ? (
                <div
                  className="fiterboxhead"
                  // onClick={() => {
                  //   toggleFilter(attr._id);
                  // }}
                  onClick={() => {
                    // toggleFilter(attr._id);

                    handleFilterClick(attr._id);

                    // setTimeout(() => {
                    //   const element = filterRefs.current[attr._id];
                    //   const container = modalRef.current;

                    //   if (element && container) {
                    //     const elementTop = element.offsetTop;

                    //     container.scrollTo({
                    //       top: elementTop, // small spacing
                    //       behavior: "smooth",
                    //     });
                    //   }
                    // }, 100);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {getLocalizedName(attr)}
                  <span className="filter-toggle-icon">
                    {expandedFilters[attr._id] ? "−" : "+"}
                  </span>
                </div>
              ) : (
                <div
                  className="fiterboxhead"
                  // onClick={() => toggleFilter(attr._id)}
                  onClick={() => handleFilterClick(attr._id)}
                  style={{ cursor: "pointer" }}
                >
                  {getLocalizedName(attr)}
                  <span className="filter-toggle-icon">
                    {expandedFilters[attr._id] ? "−" : "+"}
                  </span>
                </div>
              )}
              <div
                className={`${isMobile ? "filterboxinner mobilefilterboxinner" : "filterboxinner"}`}
              >
                <div className="row">
                  {attributeValues[attr._id]?.map((val) => (
                    <div
                      className={
                        isMobile
                          ? "col-md-12 d-flex justify-content-between mb-3"
                          : "col-md-12 d-flex justify-content-between mb-3"
                      }
                      key={val._id}
                    >
                      <label
                        className={isMobile ? "d-block" : "custom-checkbox"}
                      >
                        <input
                          type="checkbox"
                          checked={isFilterSelected(attr._id, val._id)}
                          onChange={(e) =>
                            handleFilterChange(
                              attr._id,
                              val._id,
                              e.target.checked,
                            )
                          }
                        />
                        {!isMobile && <span className="checkmark mx-2" />}{" "}
                        {getLocalizedName(val)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );

    return memo(Component);
  }, [
    filtersLoading,
    attributesData,
    expandedFilters,
    attributeValues,
    getLocalizedName,
    toggleFilter,
    isFilterSelected,
    handleFilterChange,
  ]);

  const SkeletonCard = () => (
    <div className="productcomman">
      <div
        className="productcommanimg mb-2 position-relative skeleton-height"
        style={{ backgroundColor: "#f0f0f0", overflow: "hidden" }}
      >
        <div
          className="skeleton-shimmer"
          style={{
            position: "absolute",
            top: 0,
            left: "-100%",
            height: "100%",
            width: "100%",
            background:
              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)",
            animation: "shimmer 1.5s infinite",
          }}
        />
      </div>
      <div className="productcommandetails">
        <div className="colorboxes d-flex align-items-center mb-2">
          <div
            className="cb_cmn"
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: "#e0e0e0",
              borderRadius: "50%",
              marginRight: "5px",
            }}
          />
          <div
            className="cb_cmn"
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: "#e0e0e0",
              borderRadius: "50%",
              marginRight: "5px",
            }}
          />
          <div
            className="cb_cmn"
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: "#e0e0e0",
              borderRadius: "50%",
            }}
          />
        </div>
        <div
          style={{
            height: "16px",
            backgroundColor: "#e0e0e0",
            borderRadius: "4px",
            marginBottom: "8px",
            width: "70%",
          }}
        />
        <div
          style={{
            height: "20px",
            backgroundColor: "#e0e0e0",
            borderRadius: "4px",
            marginBottom: "10px",
            width: "50%",
          }}
        />
        <div
          style={{
            height: "36px",
            backgroundColor: "#e0e0e0",
            borderRadius: "4px",
            width: "100%",
          }}
        />
      </div>
    </div>
  );

  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const lang = localStorage.getItem("i18nextLng") || "en";
    setLanguage(lang);
  }, []);

  const title =
    language === "ar"
      ? "بيانكا نيرا | فساتين مصممين فاخرة وفساتين سهرة وكاجوال للنساء أونلاين"
      : "Bianca Nera | Luxury Designer Dresses, Evening & Casual Dresses Online";

  const description =
    language === "ar"
      ? "تقدم بيانكا نيرا فساتين سهرة فاخرة وفساتين كاجوال وملابس جاهزة من مصممين عالميين مع شحن عالمي."
      : "Bianca Nera offers luxury designer evening dresses, casual dresses and ready-to-wear fashion with worldwide delivery.";

  return (
    <>
      <style>
        {styles}
        {i18n.language === "ar" ? getRTLStyles() : ""}
      </style>
      <Header />

      {currentDesignerId &&
        (designerLoading ? (
          <DesignerBannerSkeleton />
        ) : (
          designerData && (
            <div className="designerbanner">
              <div className="designerimg">
                <img
                  src={designerData?.cover_image}
                  alt={t("products.designerCover")}
                  onError={(e) => {
                    e.target.src = "/images/default-cover.jpg";
                  }}
                />
              </div>
              <div className="designerlogo">
                <img
                  src={designerData?.logo}
                  alt={t("products.designerLogo")}
                  style={{
                    borderRadius: "50%",
                    width: "140px",
                    height: "140px",
                  }}
                  onError={(e) => {
                    e.target.src = "/images/default-logo.png";
                  }}
                />
              </div>
            </div>
          )
        ))}

      <div className="productpage padding pt-md-4 pt-0">
        <div className="container">
          <div className="row">
            <div className="col-md-12 mb-4">
              <div className="row align-items-center productpagetop">
                <div className="col-md-12 mb-4">
                  <div className="productpagehead d-flex align-items-center justify-content-between">
                    {categoryInfo.displayName && (
                      <div>
                        <h2 className="commanhead">{categoryInfo.displayName}</h2>
                        {/* {console.log(categoryInfo, "----categoryInfo----")} */}
                        {/* <h2>{categoryInfo.displayName.replace(/\bProducts\b/g, "").trim()}</h2> */}
                        <span>
                          {products?.length || 0} {t("products.items")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {!isMobile && (
                  <div className="col-md-6 col-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="filtermainhead">
                        {t("products.filter")}
                      </div>
                    </div>
                  </div>
                )}

                <div className="col-6 d-md-none">
                  <button
                    className="btn btn-outline-dark w-100"
                    onClick={() => {
                      const root = document.getElementById("root");
                      root.style.overflow = "hidden";
                      root.style.height = "100vh";
                      setShowFilterModal(true);
                    }}
                  >
                    {t("products.Filters")}
                  </button>
                </div>

                <div className="col-md-6 col-6 text-end">
                  <div className="sortby">
                    <span>{t("products.sortBy")}:</span>
                    <select
                      id="sort"
                      className="sort-select form-select"
                      value={selectedSort}
                      onChange={(e) => setSelectedSort(e.target.value)}
                    >
                      <option value="">{t("products.recommended")}</option>
                      {SORT_BY_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {i18n.language === "ar"
                            ? option.name_ar
                            : option.name_en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-12 px-md-0">
              <div className="row">
                <div className="col-md-3 d-none d-md-block filtercol">
                  {selectedFilters.length > 0 && (
                    <button
                      className="border-0 bg-transparent mb-1 text-decoration-underline text-sm-end"
                      onClick={clearAllFilters}
                      style={{
                        fontSize: "12px",
                        padding: "4px 12px",
                        textAlign: "right",
                        width: "100%",
                      }}
                    >
                      {t("Clear All")}
                    </button>
                  )}
                  <FilterSection />
                </div>

                <div className="col-md-9 productcol">
                  <div className="row">
                    <div className="col-12 two-card-wrapper">
                      <Products
                        products={products}
                        loading={loading || filtersLoading}
                        classType={"col-small"}
                      />
                      {isLoadingMore
                        ? Array.from({ length: 8 }).map((_, i) => (
                            <div
                              className={`col-6 px-2 col-sm-4 col-md-3 col-lg-3 py-3`}
                              key={i}
                            >
                              <SkeletonCard />
                            </div>
                          ))
                        : null}
                    </div>
                    {!hasMorePages && products.length > 0 && (
                      <div className="col-12 mt-4">
                        <div className="text-center py-4">
                          <p className="text-muted">
                            You've reached the end of the products.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFilterModal && (
        <div className="mobile-filter-overlay">
          <div className="mobile-filter-content" ref={modalRef}>
            <div className="mobile-filter-header mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">{t("products.filters")}</h5>
                <button
                  className="btn-close position-relative"
                  style={{ top: "0px" }}
                  onClick={() => {
                    const root = document.getElementById("root");
                    root.style.overflow = "auto";
                    root.style.height = "100%";
                    setShowFilterModal(false);
                  }}
                  aria-label={t("common.close")}
                />
              </div>
              {selectedFilters.length > 0 && (
                <div className="d-flex justify-content-end">
                  <button
                    className="w-auto bg-transparent border-0 text-decoration-underline"
                    onClick={clearAllFilters}
                  >
                    {t("Clear All")}
                  </button>
                </div>
              )}
            </div>

            <FilterSection isMobile={true} />

            <div className="text-center mt-3">
              <button
                className="btn btn-dark w-100 rounded-pill"
                onClick={() => setShowFilterModal(false)}
              >
                {t("products.applyFilters")}
              </button>
            </div>
          </div>
        </div>
      )}
      <Chatbot />
      <Footer />
    </>
  );
}

// Extract styles to avoid recreation on every render
const styles = `
  /* Skeleton loader */
  .skeleton-loader {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Mobile filter overlay */
  .mobile-filter-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: flex-end;
  }
  
  .mobile-filter-content {
    background: #fff;
    width: 100%;
    max-height: 85%;
    overflow-y: auto;
    border-radius: 20px 20px 0 0;
    padding: 20px;
    animation: slideUp 0.3s ease-out;
  }
  
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
`;

// RTL styles added dynamically if needed
const getRTLStyles = () => `
  .text-end {
    text-align: left !important;
  }
  
  .sortby {
    direction: ltr;
  }
  
  .filter-toggle-icon {
    margin-left: 0;
    margin-right: auto;
  }
  
  .custom-checkbox input {
    margin-right: 0;
    margin-left: 8px;
  }
`;
