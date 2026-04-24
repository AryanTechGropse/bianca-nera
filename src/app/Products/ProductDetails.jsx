import React, { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/header/Header";
import Footer from "@/footer/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams, useSearchParams } from "next/navigation";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { t } from "i18next";
import {
  addCart,
  getCart,
  getCounts,
  setScreenState,
  wishCart,
  wishListCart,
} from "@/store/serviceSlices/commonSlice";
import Products from "./Products";
import Chatbot from "@/app/HomeComponents/ChatBot";
import i18n from "@/i18n/i18n";
import Head from "next/head";

const COLOUR_MAP = {
  Moka: "#6D3B07",
  Red: "#FF0000",
  Green: "#008000",
  Blue: "#0000FF",
  Yellow: "#FFFF00",
  Orange: "#FFA500",
  Fuchsia: "#ff00ff",
  Purple: "#800080",
  Pink: "#FFC0CB",
  Brown: "#A52A2A",
  Black: "#000000",
  White: "#FFFFFF",
  Gray: "#808080",
  Grey: "#808080",
  LightGray: "#D3D3D3",
  LightGrey: "#D3D3D3",
  DarkGray: "#A9A9A9",
  DarkGrey: "#A9A9A9",
  Cyan: "#00FFFF",
  Magenta: "#FF00FF",
  Maroon: "#800000",
  Navy: "#000080",
  Teal: "#008080",
  Lime: "#00FF00",
  Olive: "#808000",
  Beige: "#F5F5DC",
  Ivory: "#FFFFF0",
  Coral: "#FF7F50",
  Salmon: "#FA8072",
  Gold: "#FFD700",
  Silver: "#C0C0C0",
  Bronze: "#CD7F32",
  Mint: "#98FF98",
  Turquoise: "#40E0D0",
  Indigo: "#4B0082",
  Lavender: "#E6E6FA",
  Peach: "#FFE5B4",
  Khaki: "#F0E68C",
  Chocolate: "#D2691E",
  Crimson: "#DC143C",
  Plum: "#DDA0DD",
  "Sky Blue": "#87CEEB",
  Aquamarine: "#7FFFD4",
  Azure: "#F0FFFF",
  SlateGray: "#708090",
  "Light Blue": "#ADD8E6",
  "Dark Blue": "#00008B",
  "Light Green": "#90EE90",
  "Dark Green": "#006400",
  "Light Pink": "#FFB6C1",
  "Hot Pink": "#FF69B4",
  Copper: "#B87333",
  "Dark Beige": "#D8B89E",
  "Dark Fuchsia": "#8C006A",
  "Dark Olive": "#556B2F",
  Kiwi: "#8EE53F",
  Kurkumi: "#F4A300",
  Linen: "#FAF0E6",
  Melon: "#FDBCB4",
  "Of White": "#F8F8FF",
  Petroli: "#1D4459",
  "Rose Gold": "#B76E79",
  Simo: "#9E7B77",
  Tiffany: "#0ABAB5",
  Tutti: "#A2D5C6",
  Vinous: "#9E1B32",
};

const ProductDetails = () => {
  const isRTL = i18n.dir() === "rtl";
  const dispatch = useDispatch();
  const navigate = useRouter();
  const params = useParams();
  const id = params?.id;
  const searchParamsObj = useSearchParams();
  const variantIdFromUrl = searchParamsObj?.get("variantId");
  const [isMobile, setIsMobile] = useState(false);

  // Helper function to check if attribute name represents color
  const isColorAttribute = (attrName) => {
    if (!attrName) return false;
    const lowerName = attrName.toLowerCase();
    return lowerName.includes("color") || lowerName.includes("colour");
  };

  // Helper function to check if attribute name represents size
  const isSizeAttribute = (attrName) => {
    if (!attrName) return false;
    return attrName.toLowerCase().includes("size");
  };
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // You can adjust the breakpoint
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [productData, setProductData] = useState(null); // normalized product object
  const [products, setNewProducts] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  // selection state
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // main image state (use state instead of direct DOM mutation)
  const [mainImage, setMainImage] = useState(null);

  // wishlist map keyed by variantId
  const [wishlistStatus, setWishlistStatus] = useState({});

  // modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const { isUserLoggedIn } = useSelector((state) => ({
    isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
  }));

  // State to track user country for currency display
  const [userCountry, setUserCountry] = useState(() => {
    return localStorage.getItem("country") || "United States";
  });

  // Listen for localStorage changes when currency is updated
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "country") {
        setUserCountry(e.newValue || "United States");
      }
    };

    // Also listen for custom currency change events
    const handleCurrencyChange = () => {
      const newCountry = localStorage.getItem("country") || "United States";
      setUserCountry(newCountry);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("currencyChanged", handleCurrencyChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("currencyChanged", handleCurrencyChange);
    };
  }, []);
  // normalize API response to a consistent product object
  const normalizeResponse = (raw) => {
    // raw could be response.results or response.results.product
    if (!raw) return null;
    // if raw.product exists, prefer it
    if (raw.product) return raw.product;
    // else if raw has product-like keys already, return it
    if (raw.variants || raw.attributes || raw.name_en) return raw;
    // fallback
    return raw;
  };

  const getProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await callMiddleWare({
        method: "GET",
        endpoint: "products/getProductDetails",
        id,
      });

      if (response?.error) {
        throw new Error(
          response?.message || t("Failed to fetch product details"),
        );
      }

      const normalized = normalizeResponse(response?.results);
      if (!normalized) {
        throw new Error(t("Invalid product response"));
      }

      // ensure arrays exist
      normalized.variants = normalized.variants || [];
      normalized.attributes = normalized.attributes || [];

      setProductData(normalized);

      // initialize wishlistStatus from variants if possible
      const initialWishlist = {};
      (normalized.variants || []).forEach((v) => {
        if (v?._id) initialWishlist[v._id] = !!v?.isWishlisted || false;
      });
      setWishlistStatus(initialWishlist);

      // choose an initial variant index:
      let initialVariantIndex = 0;
      let initialColor = null;
      let initialSize = null;

      // If variantId is provided in URL, try to find and select that variant
      if (variantIdFromUrl && normalized.variants.length > 0) {
        const variantIndex = normalized.variants.findIndex(
          (v) => v?._id === variantIdFromUrl,
        );
        if (variantIndex !== -1) {
          initialVariantIndex = variantIndex;
          const selectedVariant = normalized.variants[variantIndex];

          // Extract color and size from the selected variant
          const colorCombination = selectedVariant?.combination?.find((comb) =>
            isColorAttribute(comb?.attributeId?.name_en),
          );
          const sizeCombination = selectedVariant?.combination?.find((comb) =>
            isSizeAttribute(comb?.attributeId?.name_en),
          );

          if (colorCombination?.valueId?._id) {
            initialColor = colorCombination.valueId._id;
          }
          if (sizeCombination?.valueId?._id) {
            initialSize = sizeCombination.valueId._id;
          }
        }
      }

      // If no variantId in URL or variant not found, use default logic
      if (!variantIdFromUrl || initialVariantIndex === 0) {
        // Try to pick variant by availability or default flag
        const availableIndex = normalized.variants.findIndex(
          (v) => v && !v.isDeleted,
        );
        if (availableIndex !== -1) initialVariantIndex = availableIndex;

        // Try to derive initial color and size from attributes if present
        const colorAttr = normalized.attributes.find(
          (a) =>
            a.name_en?.toLowerCase() === "color" ||
            a.name_en?.toLowerCase() === "color",
        );
        const sizeAttr = normalized.attributes.find(
          (a) => a.name_en?.toLowerCase() === "size",
        );

        // If attributes exist, pick first values as defaults
        if (colorAttr && colorAttr.values && colorAttr.values.length > 0) {
          initialColor = colorAttr.values[0]._id;
        } else {
          // fallback: try to pick color from first variant combination
          const v = normalized.variants[initialVariantIndex];
          const c = v?.combination?.find((comb) =>
            isColorAttribute(comb?.attributeId?.name_en),
          );
          if (c?.valueId?._id) initialColor = c.valueId._id;
        }

        if (sizeAttr && sizeAttr.values && sizeAttr.values.length > 0) {
          initialSize = sizeAttr.values[0]._id;
        } else {
          const v = normalized.variants[initialVariantIndex];
          const s = v?.combination?.find((comb) =>
            comb?.attributeId?.name_en?.toLowerCase().includes("size"),
          );
          if (s?.valueId?._id) initialSize = s.valueId._id;
        }
      }

      // Set the selected values
      if (initialColor) setSelectedColor(initialColor);
      if (initialSize) setSelectedSize(initialSize);
      setSelectedVariantIndex(initialVariantIndex);

      // set main image to first image of chosen variant or product thumbnail or fallback
      const chosenVariant = normalized.variants[initialVariantIndex];
      const initialMainImage =
        chosenVariant?.images?.[0]?.url ||
        normalized?.thumbnail ||
        "/assets/img/dummy.jpg";
      setMainImage(initialMainImage);
    } catch (err) {
      console.error(err);
      setError(err?.message || t("Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    getProductDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle variantId from URL after product data is loaded
  useEffect(() => {
    if (!variantIdFromUrl || !productData?.variants) return;

    const variantIndex = productData.variants.findIndex(
      (v) => v?._id === variantIdFromUrl,
    );
    if (variantIndex !== -1) {
      setSelectedVariantIndex(variantIndex);
      const selectedVariant = productData.variants[variantIndex];

      // Extract color and size from the selected variant
      const colorCombination = selectedVariant?.combination?.find((comb) =>
        isColorAttribute(comb?.attributeId?.name_en),
      );
      const sizeCombination = selectedVariant?.combination?.find((comb) =>
        isSizeAttribute(comb?.attributeId?.name_en),
      );

      if (colorCombination?.valueId?._id) {
        setSelectedColor(colorCombination.valueId._id);
      }
      if (sizeCombination?.valueId?._id) {
        setSelectedSize(sizeCombination.valueId._id);
      }

      // Update main image
      if (selectedVariant?.images?.[0]?.url) {
        setMainImage(selectedVariant.images[0].url);
      }
    }
  }, [variantIdFromUrl, productData]);

  const getRecommended = useCallback(async () => {
    const payload = { page: 1, pageSize: 100, productId: id };
    try {
      setLoading(true);
      setError(null);
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "products/getRecomendedAccessories",
        data: payload,
      });
      setNewProducts(response?.results?.products || []);
    } catch (error) {
      console.error("New arrivals fetch error:", error?.message);
      setError(error?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSimilar = useCallback(async () => {
    const payload = { page: 1, pageSize: 100, productId: id };
    try {
      setLoading(true);
      setError(null);
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "products/getSimilarProducts",
        data: payload,
      });
      setSimilar(response?.results?.products || []);
    } catch (error) {
      console.error("New arrivals fetch error:", error?.message);
      setError(error?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getRecommended();
    getSimilar();
  }, [getRecommended, getSimilar]);

  // derive list of color options (either attribute or variants combinations)
  const colorOptions = useMemo(() => {
    if (!productData) return [];
    const attrColor = productData.attributes?.find((a) =>
      isColorAttribute(a.name_en),
    );
    if (attrColor?.values?.length) return attrColor.values;

    // else collect from variants
    const seen = new Map();
    (productData.variants || []).forEach((v) => {
      v?.combination?.forEach((c) => {
        if (isColorAttribute(c?.attributeId?.name_en) && c?.valueId) {
          seen.set(c.valueId._id, c.valueId);
        }
      });
    });
    return Array.from(seen.values());
  }, [productData]);

  const getAvailableSizes = () => {
    if (!productData) return [];
    const attrSize = productData.attributes?.find((a) =>
      isSizeAttribute(a.name_en),
    );
    if (attrSize?.values?.length) return attrSize.values;

    // fallback: extract from variants
    const sizes = [];
    const seen = new Set();
    (productData.variants || []).forEach((variant) => {
      variant.combination?.forEach((comb) => {
        if (isSizeAttribute(comb?.attributeId?.name_en) && comb?.valueId) {
          if (!seen.has(comb.valueId._id)) {
            seen.add(comb.valueId._id);
            sizes.push(comb.valueId);
          }
        }
      });
    });
    return sizes;
  };

  // find variant index given color and/or size
  const findVariantIndex = (colorId, sizeId) => {
    if (!productData?.variants) return -1;
    // prefer match with both
    if (colorId && sizeId) {
      const idx = productData.variants.findIndex((variant) => {
        const hasColor = variant.combination?.some(
          (comb) =>
            isColorAttribute(comb?.attributeId?.name_en) &&
            comb?.valueId?._id === colorId,
        );
        const hasSize = variant.combination?.some(
          (comb) =>
            isSizeAttribute(comb?.attributeId?.name_en) &&
            comb?.valueId?._id === sizeId,
        );
        return hasColor && hasSize;
      });
      if (idx !== -1) return idx;
    }
    // fallback: match color only
    if (colorId) {
      const idx = productData.variants.findIndex((variant) =>
        variant.combination?.some(
          (comb) =>
            isColorAttribute(comb?.attributeId?.name_en) &&
            comb?.valueId?._id === colorId,
        ),
      );
      if (idx !== -1) return idx;
    }
    // fallback: match size only
    if (sizeId) {
      const idx = productData.variants.findIndex((variant) =>
        variant.combination?.some(
          (comb) =>
            isSizeAttribute(comb?.attributeId?.name_en) &&
            comb?.valueId?._id === sizeId,
        ),
      );
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // color selection handler
  const handleColorSelect = (colorId) => {
    setSelectedColor(colorId);
    const idx = findVariantIndex(colorId, selectedSize);
    if (idx !== -1) {
      setSelectedVariantIndex(idx);
      const v = productData.variants[idx];
      setMainImage(v?.images?.[0]?.url || mainImage);
    } else {
      // if no variant found, don't change variant index but update main image if color has an image
      // try to find a variant with that color to show its image (even if size differs)
      const idxColorOnly = findVariantIndex(colorId, null);
      if (idxColorOnly !== -1) {
        setSelectedVariantIndex(idxColorOnly);
        const v = productData.variants[idxColorOnly];
        setMainImage(v?.images?.[0]?.url || mainImage);
      }
    }
  };

  // size selection handler
  const handleSizeSelect = (sizeId) => {
    setSelectedSize(sizeId);
    const idx = findVariantIndex(selectedColor, sizeId);
    if (idx !== -1) {
      setSelectedVariantIndex(idx);
      const v = productData.variants[idx];
      setMainImage(v?.images?.[0]?.url || mainImage);
    } else {
      const idxSizeOnly = findVariantIndex(null, sizeId);
      if (idxSizeOnly !== -1) {
        setSelectedVariantIndex(idxSizeOnly);
        const v = productData.variants[idxSizeOnly];
        setMainImage(v?.images?.[0]?.url || mainImage);
      }
    }
  };

  // share handler (keeps as you wrote)
  const handleShare = async () => {
    const shareData = {
      title: productData?.name_en || t("Product"),
      text: t("Check out this product"),
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share error:", err);
      }
    } else {
      navigator.clipboard?.writeText(shareData.url);
    }
  };

  const addToWishlist = async (productId, variant) => {
    if (!variant || !variant._id) {
      toast.error(t("Invalid variant"));
      return;
    }
    if (!isUserLoggedIn) {
      navigate.push("*");
      return;
    }

    const vid = variant._id;
    // optimistic update
    setWishlistStatus((prev) => ({ ...prev, [vid]: !prev[vid] }));

    try {
      const result = await dispatch(
        wishCart({
          productId: productId,
          variantId: vid,
        }),
      );

      // If async action returns error (depending on your redux thunk shape)
      if (result?.error) {
        // rollback
        setWishlistStatus((prev) => ({ ...prev, [vid]: !prev[vid] }));
        toast.error(result?.message || t("Failed to update wishlist"));
      } else {
        // refresh wishlist count/list if needed
        dispatch(wishListCart());
        // dispatch(getCounts());
        toast.success(
          wishlistStatus[vid]
            ? t("Removed from Wishlist")
            : t("Added to Wishlist"),
        );
      }
    } catch (err) {
      console.error(err);
      setWishlistStatus((prev) => ({ ...prev, [vid]: !prev[vid] }));
      toast.error(t("Failed to update wishlist"));
    }
  };

  const handleRemoveWishlist = async (product, variant) => {
    if (!product?._id || !variant?._id) {
      toast.error(t("Invalid product or variant"));
      return;
    }
    try {
      setWishlistStatus((prev) => ({ ...prev, [variant._id]: false }));
      await dispatch(
        wishCart({
          productId: product._id,
          variantId: variant._id,
        }),
      );
      await dispatch(wishListCart({ page: 1, pageSize: 50 }));
      toast.success(t("Removed from Wishlist"));
    } catch (err) {
      console.error("Remove wishlist error:", err);
      toast.error(t("Failed to remove from wishlist"));
    }
  };

  const formatPrice = (price) => {
    // Map country to currency code
    const countryToCurrencyCode = {
      "Saudi Arabia": "SAR",
      "United States": "USD",
      "United Arab Emirates": "AED",
      Qatar: "QAR",
      Kuwait: "KWD",
      Oman: "OMR",
      "United Kingdom": "GBP",
    };

    const currencyCode = countryToCurrencyCode[userCountry] || "USD";

    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(price);

    // Add space between currency symbol and number
    return formatted.replace(/^([^\d]+)/, "$1 ");
  };

  const handleAddtoCart = async (product, variant) => {
    if (!variant || !variant._id) {
      toast.error(t("Please select a variant"));
      return;
    }
    setAddingToCart(true);
    try {
      const cartItem = {
        productId: product?._id,
        variantId: variant._id,
        quantity: 1,
      };
      await dispatch(addCart(cartItem));
      dispatch(getCounts());
      // dispatch(getCart());
      // toast.success("Added to cart");
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error(err?.message || t("Something went wrong"));
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async (product, variant) => {
    if (!variant || !variant._id) {
      toast.error(t("Please select a variant"));
      return;
    }
    try {
      const cartItem = {
        productId: product?._id,
        variantId: variant._id,
        quantity: 1,
      };
      await dispatch(addCart(cartItem));
      dispatch(getCart());
      dispatch(setScreenState("Address"));
      navigate.push("/cart");
    } catch (err) {
      console.error("Buy now error:", err);
      toast.error(err?.message || t("Something went wrong"));
    }
  };

  // render fallback on error
  // if (error) {
  //   return (
  //     <>
  //       <Header />
  //     <div className="container py-5 text-center">
  //       <h3>{t("Error Loading Product")}</h3>
  //       <p>{error}</p>
  //       <button className="btn btn-dark" onClick={getProductDetails}>
  //         {t("Try Again")}
  //       </button>
  //     </div>
  //     <Footer />
  //   </>
  // );
  // }

  // find currently selected variant safely
  const currentVariant = productData?.variants?.[selectedVariantIndex] || null;

  // Handler for Try On button
  const handleTryOnClick = () => {
    if (!isUserLoggedIn) {
      setShowLoginModal(true);
    } else {
      setShowWarningModal(true);
    }
  };

  return (
    <>
      <Header />
      <div className="py-3">
        <div className="container">
          <nav className="breadcrumb">
            <Link href="/">{t("Home")}</Link>
            <span>/</span>
            <Link href="/Product">{t("Product")}</Link>
            <span>/</span>
            <span className="active">
              {loading
                ? t("Loading...")
                : isRTL
                  ? productData?.categoryId?.[0]?.name_ar ||
                    productData?.name_ar ||
                    t("Product")
                  : productData?.categoryId?.[0]?.name_en ||
                    productData?.name_en ||
                    t("Product")}
            </span>
          </nav>
        </div>
      </div>

      <div className="productdetailspage pt-lg-4 pb-lg-5">
        <div className="container">
          <div className="row">
            {/* Left Column - Product Images */}
            <div className="col-md-6 colleft">
              {loading ? (
                <div className="productshow">
                  <div
                    className="productmainimg skeleton-image"
                    style={{ height: "600px", borderRadius: "8px" }}
                  ></div>
                  <div className="producthumbnail mt-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="thumbnailbox">
                        <div
                          className="skeleton-thumbnail"
                          style={{
                            width: "151px",
                            height: "151px",
                            borderRadius: "8px",
                          }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="productshow">
                  {isMobile ? (
                    <div className="productmainimg">
                      <img
                        id="mainProductImage"
                        src={mainImage || "/assets/img/dummy.jpg"}
                        alt={productData?.name_en || t("Product")}
                      />
                      <a
                        className="favicon"
                        onClick={() =>
                          addToWishlist(productData?._id, currentVariant)
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <img
                          src={
                            currentVariant && wishlistStatus[currentVariant._id]
                              ? "/assets/img/liked.png"
                              : "/assets/img/heart.png"
                          }
                          alt="wishlist"
                          style={{ cursor: "pointer" }}
                        />
                      </a>

                      {productData?.categoryId?.[0]?.name_en ===
                      "Accessories" ? null : (
                        <a
                          className="tryonbtn"
                          onClick={handleTryOnClick}
                          style={{ cursor: "pointer" }}
                        >
                          <img src="/assets/img/tryon.png" alt="Try on" />{" "}
                          {t("Try on")}
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="productmainimg">
                      <div className="h-100 w-fit-content position-relative">
                        <img
                          id="mainProductImage"
                          src={mainImage || "/assets/img/dummy.jpg"}
                          alt={productData?.name_en || t("Product")}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <a
                          className="favicon"
                          onClick={() =>
                            addToWishlist(productData?._id, currentVariant)
                          }
                          style={{ cursor: "pointer" }}
                        >
                          <img
                            src={
                              currentVariant &&
                              wishlistStatus[currentVariant._id]
                                ? "/assets/img/liked.png"
                                : "/assets/img/heart.png"
                            }
                            alt="wishlist"
                            style={{ cursor: "pointer" }}
                          />
                        </a>

                        {productData?.categoryId?.[0]?.name_en ===
                        "Accessories" ? null : (
                          <a
                            className="tryonbtn"
                            onClick={handleTryOnClick}
                            style={{ cursor: "pointer" }}
                          >
                            <img src="/assets/img/tryon.png" alt="Try on" />{" "}
                            {t("Try on")}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {currentVariant?.images?.length > 1 && (
                    <div className="producthumbnail">
                      {currentVariant.images.map((image, index) => (
                        <div key={index} className="thumbnailbox">
                          <img
                            src={image.url}
                            alt={t("Thumbnail") + ` ${index + 1}`}
                            onClick={() => setMainImage(image.url)}
                            style={{
                              cursor: "pointer",
                              width: "151px",
                              height: "151px",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Product Info */}
            <div className="col-md-6 colright">
              {loading ? (
                <div className="productright">
                  <div className="productdetilstop mb-4">
                    <div
                      className="skeleton-line"
                      style={{
                        width: "30%",
                        height: "16px",
                        marginBottom: "12px",
                      }}
                    ></div>
                    <div
                      className="skeleton-line"
                      style={{
                        width: "70%",
                        height: "28px",
                        marginBottom: "12px",
                      }}
                    ></div>
                    <div
                      className="skeleton-line"
                      style={{
                        width: "40%",
                        height: "32px",
                        marginBottom: "20px",
                      }}
                    ></div>
                  </div>

                  <div className="productdetilmid mb-4">
                    {/* Color skeleton */}
                    <div className="mb-3 border-bottom pb-3">
                      <div
                        className="skeleton-line"
                        style={{
                          width: "25%",
                          height: "18px",
                          marginBottom: "12px",
                        }}
                      ></div>
                      <div className="d-flex gap-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="skeleton-circle"
                            style={{
                              width: "35px",
                              height: "35px",
                              borderRadius: "50%",
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>

                    {/* Size skeleton */}
                    <div className="mb-3">
                      <div
                        className="skeleton-line"
                        style={{
                          width: "25%",
                          height: "18px",
                          marginBottom: "12px",
                        }}
                      ></div>
                      <div className="d-flex gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="skeleton-line"
                            style={{
                              width: "50px",
                              height: "40px",
                              borderRadius: "4px",
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>

                    {/* Buttons skeleton */}
                    <div className="row mt-4">
                      <div className="col-md-6 mb-md-0 mb-3">
                        <div
                          className="skeleton-line"
                          style={{
                            width: "100%",
                            height: "50px",
                            borderRadius: "4px",
                          }}
                        ></div>
                      </div>
                      <div className="col-md-6">
                        <div
                          className="skeleton-line"
                          style={{
                            width: "100%",
                            height: "50px",
                            borderRadius: "4px",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Accordions skeleton */}
                  <div className="productdetbottom">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="mb-3">
                        <div
                          className="skeleton-line"
                          style={{
                            width: "100%",
                            height: "50px",
                            borderRadius: "4px",
                          }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="productright">
                  <div className="productdetilstop">
                    <div className="row align-items-center">
                      <div className="col">
                        <div className="sku mb-1">
                          {t("SKU#")}: {productData?.productId || t("N/A")}
                        </div>
                        <div className="prdtnamee mb-1">
                          {isRTL
                            ? productData?.name_ar
                            : productData?.name_en || t("Product Name")}
                        </div>
                        <div className="prdtpriceee">
                          {currentVariant?.discountPrice ? (
                            <>
                              <span className="original-price text-muted text-decoration-line-through me-2">
                                {formatPrice(currentVariant.price || 0)}
                                {console.log(
                                  formatPrice(currentVariant.price || 0),
                                  "original price",
                                )}
                              </span>
                              <span className="discounted-price text-danger fw-bold ">
                                {formatPrice(
                                  currentVariant.totalPrice ||
                                    currentVariant.price ||
                                    0,
                                )}
                              </span>
                              {/* {
                                currentVariant.discountPercentage && (
                                  <span className="discount-percentage text-success ms-2">
                                    ({Math.round(currentVariant.discountPercentage || 0)}% {t("OFF")})
                                  </span>
                                )
                              } */}
                            </>
                          ) : (
                            formatPrice(
                              currentVariant?.price || productData?.price || 0,
                            )
                          )}
                        </div>
                      </div>
                      <div className="col-auto">
                        <a
                          onClick={async () => {
                            try {
                              // Build product-specific URL safely
                              const productUrl = `${window.location.origin}/Product/${productData?._id}`;
                              console.log(productUrl);
                              if (navigator.share) {
                                await navigator.share({
                                  title: isRTL
                                    ? productData?.name_ar
                                    : productData?.name_en || "Product",
                                  text: isRTL
                                    ? productData?.description_ar
                                    : productData?.description_en || "",
                                  url: productUrl,
                                });
                              } else if (navigator.clipboard) {
                                await navigator.clipboard.writeText(productUrl);
                                toast.success(t("link_code"));
                              } else {
                                // Fallback method for older browsers
                                const textArea =
                                  document.createElement("textarea");
                                textArea.value = productUrl;
                                document.body.appendChild(textArea);
                                textArea.select();
                                document.execCommand("copy");
                                document.body.removeChild(textArea);
                                toast.success(t("link_code"));
                              }
                            } catch (err) {
                              console.error("Share error:", err);
                              toast.error(t("unable_to_copy"));
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <img src="/assets/img/upload.png" alt={t("Share")} />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="productdetilmid mb-4">
                    <div className="row mb-4">
                      <div className="col-md-12 mb-0">
                        <div className="row addtocartmodalmain">
                          {/* Color Selection */}
                          {colorOptions?.length > 0 && (
                            <div className="col-md-12 mb-3 border-bottom pb-3">
                              <div className="row">
                                <div className="col-md-12 mb-2">
                                  <div className="cartoptionhead">
                                    {t("Select Color")}:{" "}
                                    {colorOptions.find(
                                      (color) => color._id === selectedColor,
                                    )?.name_en || t("Select a color")}
                                  </div>
                                </div>
                                <div className="col-md-12">
                                  <div
                                    className="row flex-nowrap px-2"
                                    style={{ overflowX: "inherit" }}
                                  >
                                    {colorOptions.map((color) => {
                                      const bgColor =
                                        COLOUR_MAP[color.name_en] ||
                                        color.color_code ||
                                        null;
                                      const colorImage = color.image?.url;
                                      return (
                                        <div
                                          key={color._id}
                                          className="col-auto px-1"
                                        >
                                          <button
                                            className={`cartcolor ${selectedColor === color._id ? "active" : ""}`}
                                            style={{
                                              backgroundColor:
                                                !bgColor && !colorImage
                                                  ? "#CCCCCC"
                                                  : undefined,
                                              border:
                                                selectedColor === color._id
                                                  ? "2px solid #000"
                                                  : "1px solid #ddd",
                                              width: "35px",
                                              height: "35px",
                                              borderRadius: "50%",
                                              padding: 0,
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              overflow: "hidden",
                                            }}
                                            onClick={() =>
                                              handleColorSelect(color._id)
                                            }
                                            title={color.name_en}
                                          >
                                            {bgColor ? (
                                              <div
                                                style={{
                                                  width: "100%",
                                                  height: "100%",
                                                  backgroundColor: bgColor,
                                                }}
                                              />
                                            ) : colorImage ? (
                                              <img
                                                src={colorImage}
                                                alt={color.name_en}
                                                style={{
                                                  width: "100%",
                                                  height: "100%",
                                                  objectFit: "cover",
                                                }}
                                              />
                                            ) : (
                                              <div
                                                style={{
                                                  width: "100%",
                                                  height: "100%",
                                                  backgroundColor: "#CCC",
                                                }}
                                              />
                                            )}
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Size Selection */}
                          <div className="col-md-12 mb-3">
                            <div className="row">
                              {productData?.sizeChart && (
                                <div className="col-md-12 mb-2 d-flex align-items-center justify-content-between">
                                  <div className="cartoptionhead">
                                    {t("Select Size")}
                                  </div>
                                  <a
                                    className="sizeguide"
                                    href="#!"
                                    data-bs-toggle="modal"
                                    data-bs-target="#sizeguide"
                                  >
                                    {t("Size Guide")}
                                  </a>
                                </div>
                              )}
                              <div className="col-md-12">
                                <div
                                  className="row flex-nowrap px-2"
                                  style={{ overflowX: "auto" }}
                                >
                                  {getAvailableSizes().map((size) => (
                                    <div
                                      key={size._id}
                                      className="col-auto px-1"
                                    >
                                      <button
                                        className={`selectsizee ${selectedSize === size._id ? "active" : ""}`}
                                        onClick={() =>
                                          handleSizeSelect(size._id)
                                        }
                                      >
                                        {size.name_en}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-md-0 mb-3">
                        <button
                          className="authbtns1 w-100"
                          onClick={() =>
                            handleBuyNow(productData, currentVariant)
                          }
                        >
                          {t("BUY NOW")}
                        </button>
                      </div>
                      <div className="col-md-6">
                        <button
                          className="authbtns2 w-100"
                          onClick={() =>
                            handleAddtoCart(productData, currentVariant)
                          }
                          disabled={addingToCart}
                          style={{
                            opacity: addingToCart ? 0.7 : 1,
                            cursor: addingToCart ? "not-allowed" : "pointer",
                          }}
                        >
                          {addingToCart ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              {t("ADDING...")}
                            </>
                          ) : (
                            t("ADD TO CART")
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="productdetbottom">
                    <div className="accordion" id="accordionExample">
                      <div className="accordion-item mb-3">
                        <h2 className="accordion-header" id="headingOne">
                          <button
                            className="accordion-button"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseOne"
                            aria-expanded="true"
                            aria-controls="collapseOne"
                          >
                            {t("Product Details")}
                          </button>
                        </h2>
                        <div
                          id="collapseOne"
                          className="accordion-collapse collapse show"
                          aria-labelledby="headingOne"
                          data-bs-parent="#accordionExample"
                        >
                          <div className="accordion-body">
                            {productData?.categoryId &&
                              productData.categoryId.length > 0 && (
                                <div className="d-flex justify-content-between pb-2">
                                  <span>{t("Category")}</span>
                                  <span>
                                    {isRTL
                                      ? productData.categoryId[0].name_ar
                                      : productData.categoryId[0].name_en}
                                  </span>
                                </div>
                              )}
                            {productData?.brandId && (
                              <div className="d-flex justify-content-between pb-2">
                                <span>{t("Brand")}</span>
                                <span>
                                  {isRTL
                                    ? productData.brandId?.name_ar
                                    : productData.brandId?.name_en ||
                                      t("General")}
                                </span>
                              </div>
                            )}
                            {productData?.origin && (
                              <div className="d-flex justify-content-between pb-0">
                                <span>{t("Origin")}</span>
                                <span>{productData.origin}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="accordion-item mb-3">
                        <h2 className="accordion-header" id="headingTwo">
                          <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseTwo"
                            aria-expanded="false"
                            aria-controls="collapseTwo"
                          >
                            {t("Description")}
                          </button>
                        </h2>
                        <div
                          id="collapseTwo"
                          className="accordion-collapse collapse"
                          aria-labelledby="headingTwo"
                          data-bs-parent="#accordionExample"
                        >
                          <div className="accordion-body">
                            <p>
                              {isRTL
                                ? productData?.description_ar
                                : productData?.description_en ||
                                  t("No description available.")}
                            </p>
                          </div>
                        </div>
                      </div>

                      {productData?.specifications_en && (
                        <div className="accordion-item mb-3">
                          <h2 className="accordion-header" id="headingThree">
                            <button
                              className="accordion-button collapsed"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target="#collapseThree"
                              aria-expanded="false"
                              aria-controls="collapseThree"
                            >
                              {t("Specifications")}
                            </button>
                          </h2>
                          <div
                            id="collapseThree"
                            className="accordion-collapse collapse"
                            aria-labelledby="headingThree"
                            data-bs-parent="#accordionExample"
                          >
                            <div className="accordion-body">
                              <p>
                                {isRTL
                                  ? productData.specifications_ar
                                  : productData.specifications_en}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended lists */}
      {products?.length > 0 && (
        <div className="similarproduct pt-5 pb-lg-4">
          <div className="container pb-4">
            <div className="row">
              <div className="col-md-12 mb-4">
                <div className="similarproducthead">
                  {t("Recommended Accessories")}
                </div>
              </div>
              <div className="col-md-12">
                <div className="row">
                  <Products
                    products={products}
                    loading={loading}
                    classType={"col-medium"}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {similar?.length > 0 && (
        <div className="similarproduct py-5">
          <div className="container pb-4">
            <div className="row">
              <div className="col-md-12 mb-4">
                <div className="similarproducthead">
                  {t("Customer Also Viewed")}
                </div>
              </div>
              <div className="col-md-12">
                <div className="row">
                  <Products
                    products={similar}
                    loading={loading}
                    classType={"col-medium"}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Size guide modal (unchanged) */}
      <div
        className="modal fade sizeguidemodal addtocartmodal"
        id="sizeguide"
        tabIndex={-1}
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body position-relative">
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label={t("Close")}
              />
              <div className="row pt-3">
                <div className="col-md-12">
                  <div className="tryonimg">
                    <img src={productData?.sizeChart} alt="" />
                  </div>
                </div>
                {/* <div className="col-md-12 mb-2 text-center">
                  <div className="noteee">*{t("Please note the measurements may vary according to different brands and style.")}</div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <>
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowLoginModal(false)}
          ></div>
          <div
            className="modal fade commanmodal show"
            style={{ display: "block" }}
            tabIndex={-1}
            aria-labelledby="loginModalLabel"
            aria-hidden="false"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-body position-relative">
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowLoginModal(false)}
                    aria-label={t("Close")}
                  />
                  <div className="row">
                    <div className="col-md-12">
                      <div className="commanmodaltop">
                        <img src="/assets/img/login-icon.png" alt="" />
                        <h2>{t("Login Required")}</h2>
                        <p>
                          {t("You need to log in to use the Try On feature.")}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-12 mt-4 text-center">
                      <a
                        className="authbtns1"
                        onClick={() => {
                          setShowLoginModal(false);
                          navigate("/Authentication");
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {t("LOGIN")}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Warning modal (Try on) */}
      {showWarningModal && (
        <>
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowWarningModal(false)}
          ></div>
          <div
            className="modal fade commanmodal show"
            style={{ display: "block" }}
            tabIndex={-1}
            aria-labelledby="exampleModalLabel"
            aria-hidden="false"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-body position-relative">
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowWarningModal(false)}
                    aria-label={t("Close")}
                  />
                  <div className="row">
                    <div className="col-md-12">
                      <div className="commanmodaltop">
                        <img src="/assets/img/warnning.png" alt="" />
                        <h2>{t("Warning")}</h2>
                        <p>
                          {t(
                            "This feature lets you preview clothes on a virtual model for a better shopping experience.",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-12 mt-4 text-center">
                      <a
                        className="authbtns1"
                        onClick={() => {
                          setShowWarningModal(false);
                          navigate(`/Product/TryOn/${id}`);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {t("OKAY")}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <Chatbot />
      <Footer />

      {/* Styles kept from your original file */}
      <style>{`
        .skeleton-image, .skeleton-thumbnail, .skeleton-line, .skeleton-circle {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }
        
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .skeleton-circle { border-radius: 50% !important; }
        .cartcolor.active { border: 2px solid #000 !important; transform: scale(1.05); }
        .selectsizee.active { background-color: #000; color: #fff; }
      `}</style>
    </>
  );
};

export default ProductDetails;
