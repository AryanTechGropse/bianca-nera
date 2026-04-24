"use client";
import React, { useEffect, useRef, useState } from "react";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import i18next, { t } from "i18next";

const Search = ({ setShowMenu, setShowProfile }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [openFilters, setOpenFilters] = useState({});
  const [loadingPopular, setLoadingPopular] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [popularProducts, setPopularProducts] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  const router = useRouter();

  const searchRef = useRef(null);

  // Helper function to get localized name
  const getLocalizedName = (item) => {
    if (!item) return "";
    return i18next.language === "en"
      ? item.name_en || item.name || item.text || item.title || ""
      : item.name_ar || item.name || item.text || item.title || "";
  };

  // Helper function to get localized name for suggestion
  const getLocalizedSuggestionName = (suggestion) => {
    if (typeof suggestion === "string") return suggestion;
    return i18next.language === "en"
      ? suggestion.name_en ||
          suggestion.text ||
          suggestion.title ||
          suggestion.name ||
          ""
      : suggestion.name_ar ||
          suggestion.text ||
          suggestion.title ||
          suggestion.name ||
          "";
  };

  const toggleSearch = () => {
    setShowSearch(true);
    setShowMenu(false);
    setShowProfile(false);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const toggleFilter = (id) => {
    setOpenFilters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim() !== "") {
        if (searchQuery.length >= 1) {
          // getSearchSuggestions(searchQuery);
        }
        if (searchQuery.length >= 3) {
          searchProduct(searchQuery);
        }
      } else {
        setSearchResults([]);
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const searchProduct = async (query) => {
    try {
      setLoading(true);
      const payload = { search: query, page: 1, pageSize: 20 };
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "products/getProducts",
        data: payload,
      });

      if (response?.results?.products) {
        setSearchResults(response.results.products);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      toast.error("Failed to search products");
    } finally {
      setLoading(false);
    }
  };

  const getSearchSuggestions = async (query) => {
    try {
      setLoadingSuggestions(true);
      const payload = { search: query };
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "products/getSearchSuggestions",
        data: payload,
      });

      if (response?.results?.suggestions || response?.results?.products) {
        const suggestions =
          response.results.suggestions || response.results.products || [];
        setSearchSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Search suggestions error:", error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getPopularProducts = async () => {
    try {
      setLoadingPopular(true);
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "products/getbestSellingProducts",
        data: { page: 1, pageSize: 8 },
      });

      setPopularProducts(response?.results?.products || []);
    } catch (error) {
      console.error("Error fetching popular products:", error);
      setPopularProducts([]);
      toast.error("Failed to load popular products");
    } finally {
      setLoadingPopular(false);
    }
  };

  const getRecentSearchHistory = async () => {
    try {
      const response = await callMiddleWare({
        method: "GET",
        endpoint: "products/getSearchHistory",
      });

      setSearchHistory(response?.results?.history || []);
    } catch (error) {
      console.error("Error fetching search history:", error);
      setSearchHistory([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    // Check if suggestion is a category
    if (suggestion.type === "Category") {
      // Navigate to category page with _id
      const categoryId = suggestion._id;
      const categoryName = getLocalizedName(suggestion);
      navigateToCategory(categoryId, categoryName);
      return;
    }

    const suggestionText = getLocalizedSuggestionName(suggestion);
    setSearchQuery(suggestionText);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    searchProduct(suggestionText);
  };

  const navigateToCategory = (categoryId, categoryName) => {
    // Close search modal
    closeSearch();
    console.log("Category ID:", categoryId, "Category Name:", categoryName);

    // Navigate to category page with _id
    router.push(`/category/${categoryId}`);
  };

  const handleProductClick = (item) => {
    // Check if item is a category
    if (item.type === "Category") {
      const categoryId = item._id;
      const categoryName = getLocalizedName(item);
      console.log("Category clicked - ID:", categoryId, "Name:", categoryName);
      navigateToCategory(categoryId, categoryName);
    } else {
      // Regular product navigation
      setShowSuggestions(false);
      closeSearch();
      // The Link component will handle navigation for products
    }
  };

  const handleInputKeyDown = (e) => {
    if (!showSuggestions || searchSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveSuggestionIndex((prev) =>
          prev < searchSuggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : searchSuggestions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          handleSuggestionClick(searchSuggestions[activeSuggestionIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  };

  const clearSearchHistory = async () => {
    try {
      await callMiddleWare({
        method: "GET",
        endpoint: "products/clearSearchHistory",
      });
      setSearchHistory([]);
      toast.success("Search history cleared");
    } catch (error) {
      console.error("Error clearing search history:", error);
      toast.error("Failed to clear search history");
    }
  };

  useEffect(() => {
    getPopularProducts();
    getRecentSearchHistory();
  }, []);

  // Enhanced suggestion item to show type and include _id
  const renderSuggestionItem = (suggestion, index) => {
    const isCategory = suggestion.type === "Category";
    const suggestionText = getLocalizedSuggestionName(suggestion);

    // Get category ID if available
    const categoryId = suggestion._id;

    return (
      <div
        key={index}
        className={`search-suggestion-item ${index === activeSuggestionIndex ? "active" : ""}`}
        style={{
          padding: "10px 16px",
          cursor: "pointer",
          borderBottom:
            index < Math.min(searchSuggestions.length, 8) - 1
              ? "1px solid #f0f0f0"
              : "none",
          backgroundColor:
            index === activeSuggestionIndex ? "#f8f9fa" : "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "background-color 0.2s",
        }}
        onClick={() => handleSuggestionClick(suggestion)}
        onMouseEnter={() => setActiveSuggestionIndex(index)}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <i
            className={`fas ${isCategory ? "fa-folder" : "fa-search"}`}
            style={{
              marginRight: "12px",
              color: isCategory ? "#28a745" : "#666",
              fontSize: "13px",
            }}
          ></i>
          <span style={{ fontSize: "13px", color: "#333" }}>
            {suggestionText}
          </span>
        </div>
        {isCategory && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "10px",
                color: "#666",
                fontFamily: "monospace",
              }}
            >
              ID: {categoryId?.substring(0, 8)}...
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "#28a745",
                backgroundColor: "#e8f5e8",
                padding: "2px 6px",
                borderRadius: "3px",
              }}
            >
              {t("Category")}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Skeleton loader components
  const ProductSkeleton = () => (
    <div className="col-lg-3 col-md-6 mb-3">
      <div className="searchproduct">
        <div
          className="searchproductimgg skeleton-box"
          style={{ height: "200px" }}
        ></div>
        <div
          className="searchproductname skeleton-box"
          style={{ height: "20px", marginTop: "10px" }}
        ></div>
      </div>
    </div>
  );

  const SuggestionSkeleton = () => (
    <div
      className="suggestion-item skeleton-box"
      style={{ height: "20px", margin: "5px 0" }}
    ></div>
  );

  // outside close search handler
  const useClickOutside = (ref, callback) => {
    useEffect(() => {
      const handler = (e) => {
        if (ref.current && !ref.current.contains(e.target)) {
          callback();
        }
      };

      document.addEventListener("mousedown", handler, true);
      document.addEventListener("touchstart", handler, true);
      return () => {
        document.removeEventListener("mousedown", handler, true);
        document.removeEventListener("touchstart", handler, true);
      };
    }, [ref, callback]);
  };

  const closeSearchCallback = React.useCallback(() => setShowSearch(false), []);
  useClickOutside(searchRef, closeSearchCallback);

  return (
    <>
      <div className="col-md-6 searchcol" ref={searchRef}>
        <div className="searchmain">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="headersearchinput" style={{ position: "relative" }}>
              <input
                type="text"
                className="form-control"
                onFocus={toggleSearch}
                value={searchQuery}
                onChange={() => {}}
                onKeyDown={(e) => e.preventDefault()}
                placeholder={t("Search for products, brands and more")}
                autoComplete="off"
                readOnly
              />
            </div>
          </form>

          <div className={`showsearchbox ${showSearch ? "active" : ""}`}>
            <div className="container">
              <div className="searchtop">
                <input
                  type="text"
                  className="form-control"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={t("What are you looking for?")}
                  autoComplete="off"
                  style={{ position: "relative" }}
                />
                <a onClick={closeSearch} style={{ cursor: "pointer" }}>
                  {t("Cancel")}
                </a>

                {/* IntelliSense Suggestions Dropdown for search modal */}
                {/* {showSuggestions && searchSuggestions.length > 0 && (
                                    <div className="search-suggestions-dropdown-modal" style={{
                                        position: 'absolute',
                                        top: '56px',
                                        left: '2px',
                                        right: '80px',
                                        backgroundColor: 'white',
                                        border: '1px solid #ddd',
                                        borderRadius: '0px',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                        zIndex: 1001,
                                        maxHeight: '250px',
                                        overflowY: 'auto'
                                    }}>
                                        {loadingSuggestions ? (
                                            <div style={{ padding: '12px 16px', color: '#666' }}>
                                                <i className="fas fa-spinner fa-spin"></i> {t('Loading suggestions...')}
                                            </div>
                                        ) : (
                                            searchSuggestions.slice(0, 8).map((suggestion, index) =>
                                                renderSuggestionItem(suggestion, index)
                                            )
                                        )}
                                    </div>
                                )} */}
              </div>

              <div className="row py-4">
                <div className="col-md-4 mb-md-0 mb-4">
                  <div className="searchcategory">
                    <div className="d-flex justify-content-between align-items-center">
                      <h2>{t("Your Recent Searches")}</h2>
                      {searchHistory.length > 0 && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={clearSearchHistory}
                          style={{ fontSize: "12px" }}
                        >
                          {t("Clear")}
                        </button>
                      )}
                    </div>

                    {loadingPopular ? (
                      <div>
                        {[...Array(5)].map((_, index) => (
                          <SuggestionSkeleton key={index} />
                        ))}
                      </div>
                    ) : (
                      <ul>
                        {searchHistory.slice(0, 9).map((item, index) => (
                          <li key={index}>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleSuggestionClick(item.search);
                              }}
                            >
                              {item?.search}
                            </a>
                          </li>
                        ))}
                        {searchHistory.length === 0 && (
                          <li className="text-muted">
                            {t("No recent searches")}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="col-md-8">
                  <div className="row">
                    <div className="col-md-12 mb-3 d-flex align-items-center justify-content-between">
                      <div className="searchhead">
                        {searchQuery
                          ? t("Search Results")
                          : t("Popular Products")}
                      </div>
                      <Link href="/Product" className="viewall">
                        {t("View All")}
                      </Link>
                    </div>

                    {/* Popular Products */}

                    <div className="col-md-12">
                      <div className="row flex-nowrap flex-lg-wrap overflow-auto">
                        {(loadingPopular && !searchQuery) ||
                        (loading && searchQuery) ? (
                          <>
                            {[...Array(4)].map((_, index) => (
                              <ProductSkeleton key={index} />
                            ))}
                          </>
                        ) : (
                          <>
                            {(searchQuery
                              ? searchResults
                              : popularProducts
                            ).map((item) => (
                              <div
                                key={item._id}
                                className="col-lg-3 col-md-6 col-7 mb-3"
                              >
                                {item.type === "Category" ? (
                                  // Category item - use click handler
                                  <div
                                    className="searchproduct"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleProductClick(item)}
                                  >
                                    <div className="searchproductimgg">
                                      <img
                                        src={
                                          item?.image ||
                                          item?.images?.[0]?.url ||
                                          item?.variant?.images?.[0]?.url ||
                                          "/assets/img/dummy.jpg"
                                        }
                                        alt={getLocalizedName(item)}
                                        onError={(e) => {
                                          e.target.src =
                                            "/assets/img/dummy.jpg";
                                        }}
                                      />
                                    </div>
                                    <div className="searchproductname">
                                      {getLocalizedName(item)}
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          marginTop: "5px",
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontSize: "12px",
                                            color: "#28a745",
                                            backgroundColor: "#e8f5e8",
                                            padding: "2px 6px",
                                            borderRadius: "3px",
                                          }}
                                        >
                                          {t("Category")}
                                        </span>
                                        <span
                                          style={{
                                            fontSize: "10px",
                                            color: "#666",
                                            fontFamily: "monospace",
                                          }}
                                        >
                                          ID: {item._id?.substring(0, 6)}...
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  // Product item - use Link component
                                  <Link
                                    className="searchproduct"
                                    href={`/product/${item._id}`}
                                    onClick={() => {
                                      setShowSuggestions(false);
                                      closeSearch();
                                    }}
                                  >
                                    <div className="searchproductimgg">
                                      <img
                                        src={
                                          item?.images?.[0]?.url ||
                                          item?.variant?.images?.[0]?.url ||
                                          "/assets/img/dummy.jpg"
                                        }
                                        alt={getLocalizedName(item)}
                                        onError={(e) => {
                                          e.target.src =
                                            "/assets/img/dummy.jpg";
                                        }}
                                      />
                                    </div>
                                    <div className="searchproductname">
                                      {getLocalizedName(item)}
                                    </div>
                                  </Link>
                                )}
                              </div>
                            ))}

                            {(searchQuery ? searchResults : popularProducts)
                              .length === 0 && (
                              <div className="col-md-12 text-center">
                                <p className="text-muted">
                                  {searchQuery
                                    ? t("No products found")
                                    : t("No popular products available")}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Search;
