"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  logoutProfile,
  setCurrency,
  setScreenState,
} from "@/store/serviceSlices/commonSlice";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import Search from "./Search";
import { getDeviceId } from "@/httpServices/deviceId";
import { persistor } from "@/store/store";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import useHomeStore from "@/store/homeStore";
import { formatDescription } from "@/common/commonUtils";

// Country → Currency mapping
const countryToCurrencyMap = {
  "Saudi Arabia": "SAR - Saudi Riyal",
  "United States": "USD - US Dollar",
  "United Arab Emirates": "AED - UAE Dirham",
  Qatar: "QAR - Qatari Riyal",
  Kuwait: "KWD - Kuwaiti Dinar",
  Oman: "OMR - Omani Rial",
  "United Kingdom": "GBP - British Pound",
};

// Resolve initial currency from localStorage userCountry
// const getInitialCurrency = () => {
//   const storedCountry = localStorage.getItem("userCountry");
//   if (storedCountry && countryToCurrencyMap[storedCountry]) {
//     return countryToCurrencyMap[storedCountry];
//   }
//   return;
// };

// Click Outside Close Hook

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

const Header = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { t, i18n: i18nInstance } = useTranslation();

  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Stabilize callbacks to prevent redundant effect triggers

  const closeProfile = React.useCallback(() => setShowProfile(false), []);
  const closeMenu = React.useCallback(() => setShowMenu(false), []);

  const [userCurrency, setUserCurrency] = useState(
    localStorage.getItem("userCurrency") || "",
  );
  const [currencyLoading, setCurrencyLoading] = useState(
    !localStorage.getItem("userCurrency"),
  );
  const [userCountry, setUserCountry] = useState("SA");
  const [userTimezone, setUserTimezone] = useState("");
  const [activeTab, setActiveTab] = useState("nav-home");
  const [currentLanguage, setCurrentLanguage] = useState(
    i18n.language || "en-US",
  );
  const [isRTL, setIsRTL] = useState(i18n.language === "ar");

  // Click Outside Close Ref
  const profileDropdownRef = useRef(null);
  const menuDropdownRef = useRef(null);

  // const {
  //   category,
  //   products,
  //   bestSellingData,
  //   fetchHomeData,
  //   trendingProduct
  // } = useHomeStore();
  const category = useHomeStore((state) => state.category);
  const products = useHomeStore((state) => state.products);
  const bestSellingData = useHomeStore((state) => state.bestSellingData);
  const trendingProduct = useHomeStore((state) => state.trendingProduct);
  const fetchHomeData = useHomeStore((state) => state.fetchHomeData);
  const loading = useHomeStore((state) => state.loading);

  // console.log(bestSellingData, "bestSellingData---")
  // console.log(products, "Products---")
  // console.log(category, "Category---")

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  // Poll localStorage for userCurrency until it's set (by App.js detectUserCountry)
  useEffect(() => {
    if (!currencyLoading) return;
    const interval = setInterval(() => {
      const stored = localStorage.getItem("userCurrency");
      if (stored) {
        setUserCurrency(stored);
        setCurrencyLoading(false);
        clearInterval(interval);
      }
    }, 300);
    // Fallback: stop loading after 10s and default to USD
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!localStorage.getItem("userCurrency")) {
        localStorage.setItem("userCurrency", "USD - US Dollar");
        localStorage.setItem("country", "United States");
        localStorage.setItem("userCountry", "United States");
        setUserCurrency("USD - US Dollar");
      }
      setCurrencyLoading(false);
    }, 10000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [currencyLoading]);

  // Initialize language and direction
  useEffect(() => {
    const savedLang = localStorage.getItem("i18nextLng") || "en";
    setCurrentLanguage(savedLang);
    setIsRTL(savedLang === "ar");

    // Set HTML attributes
    document.documentElement.lang = savedLang;
    document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";

    // Add RTL class to body if needed
    if (savedLang === "ar") {
      document.body.classList.add("rtl");
    } else {
      document.body.classList.remove("rtl");
    }
  }, []);

  // Handle language change
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setCurrentLanguage(lng);
      setIsRTL(lng === "ar");

      // Update HTML attributes
      document.documentElement.lang = lng;
      document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";

      // Update body class
      if (lng === "ar") {
        document.body.classList.add("rtl");
      } else {
        document.body.classList.remove("rtl");
      }

      // Force a re-render by updating state
      window.dispatchEvent(new Event("languageChanged"));
    };

    i18nInstance.on("languageChanged", handleLanguageChange);

    return () => {
      i18nInstance.off("languageChanged", handleLanguageChange);
    };
  }, [i18nInstance]);

  const { cart, profile, isUserLoggedIn, wishList, counts } = useSelector(
    (state) => ({
      cart: state?.commonSlice?.cartState,
      profile: state?.commonSlice?.profile,
      isLoading: state?.getCartSlices?.isLoading,
      isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
      wishList: state?.commonSlice?.wishState?.wishList?.length || 0,
      counts: state?.commonSlice?.counts || {},
    }),
  );

  // Function to change language
  const changeLanguage = async (lng) => {
    try {
      // Show loading toast
      const loadingToast = toast.loading(
        lng === "ar" ? "جاري تغيير اللغة..." : "Changing language...",
      );

      // Update i18next
      await i18n.changeLanguage(lng);

      // Save to localStorage
      localStorage.setItem("i18nextLng", lng);

      // Update backend
      const deviceId = getDeviceId();
      await callMiddleWare({
        method: "PUT",
        endpoint: "user/changeLanguage",
        data: {
          deviceId: deviceId || "",
          language: lng == "ar" ? "Arabic" : "English",
        },
      });

      // Update success toast
      toast.dismiss(loadingToast);
      toast.success(
        lng === "ar"
          ? "تم تغيير اللغة إلى العربية"
          : "Language changed to English",
      );

      // Refresh the page to apply RTL/LTR changes completely
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error changing language:", error);
      toast.error(
        currentLanguage === "ar"
          ? "حدث خطأ أثناء تغيير اللغة"
          : "Error changing language",
      );
    }
  };

  // Function to handle language selection change
  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;
    changeLanguage(selectedLanguage);
  };

  // Function to update timezone using timezone API
  const updateTimeZone = async (timezone, countryName, forceUpdate = false) => {
    const deviceId = getDeviceId();

    // Check if country is already set in localStorage
    const storedCountry = localStorage.getItem("country");
    const timezoneUpdated = localStorage.getItem("timezoneUpdated");

    // If country is already set and matches, and timezone was already updated, don't call API
    if (
      storedCountry === countryName &&
      timezoneUpdated === "true" &&
      !forceUpdate
    ) {
      console.log("Timezone already updated, skipping API call");
      return;
    }

    try {
      // If no timezone provided, get it from timezone API based on country
      let finalTimezone = timezone;
      if (!finalTimezone) {
        finalTimezone = getUserTimezone();
      }

      const response = await callMiddleWare({
        method: "PUT",
        endpoint: "user/updateTimeZone",
        data: {
          deviceId: deviceId,
          time_zone: finalTimezone,
          deviceOS: "web",
          country: countryName, // Only pass country as requested
        },
      });

      console.log(response, "Timezone API response");

      if (!response.error || response?.error_code === 200) {
        // localStorage.setItem("userCountry", countryName);
        // localStorage.setItem("userCurrency", countryName);
        localStorage.setItem("userTimezone", finalTimezone);
        localStorage.setItem("timezoneUpdated", "true");

        // Only reload if this is a forced update (user changed currency)
        // if (forceUpdate) {
        //   setTimeout(() => {
        //     window.location.reload();
        //   }, 1000);
        // }
      } else {
        toast.error("Failed to update timezone");
      }
    } catch (error) {
      console.error("Error updating timezone:", error);
    }
  };

  // Function to get user's timezone
  const getUserTimezone = () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(timezone);
      return timezone;
    } catch (error) {
      console.error("Error getting timezone:", error);
      return "Asia/Riyadh";
    }
  };

  // Function to get user's country and set appropriate currency using timezone API
  // const detectUserCountryAndCurrency = async () => {
  //   try {
  //     // Check localStorage "userCountry" (set by Homepage.jsx detectUserCountry)
  //     const storedCountry = localStorage.getItem("userCountry");
  //     const storedTimezone = localStorage.getItem("userTimezone");

  //     if (storedCountry) {
  //       // Map country name to currency
  //       const resolvedCurrency =
  //         countryToCurrencyMap[storedCountry];
  //       const resolvedTimezone = storedTimezone || getUserTimezone();

  //       setUserCurrency(resolvedCurrency);
  //       setUserCountry(storedCountry);
  //       setUserTimezone(resolvedTimezone);
  //       // localStorage.setItem("userCurrency", resolvedCurrency);
  //       dispatch(setCurrency(storedCountry));

  //       await updateTimeZone(resolvedTimezone, storedCountry);
  //       return { countryName: storedCountry, timezone: resolvedTimezone };
  //     }

  //     // Use World Time API to get timezone information
  //     const response = await fetch("http://worldtimeapi.org/api/ip");
  //     const data = await response.json();

  //     console.log(data, "Header DATA API")

  //     const timezone = data.timezone;
  //     const countryCode = data.abbreviation; // Get country code from timezone data

  //     // Map timezone to country
  //     const timezoneToCountryMap = {
  //       "Asia/Riyadh": "Saudi Arabia",
  //       "Asia/Dubai": "United Arab Emirates",
  //       "Asia/Qatar": "Qatar",
  //       "America/New_York": "United States",
  //       "America/Los_Angeles": "United States",
  //       "Europe/London": "United Kingdom",
  //       "Asia/Kuwait": "Kuwait",
  //       "Asia/Muscat": "Oman",
  //     };

  //     // Extract country from timezone or use fallback
  //     let detectedCountry = "United States"; // Default fallback

  //     // Check if timezone directly maps to a country
  //     if (timezoneToCountryMap[timezone]) {
  //       detectedCountry = timezoneToCountryMap[timezone];
  //     } else {
  //       // Try to infer country from timezone string
  //       if (timezone.includes("Riyadh")) detectedCountry = "Saudi Arabia";
  //       else if (timezone.includes("Dubai"))
  //         detectedCountry = "United Arab Emirates";
  //       else if (timezone.includes("Qatar")) detectedCountry = "Qatar";
  //       else if (timezone.includes("America"))
  //         detectedCountry = "United States";
  //       else if (timezone.includes("Europe"))
  //         detectedCountry = "United Kingdom";
  //       else if (timezone.includes("Kuwait")) detectedCountry = "Kuwait";
  //       else if (timezone.includes("Muscat")) detectedCountry = "Oman";
  //     }

  //     setUserCountry(detectedCountry);

  //     // Allowed countries ONLY
  //     const currencyMap = {
  //       "Saudi Arabia": "SAR - Saudi Riyal",
  //       "United States": "USD - US Dollar",
  //       "United Arab Emirates": "AED - UAE Dirham",
  //       Qatar: "QAR - Qatari Riyal",
  //       Kuwait: "KWD - Kuwaiti Dinar",
  //       Oman: "OMR - Omani Rial",
  //       "United Kingdom": "GBP - British Pound",
  //     };

  //     // If country not in map → default to US
  //     const detectedCurrency = currencyMap[detectedCountry];

  //     setUserCurrency(detectedCurrency);

  //     // localStorage.setItem("userCurrency", detectedCurrency);
  //     // localStorage.setItem("userCountry", detectedCountry);

  //     setUserTimezone(timezone);

  //     // Only dispatch mapped country or US fallback
  //     if (timezone && detectedCountry) {
  //       dispatch(setCurrency(detectedCountry));
  //       await updateTimeZone(timezone, detectedCountry);
  //     }

  //     return { countryName: detectedCountry, timezone: timezone };
  //   } catch (error) {
  //     console.error("Error detecting country via timezone API:", error);

  //     // Fallback to browser timezone detection
  //     const fallbackTimezone = getUserTimezone();
  //     let fallbackCountry = "United States";

  //     // Map fallback timezone to country
  //     if (fallbackTimezone.includes("Riyadh")) fallbackCountry = "Saudi Arabia";
  //     else if (fallbackTimezone.includes("Dubai"))
  //       fallbackCountry = "United Arab Emirates";
  //     else if (fallbackTimezone.includes("Qatar")) fallbackCountry = "Qatar";
  //     else if (fallbackTimezone.includes("America"))
  //       fallbackCountry = "United States";

  //     const currencyMap = {
  //       "Saudi Arabia": "SAR - Saudi Riyal",
  //       "United States": "USD - US Dollar",
  //       "United Arab Emirates": "AED - UAE Dirham",
  //       Qatar: "QAR - Qatari Riyal",
  //     };

  //     const savedCurrency =
  //       localStorage.getItem("userCurrency") || currencyMap[fallbackCountry]

  //     const savedCountry =
  //       localStorage.getItem("userCountry") || fallbackCountry;

  //     setUserCurrency(savedCurrency);
  //     setUserCountry(savedCountry);
  //     setUserTimezone(fallbackTimezone);

  //     await updateTimeZone(fallbackTimezone, savedCountry);

  //     return { countryName: savedCountry, timezone: fallbackTimezone };
  //   }
  // };

  // Function to handle currency change
  const handleCurrencyChange = async (event) => {
    const newCurrency = event.target.value;
    setUserCurrency(newCurrency);

    const currencyToCountryMap = {
      "SAR - Saudi Riyal": "Saudi Arabia",
      "USD - US Dollar": "United States",
      "AED - UAE Dirham": "United Arab Emirates",
      "QAR - Qatari Riyal": "Qatar",
      "KWD - Kuwaiti Dinar": "Kuwait",
      "OMR - Omani Rial": "Oman",
    };

    const selectedCountry = currencyToCountryMap[newCurrency];

    // Update localStorage
    localStorage.setItem("userCurrency", newCurrency);
    localStorage.setItem("country", selectedCountry);

    // Update Redux global state
    dispatch(setCurrency(selectedCountry));

    // Reset timezoneUpdated flag so it can update with new country
    localStorage.removeItem("timezoneUpdated");

    // Update timezone on backend with new country (no reload)
    if (selectedCountry) {
      await updateTimeZone("", selectedCountry, true);
    }

    // Notify other components listening for currency changes
    window.dispatchEvent(new CustomEvent("currencyChanged"));

    // Re-fetch all homepage data with new currency
    useHomeStore.getState().refreshHomeData();

    toast.success(
      currentLanguage === "ar"
        ? `تم تغيير العملة إلى ${newCurrency}`
        : `Currency changed to ${newCurrency}`,
    );
  };

  // Function to get all available currencies
  const getAvailableCurrencies = () => {
    return [
      "SAR - Saudi Riyal",
      "USD - US Dollar",
      "AED - UAE Dirham",
      "QAR - Qatari Riyal",
      "KWD - Kuwaiti Dinar",
      "OMR - Omani Rial",
    ];
  };

  // Skeleton loader component
  const ProductSkeleton = () => (
    <div className="col-md-3 mb-4">
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

  // Function to handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Function to get products by category
  const getProductsByCategory = (categoryId) => {
    if (!products || !Array.isArray(products)) return [];
    return products.filter((product) => product.category_id === categoryId);
  };

  // Function to render products for a specific category
  const renderCategoryProducts = (categoryId, limit = 8) => {
    const categoryProducts = getProductsByCategory(categoryId);
    const productsToShow = categoryProducts.slice(0, limit);

    if (productsToShow.length === 0) {
      return <p>{t("products.noCategoryProducts")}</p>;
    }

    return (
      <div className="overflow-auto no-scrollbar">
        <div
          className={`row flex-nowrap menuproductflex justify-content-lg-center ${isRTL ? "rtl-grid" : ""}`}
        >
          {productsToShow.map((product, i) => (
            <div key={i} className="col-md-3 mb-4">
              <Link
                href={`/Product/${product.id}`}
                className="searchproduct"
                onClick={() => setShowMenu(false)}
              >
                <div className="searchproductimgg">
                  <img
                    src={
                      product?.images?.[0]?.url ||
                      product?.variant?.images?.[0]?.url ||
                      "/assets/img/placeholder.jpg"
                    }
                    alt={
                      currentLanguage === "ar"
                        ? product?.name_ar
                        : product?.name_en
                    }
                  />
                </div>
                <div className="searchproductname text-center">
                  {formatDescription(
                    currentLanguage === "ar"
                      ? product?.name_ar
                      : product?.name_en,
                    3,
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Function to render all products
  const renderAllProducts = (limit = 8) => {
    if (loading) {
      return (
        <div className="overflow-auto no-scrollbar">
          <div
            className={`row flex-nowrap menuproductflex justify-content-lg-center ${isRTL ? "rtl-grid" : ""}`}
          >
            {[...Array(8)].map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        </div>
      );
    }

    if (!products || !Array.isArray(products)) {
      return <p>{t("products.noProducts")}</p>;
    }

    const productsToShow = products.slice(0, limit);

    return (
      <div className="overflow-auto no-scrollbar">
        <div
          className={`row flex-nowrap menuproductflex justify-content-lg-center ${isRTL ? "rtl-grid" : ""}`}
        >
          {products?.map((product, i) => (
            <div key={i} className="col-md-3 mb-4">
              <Link
                href={`/Product/${product._id}`}
                className="searchproduct"
                onClick={() => setShowMenu(false)}
              >
                <div className="searchproductimgg custom-products">
                  <img
                    src={
                      product?.images?.[0]?.url ||
                      product?.variant?.images?.[0]?.url ||
                      "/assets/img/placeholder.jpg"
                    }
                    alt={
                      currentLanguage === "ar"
                        ? product?.name_ar
                        : product?.name_en
                    }
                  />
                </div>
                <div className="searchproductname text-center">
                  {/* {currentLanguage === "ar" ? product?.name_ar : product?.name_en} */}
                  {formatDescription(
                    currentLanguage === "ar"
                      ? product?.name_ar
                      : product?.name_en,
                    3,
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Function to render categories
  const renderCategories = () => {
    if (!category || !Array.isArray(category)) {
      return <p>{t("products.noCategories")}</p>;
    }

    return (
      <div className="overflow-auto no-scrollbar">
        <div
          className={`ms-1 ms-md-0 row flex-nowrap menuproductflex ${isRTL ? "rtl-grid" : ""}`}
        >
          {category.map((cat, i) => (
            <div key={i} className="col-8 col-md-4 mb-4 px-2 px-md-3">
              <Link
                href={`/category/${cat._id}`}
                className="searchproduct"
                onClick={() => setShowMenu(false)}
              >
                <div className="searchproductimgg">
                  <img
                    src={cat.image || "/assets/img/placeholder.jpg"}
                    alt={currentLanguage === "ar" ? cat.name_ar : cat.name_en}
                  />
                </div>
                <div className="searchproductname text-center">
                  {formatDescription(
                    currentLanguage === "ar" ? cat.name_ar : cat.name_en,
                    3,
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Detect country and currency on component mount
  // useEffect(() => {
  //   detectUserCountryAndCurrency().finally(() => setCurrencyLoading(false));
  // }, []);

  // Toggle functions
  const toggleProfile = () => {
    setShowProfile((prev) => {
      if (!prev) setShowMenu(false);
      return !prev;
    });
  };

  const toggleMenu = () => {
    setShowMenu((prev) => {
      if (!prev) setShowProfile(false);
      return !prev;
    });
  };

  const handleLogout = async () => {
    try {
      // Close UI elements first
      setShowProfile(false);
      setShowMenu(false);

      // Dispatch logout action
      dispatch(logoutProfile());

      // Clear persisted storage
      await persistor.purge();

      // Clear all storage while preserving language preference
      const preferredLanguage = localStorage.getItem("i18nextLng");

      // Clear storage more efficiently
      localStorage.clear();
      sessionStorage.clear();

      // Restore language preference (if you want to keep English)
      // If you always want English on logout:
      localStorage.setItem("i18nextLng", "en");

      // Or if you want to preserve user's language choice:
      // if (preferredLanguage) {
      //   localStorage.setItem("i18nextLng", preferredLanguage);
      // }

      // Show success message
      toast.success("Logout successful");

      // Close modal if exists
      const closeButton = document.getElementById("close");
      if (closeButton) {
        closeButton.click();
      }

      // Navigate and reload
      router.push("/Authentication");

      // Add slight delay before reload to ensure navigation happens
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  // Handle navigation for protected routes
  const handleProtectedNavigation = (path) => {
    router.push(path);
  };

  // Get language display name
  const getLanguageDisplayName = (lang) => {
    const languages = {
      en: "English",
      ar: "العربية",
    };
    return languages[lang] || lang;
  };

  // Click Outside Close Handlers
  useClickOutside(profileDropdownRef, closeProfile);
  useClickOutside(menuDropdownRef, closeMenu);

  // useEffect(()=>{
  //   setCurrency(localStorage.getItem("country") || "Saudi Arabia");
  // }, [userCurrency]);

  return (
    <div>
      {/* Top Bar */}
      <div className="topbar" dir="ltr">
        <div className="container">
          <div
            className={`row align-items-center ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <div className="col-md-6">
              <div className="infobox">{t("header.topbarMessage")}</div>
            </div>
            <div
              className={`col-md-6 ${isRTL ? "text-lg-end text-center" : "text-lg-end text-center"} d-md-block`}
            >
              <div className="topbarselect">
                <div
                  className={`row ${isRTL ? "justify-content-lg-start justify-content-between" : "justify-content-lg-end justify-content-between"}`}
                >
                  <div className="col-auto pe-1">
                    <select
                      className={`custom-select ${isRTL ? "text-end" : ""}`}
                      value={currentLanguage}
                      onChange={handleLanguageChange}
                    >
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                  <div className="col-auto">
                    <select
                      className={`custom-select ${isRTL ? "text-end" : ""}`}
                      value={currencyLoading ? "" : userCurrency}
                      onChange={handleCurrencyChange}
                      disabled={currencyLoading}
                    >
                      {currencyLoading ? (
                        <option value="">{t("Loading...")}</option>
                      ) : (
                        getAvailableCurrencies().map((currency, i) => (
                          <option key={i} value={currency}>
                            {currency}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="headermain">
        <div className="container">
          <div
            className={`row justify-content-between align-items-center ${isRTL ? "flex-row-reverse" : ""}`}
          >
            {/* Logo */}
            <div className="col-auto">
              <Link href="/" className="logohead">
                <img src="/assets/img/logo.png" alt="logo" />
              </Link>
            </div>

            {/* Search */}
            <Search
              setShowProfile={setShowProfile}
              setShowMenu={setShowMenu}
              placeholder={t("header.searchPlaceholder")}
            />

            {/* Icons */}
            <div className="col-auto">
              <div className={`row ${isRTL ? "flex-row-reverse" : ""}`}>
                {/* Wishlist */}
                <div className="col-auto pe-0">
                  <a
                    className="headericons"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (isUserLoggedIn) {
                        handleProtectedNavigation("/MyWishlists");
                      } else {
                        localStorage.setItem("auth_screen", "Login"); // Reset auth screen state
                        router.push("/Authentication");
                      }
                    }}
                    title={t("header.wishlist")}
                  >
                    <span>{wishList}</span>
                    <img src="/assets/img/fav.png" alt="Wishlist" />
                  </a>
                </div>

                {/* Cart */}
                <div className="col-auto pe-0">
                  <a
                    className="headericons"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      dispatch(setScreenState("Cart"));
                      handleProtectedNavigation("/cart");
                    }}
                    title={t("header.viewCart")}
                  >
                    {/* <span>{cart?.carts?.products?.length || 0}</span> */}
                    <span>{counts?.cart || 0}</span>
                    <img src="/assets/img/cart.png" alt="Cart" />
                  </a>
                </div>

                {/* Profile - Desktop */}
                <div className="col-auto pe-0" ref={profileDropdownRef}>
                  <a
                    className="headericons profiletoggle"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleProfile();
                    }}
                    title={t("header.myProfile")}
                  >
                    <img src="/assets/img/profile.png" alt="Profile" />
                  </a>

                  <div
                    className={`profilemenuss ${showProfile ? "active" : ""} ${isRTL ? "rtl-menu" : ""}`}
                  >
                    <div className="container px-3">
                      <div className="profilemenuinner">
                        {profile && (
                          <>
                            <Link
                              href="/MyProfile"
                              className="profilemenubox"
                              onClick={() => setShowProfile(false)}
                            >
                              <span>
                                <img
                                  src="/assets/img/profileicon1.png"
                                  alt="Profile"
                                />
                              </span>
                              {t("header.myProfile")}
                            </Link>
                            <Link
                              className="profilemenubox"
                              href="/MyCoupons"
                              onClick={() => setShowProfile(false)}
                            >
                              <span>
                                <img
                                  src="/assets/img/profileicon3.png"
                                  alt="Coupons"
                                />
                              </span>
                              {t("header.myCoupons")}
                            </Link>
                            <Link
                              className="profilemenubox"
                              href="/MyLoyaltyPoints"
                              onClick={() => setShowProfile(false)}
                            >
                              <span>
                                <img
                                  src="/assets/img/walletIcon.png"
                                  alt="Loyalty Points"
                                  style={{ width: "40px", height: "40px" }}
                                />
                              </span>
                              {t("header.myWallet")}
                            </Link>
                            <Link
                              className="profilemenubox"
                              href="/SavedAddress"
                              onClick={() => setShowProfile(false)}
                            >
                              <span>
                                <img
                                  src="/assets/img/profileicon5.png"
                                  alt="Address"
                                />
                              </span>
                              {t("header.savedAddress")}
                            </Link>
                          </>
                        )}
                        <Link
                          className="profilemenubox"
                          href="/MyOrders"
                          onClick={() => setShowProfile(false)}
                        >
                          <span>
                            <img
                              src="/assets/img/profileicon2.png"
                              alt="Orders"
                            />
                          </span>
                          {t("header.myOrders")}
                        </Link>

                        <Link
                          className="profilemenubox"
                          href="/Career"
                          onClick={() => setShowProfile(false)}
                        >
                          <span>
                            <img
                              src="/assets/img/profileicon6.png"
                              alt="Career"
                            />
                          </span>
                          {t("header.career")}
                        </Link>
                        <Link
                          className="profilemenubox"
                          href="/HelpSupport"
                          onClick={() => setShowProfile(false)}
                        >
                          <span>
                            <img
                              src="/assets/img/profileicon7.png"
                              alt="Support"
                            />
                          </span>
                          {t("header.helpSupport")}
                        </Link>
                        {!profile && (
                          <Link
                            className="profilemenubox"
                            href="/Authentication"
                            onClick={() => {
                              setShowProfile(false);
                              localStorage.setItem("auth_screen", "Login"); // Reset auth screen state
                            }}
                          >
                            <span>
                              <img
                                src="/assets/img/profile.png"
                                alt="Login"
                                style={{ width: "23px", height: "23px" }}
                              />
                            </span>
                            {t("header.loginSignup")}
                          </Link>
                        )}
                        {profile && (
                          <a
                            className="profilemenubox"
                            data-bs-toggle="modal"
                            data-bs-target="#logout"
                          >
                            <span>
                              <img
                                src="/assets/img/profileicon8.png"
                                alt="Logout"
                              />
                            </span>
                            {t("header.logout")}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Toggle */}
                <div className="col-auto" ref={menuDropdownRef}>
                  <a
                    className="headericons barsbtn"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleMenu();
                    }}
                    href="#"
                    style={{ cursor: "pointer" }}
                  >
                    <img src="/assets/img/barss.png" alt="Menu" />
                  </a>

                  <div
                    className={`mainmenu ${showMenu ? "active" : ""} ${isRTL ? "rtl-menu" : ""}`}
                  >
                    {/* Desktop Menu */}
                    <div className="container">
                      <nav>
                        <div
                          className="nav nav-tabs"
                          id="nav-tab"
                          role="tablist"
                        >
                          <button
                            className={`nav-link ${activeTab === "nav-home" ? "active" : ""} ${isRTL ? "text-right" : ""}`}
                            id="nav-home-tab"
                            onClick={() => handleTabChange("nav-home")}
                            type="button"
                          >
                            {t("menu.bestSellers")}
                          </button>
                          <button
                            className={`nav-link ${activeTab === "nav-profile" ? "active" : ""} ${isRTL ? "text-right" : ""}`}
                            id="nav-profile-tab"
                            onClick={() => handleTabChange("nav-profile")}
                            type="button"
                          >
                            {t("menu.allProducts")}
                          </button>
                          <button
                            className={`nav-link ${activeTab === "nav-contact" ? "active" : ""} ${isRTL ? "text-right" : ""}`}
                            id="nav-contact-tab"
                            onClick={() => handleTabChange("nav-contact")}
                            type="button"
                          >
                            {t("menu.allCategories")}
                          </button>
                        </div>
                      </nav>
                      <div className="tab-content" id="nav-tabContent">
                        {/* Best Sellers Tab */}
                        <div
                          className={`tab-pane fade ${activeTab === "nav-home" ? "show active" : ""}`}
                          id="nav-home"
                          role="tabpanel"
                        >
                          <div className="row pt-5 pb-4 px-2 justify-content-center">
                            <div className="col-md-12">
                              {
                                // loading ? (
                                //   <div className="overflow-auto no-scrollbar">
                                //     <div
                                //       className={`row flex-nowrap menuproductflex justify-content-lg-center ${isRTL ? "rtl-grid" : ""}`}
                                //     >
                                //       {[...Array(8)].map((_, index) => (
                                //         <ProductSkeleton key={index} />
                                //       ))}
                                //     </div>
                                //   </div>
                                // ) :
                                bestSellingData &&
                                bestSellingData.length > 0 ? (
                                  <div className="overflow-auto no-scrollbar">
                                    <div
                                      className={`row flex-nowrap menuproductflex justify-content-lg-center ${isRTL ? "rtl-grid" : ""}`}
                                    >
                                      {bestSellingData.map((product, idx) => (
                                        <div
                                          key={`${product._id || product.id || "best"}-${idx}`}
                                          className="col-md-3 mb-4"
                                        >
                                          <Link
                                            href={`/Product/${product._id}`}
                                            className="searchproduct"
                                            onClick={() => setShowMenu(false)}
                                          >
                                            <div className="searchproductimgg custom-products">
                                              <img
                                                src={
                                                  product?.images?.[0]?.url ||
                                                  product?.variant?.images?.[0]
                                                    ?.url ||
                                                  "/assets/img/placeholder.jpg"
                                                }
                                                alt={
                                                  currentLanguage === "ar"
                                                    ? product?.name_ar
                                                    : product?.name_en
                                                }
                                              />
                                            </div>
                                            <div className="searchproductname text-center">
                                              {formatDescription(
                                                currentLanguage === "ar"
                                                  ? product?.name_ar
                                                  : product?.name_en,
                                                3,
                                              )}
                                            </div>
                                          </Link>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <p
                                    className={`text-center ${isRTL ? "text-right" : ""}`}
                                  >
                                    {t("products.noBestSelling")}
                                  </p>
                                )
                              }
                            </div>
                            <div className="col-md-12 text-center">
                              <Link
                                className="viewall"
                                href="/Product/All/Best-Selling-Products"
                                onClick={() => setShowMenu(false)}
                              >
                                {t("menu.viewAll")}
                              </Link>
                            </div>
                          </div>
                        </div>

                        {/* All Products Tab */}
                        <div
                          className={`tab-pane fade ${activeTab === "nav-profile" ? "show active" : ""}`}
                          id="nav-profile"
                          role="tabpanel"
                        >
                          <div className="row pt-5 pb-4 px-2 justify-content-center">
                            <div className="col-md-12">
                              {renderAllProducts()}
                            </div>
                            <div className="col-md-12 text-center">
                              <Link
                                className="viewall"
                                href="/Product"
                                onClick={() => setShowMenu(false)}
                              >
                                {t("menu.viewAll")}
                              </Link>
                            </div>
                          </div>
                        </div>

                        {/* All Categories Tab */}
                        <div
                          className={`tab-pane fade ${activeTab === "nav-contact" ? "show active" : ""}`}
                          id="nav-contact"
                          role="tabpanel"
                        >
                          <div className="row pt-5 pb-4 px-2 justify-content-center">
                            <div className="col-md-12">
                              {renderCategories()}
                            </div>
                            <div className="col-12 mt-4">
                              <div className="col-md-12 text-center">
                                <Link
                                  className="viewall"
                                  href="/Categorys"
                                  onClick={() => setShowMenu(false)}
                                >
                                  {t("menu.viewAll")}
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Menu */}
                    {/* <div className="container px-3 d-lg-none d-md-block d-block">
                      <div className="profilemenuinner">
                        <Link
                          to="/MyProfile"
                          className="profilemenubox"
                          onClick={() => setShowMenu(false)}
                        >
                          <span>
                            <img
                              src="/assets/img/profileicon1.png"
                              alt="Profile"
                            />
                          </span>
                          {t("header.myProfile")}
                        </Link>
                        <Link
                          to="/MyOrders"
                          className="profilemenubox"
                          onClick={() => setShowMenu(false)}
                        >
                          <span>
                            <img
                              src="/assets/img/profileicon2.png"
                              alt="Orders"
                            />
                          </span>
                          {t("header.myOrders")}
                        </Link>
                        <Link
                          to="/MyCoupons"
                          className="profilemenubox"
                          onClick={() => setShowMenu(false)}
                        >
                          <span>
                            <img
                              src="/assets/img/profileicon3.png"
                              alt="Coupons"
                            />
                          </span>
                          {t("header.myCoupons")}
                        </Link>
                        <Link
                          to="/MyWallet"
                          className="profilemenubox"
                          onClick={() => setShowMenu(false)}
                        >
                          <span>
                            <img
                              src="/assets/img/walletIcon.png"
                              alt="Loyalty Points"
                              style={{ width: "40px", height: "40px" }}
                            />
                          </span>
                          {t("header.myWallet")}
                        </Link>
                        <Link
                          to="/SavedAddress"
                          className="profilemenubox"
                          onClick={() => setShowMenu(false)}
                        >
                          <span>
                            <img
                              src="/assets/img/profileicon5.png"
                              alt="Address"
                            />
                          </span>
                          {t("header.savedAddress")}
                        </Link>
                        <Link
                          to="/Career"
                          className="profilemenubox"
                          onClick={() => setShowMenu(false)}
                        >
                          <span>
                            <img
                              src="/assets/img/profileicon6.png"
                              alt="Career"
                            />
                          </span>
                          {t("header.career")}
                        </Link>
                        <Link
                          to="/HelpSupport"
                          className="profilemenubox"
                          onClick={() => setShowMenu(false)}
                        >
                          <span>
                            <img
                              src="/assets/img/profileicon7.png"
                              alt="Support"
                            />
                          </span>
                          {t("header.helpSupport")}
                        </Link>
                        <a
                          className="profilemenubox"
                          href="#!"
                          data-bs-toggle="modal"
                          data-bs-target="#logout"
                        >
                          <span>
                            <img
                              src="/assets/img/profileicon8.png"
                              alt="Logout"
                            />
                          </span>
                          {t("header.logout")}
                        </a>
                      </div>
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Logout Modal */}
      <div
        className="modal fade commanmodal"
        id="logout"
        tabIndex={-1}
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body position-relative">
              <div className="row">
                <div className="col-md-12">
                  <div className="commanmodaltop">
                    <img src="/assets/img/logout.png" alt="Logout" />
                    <h2 className={isRTL ? "text-right" : ""}>
                      {t("header.logoutConfirmation")}
                    </h2>
                    <p className={isRTL ? "text-right" : ""}>
                      {t("header.logoutMessage")}
                    </p>
                  </div>
                </div>
                <div className="col-md-12 mt-4">
                  <div className={`row ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className="col-md-6 mb-md-0 mb-2">
                      <a
                        className="authbtns1"
                        data-bs-dismiss="modal"
                        id="close"
                      >
                        {t("header.notNow")}
                      </a>
                    </div>
                    <div className="col-md-6">
                      <a
                        className="authbtns2 mt-md-0 mt-2"
                        onClick={() => handleLogout()}
                        style={{ cursor: "pointer" }}
                      >
                        {t("header.logoutBtn")}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toaster position="bottom-center" reverseOrder={false} />

      <style jsx>{`
        .skeleton-box {
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 4px;
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Header;
