"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  useRef,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  addCart,
  getCart,
  getCounts,
  setScreenState,
  wishCart,
  wishListCart,
} from "@/store/serviceSlices/commonSlice";
import i18next, { t } from "i18next";
import { COLOUR_MAP } from "./color";
import { formatDescription } from "@/common/commonUtils";
import Loading from "@/common/Loading.jsx";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useTranslation } from "react-i18next";

const Products = memo(
  ({
    classType,
    products,
    loading,
    isMobile,
    cardDetails,
    isWishList = false,
  }) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const { t } = useTranslation();
    const [wishlistStatus, setWishlistStatus] = useState({});
    const [loadingCartItems, setLoadingCartItems] = useState({});
    const [loadingWishlistItems, setLoadingWishlistItems] = useState({});
    const [loadingBuyNowItems, setLoadingBuyNowItems] = useState({});
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedVariants, setSelectedVariants] = useState({});
    const [hoveredProduct, setHoveredProduct] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState({});

    const [mobileModal, setMobileModal] = useState(false);

    const { isUserLoggedIn, isLoading } = useSelector((state) => ({
      isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
      isLoading: state?.commonSlice?.isLoading,
    }));

    useEffect(() => {
      if (isMobile) {
        console.log("is mobile true", isMobile);
      }
    }, [isMobile]);
    // State to track user country for re-rendering when currency changes
    const [userCountry, setUserCountry] = useState(() => {
      return localStorage.getItem("country") || "United States";
    });

    // Listen for localStorage changes when currency is updated
    useEffect(() => {
      const handleStorageChange = (e) => {
        if (e.key === "userCountry") {
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

    const isArabic = i18next.language?.startsWith("ar");

    const getTagText = (product) => {
      if (!product?.tags?.length) return "";

      const isArabic = i18next.language?.startsWith("ar");

      return product.tags
        .map((item) => (isArabic ? item?.name_ar : item?.name_en))
        .filter(Boolean)
        .join(", ");
    };

    // Helper function to get currency symbol based on country
    const getCurrencySymbol = useCallback((country) => {
      const currencySymbols = {
        "Saudi Arabia": "SAR",
        "United States": "$",
        "United Arab Emirates": "AED",
        Qatar: "QAR",
        Kuwait: "KWD",
        Oman: "OMR",
        "United Kingdom": "£",
      };
      return currencySymbols[country] || "$";
    }, []);

    const getAvailableColors = useCallback((product) => {
      // console.log(product, "----product-----");
      const variants =
        product?.variants &&
        Array.isArray(product.variants) &&
        product.variants.length > 0
          ? product.variants
          : product?.variant
            ? [product.variant]
            : [];

      if (!variants.length) return [];

      const uniqueColorMap = new Map();

      variants.forEach((variant) => {
        (variant?.combination || []).forEach((combo) => {
          const attrName = combo?.attributeId?.name_en?.toLowerCase();

          if (attrName === "color" || attrName === "colour") {
            const value = combo?.valueId;
            const valId = value?._id;

            if (value && !uniqueColorMap.has(valId)) {
              uniqueColorMap.set(valId, {
                name: value.name_en,
                valueId: valId,
                color_code: value.color_code,
                image: value.image,
                combination: combo,
              });
            }
          }
        });
      });

      return Array.from(uniqueColorMap.values());
    }, []);

    // Memoized function to get available sizes for selected color
    const getAvailableSizes = useCallback((product, selectedColor) => {
      // Prioritize variants (plural) array over variant (singular) to get all sizes
      // For wishlist items, use product.variant (singular) only if variants array doesn't exist
      const variants =
        product?.variants &&
        Array.isArray(product.variants) &&
        product.variants.length > 0
          ? product.variants
          : product?.variant
            ? [product.variant]
            : [];

      if (!variants || variants.length === 0) return [];

      if (!selectedColor) {
        // If no color selected, return all unique sizes
        const allSizes = variants
          .map((variant) => {
            if (!variant?.combination || !Array.isArray(variant?.combination))
              return null;
            const sizeCombination = variant?.combination?.find(
              (comb) =>
                comb?.attributeId?.name_en &&
                comb.attributeId.name_en.toLowerCase() === "size",
            );

            // console.log(variants, "--sizeCombination--", sizeCombination);

            return sizeCombination && sizeCombination?.valueId
              ? {
                  name: sizeCombination?.valueId.name_en,
                  valueId: sizeCombination?.valueId._id,
                  variant: variant,
                  combination: sizeCombination,
                }
              : null;
          })
          .filter(Boolean);

        return [...new Map(allSizes.map((item) => [item.name, item])).values()];
      }

      // If color selected, return sizes for that color only
      const sizes = variants
        .filter((variant) => {
          if (!variant?.combination || !Array.isArray(variant.combination))
            return false;
          const colorCombination = variant.combination.find(
            (comb) =>
              comb?.attributeId?.name_en &&
              (comb.attributeId.name_en.toLowerCase() === "color" ||
                comb.attributeId.name_en.toLowerCase() === "colour"),
          );
          return colorCombination?.valueId?.name_en === selectedColor;
        })
        .map((variant) => {
          if (!variant?.combination || !Array.isArray(variant.combination))
            return null;
          const sizeCombination = variant.combination.find(
            (comb) =>
              comb?.attributeId?.name_en &&
              comb.attributeId.name_en.toLowerCase() === "size",
          );
          return sizeCombination && sizeCombination.valueId
            ? {
                name: sizeCombination.valueId.name_en,
                valueId: sizeCombination.valueId._id,
                variant: variant,
                combination: sizeCombination,
              }
            : null;
        })
        .filter(Boolean);

      return [...new Map(sizes.map((item) => [item.name, item])).values()];
    }, []);

    // Get first available variant based on selections
    const getFirstAvailableVariant = (product, selectedColor, selectedSize) => {
      // Prioritize variants (plural) array over variant (singular) to get all variants
      // For wishlist items, use product.variant (singular) only if variants array doesn't exist
      const variants =
        product?.variants &&
        Array.isArray(product.variants) &&
        product.variants.length > 0
          ? product.variants
          : product?.variant
            ? [product.variant]
            : [];

      if (!variants || variants.length === 0) return null;

      // If both color and size are selected, find exact match
      if (selectedColor && selectedSize) {
        const exactVariant = variants.find((variant) => {
          if (!variant?.combination || !Array.isArray(variant.combination))
            return false;
          const hasColor = variant.combination.some(
            (comb) =>
              comb?.attributeId?.name_en &&
              (comb.attributeId.name_en.toLowerCase() === "color" ||
                comb.attributeId.name_en.toLowerCase() === "colour") &&
              comb.valueId?.name_en === selectedColor,
          );
          const hasSize = variant.combination.some(
            (comb) =>
              comb?.attributeId?.name_en &&
              comb.attributeId.name_en.toLowerCase() === "size" &&
              comb.valueId?.name_en === selectedSize,
          );
          return hasColor && hasSize;
        });
        if (exactVariant) return exactVariant;
      }

      // If only color is selected, return first variant with that color
      if (selectedColor) {
        const colorVariant = variants.find((variant) => {
          if (!variant?.combination || !Array.isArray(variant.combination))
            return false;
          const hasColor = variant.combination.some(
            (comb) =>
              comb?.attributeId?.name_en &&
              (comb.attributeId.name_en.toLowerCase() === "color" ||
                comb.attributeId.name_en.toLowerCase() === "colour") &&
              comb.valueId?.name_en === selectedColor,
          );
          return hasColor;
        });
        if (colorVariant) return colorVariant;
      }

      // If only size is selected, return first variant with that size
      if (selectedSize) {
        const sizeVariant = variants.find((variant) => {
          if (!variant?.combination || !Array.isArray(variant.combination))
            return false;
          const hasSize = variant.combination.some(
            (comb) =>
              comb?.attributeId?.name_en &&
              comb.attributeId.name_en.toLowerCase() === "size" &&
              comb.valueId?.name_en === selectedSize,
          );
          return hasSize;
        });
        if (sizeVariant) return sizeVariant;
      }

      // If no selection, return first available variant
      return variants.length > 0 ? variants[0] : null;
    };

    // Memoized color selection handler
    const handleColorSelect = useCallback(
      (productId, color, product) => {
        const availableSizes = getAvailableSizes(product, color);
        const selectedVariant = getFirstAvailableVariant(product, color, null);

        setSelectedVariants((prev) => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            selectedColor: color,
            selectedSize:
              availableSizes.length > 0 ? availableSizes[0].name : null,
            selectedVariant: selectedVariant,
          },
        }));
      },
      [getAvailableSizes],
    );

    // Memoized size selection handler
    const handleSizeSelect = useCallback(
      (productId, size, product, selectedColor) => {
        const selectedVariant = getFirstAvailableVariant(
          product,
          selectedColor,
          size,
        );

        setSelectedVariants((prev) => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            selectedSize: size,
            selectedVariant: selectedVariant,
          },
        }));
      },
      [],
    );

    const handleAddtoCart = async (product, variant = null) => {
      // For wishlist items, we need to extract the correct IDs
      const isWishlistPage = location?.pathname.startsWith("/MyWishlists");

      let productId, finalVariant, actualProduct;

      if (isWishlistPage) {
        // For wishlist items: product has structure { productId: {...}, variant: {...} }
        productId = product?.productId?._id;
        finalVariant = variant || product?.variant;
        actualProduct = product; // Keep the original product object for removal
      } else {
        // For regular products
        productId = product?._id;
        const selectedVariant = selectedVariants[productId];
        finalVariant = variant || selectedVariant?.selectedVariant;

        // If no variant selected, try to get first available variant
        if (!finalVariant && product?.variants && product.variants.length > 0) {
          finalVariant = product.variants[0];
        }
        actualProduct = product;
      }

      if (!finalVariant || !finalVariant._id) {
        toast.error(t("No variants available for this product"));
        return;
      }

      const itemId = finalVariant._id;

      try {
        setLoadingCartItems((prev) => ({ ...prev, [itemId]: true }));

        const cartItem = isWishlistPage
          ? {
              productId: product?.productId?._id,
              variantId: finalVariant._id,
              quantity: 1,
            }
          : {
              productId: productId,
              variantId: finalVariant._id,
              quantity: 1,
            };

        await dispatch(addCart(cartItem));
        dispatch(setScreenState("Cart"));
        // dispatch(getCart());
        dispatch(getCounts());

        // If on wishlist page, remove from wishlist after adding to cart
        if (isWishlistPage) {
          // Pass the correct product and variant objects for removal
          await handleRemoveWishlist(actualProduct, finalVariant);
        }
      } catch (error) {
        console.error("Add to cart error:", error);
        toast.error(error?.message || t("Something went wrong"));
      } finally {
        setLoadingCartItems((prev) => ({ ...prev, [itemId]: false }));
      }
    };

    // Handle Buy Now functionality
    const handleBuyNow = async (product, variant = null) => {
      const productId = product?._id || product?.productId?._id;
      const selectedVariant = selectedVariants[productId];

      // Use passed variant if available, otherwise use selected variant, otherwise use first available variant
      let finalVariant = variant || selectedVariant?.selectedVariant;

      // If no variant selected, try to get first available variant
      if (!finalVariant && product?.variants && product.variants.length > 0) {
        finalVariant = product.variants[0];
      }

      if (!finalVariant || !finalVariant._id) {
        toast.error(t("No variants available for this product"));
        return;
      }

      const itemId = finalVariant._id;

      try {
        setLoadingBuyNowItems((prev) => ({ ...prev, [itemId]: true }));

        const cartItem = location?.pathname.startsWith("/MyWishlists")
          ? {
              productId: product?.productId?._id,
              variantId: finalVariant._id,
              quantity: 1,
              isBuyNow: true,
            }
          : {
              productId: productId,
              variantId: finalVariant._id,
              quantity: 1,
              isBuyNow: true,
            };

        // Add to cart first
        await dispatch(addCart(cartItem));
        // dispatch(setScreenState("Cart"));
        await dispatch(getCart(true));

        dispatch(setScreenState("Address"));
        // Then navigate to cart page
        navigate("/Cart");

        // If on wishlist page, remove from wishlist after adding to cart
        if (location?.pathname.startsWith("/MyWishlists")) {
          await handleRemoveWishlist(product, finalVariant);
        }
      } catch (error) {
        console.error("Buy Now error:", error);
        toast.error(error?.message || t("Something went wrong"));
      } finally {
        setLoadingBuyNowItems((prev) => ({ ...prev, [itemId]: false }));
      }
    };

    // Check if product has any variants available
    const hasAvailableVariants = (product) => {
      // For wishlist items, check product.variant (singular)
      // For regular products, check product.variants (plural)
      return (
        (product?.variant && Object.keys(product.variant).length > 0) ||
        (product?.variants && product.variants.length > 0)
      );
    };

    const getProductData = (item) => {
      if (item?.productId && item?.variant) {
        return { product: item.productId, variant: item.variant };
      }
      if (Array.isArray(item?.variants) && item.variants.length > 0) {
        return { product: item, variant: item.variants[0] };
      }
      if (item?.variant) {
        return { product: item, variant: item.variant };
      }
      return { product: item, variant: null };
    };

    const handleRemoveWishlist = async (product, variant) => {
      // Handle different product structures
      let productId, variantId;

      if (location?.pathname.startsWith("/MyWishlists")) {
        // For wishlist items: product has structure { productId: {...}, variant: {...} }
        productId = product?.productId?._id;
        variantId = variant?._id;
      } else {
        // For regular products
        productId = product?._id;
        variantId = variant?._id;
      }

      if (!productId || !variantId) {
        console.error("Invalid IDs for removal:", {
          productId,
          variantId,
          product,
          variant,
        });
        toast.error(t("Invalid product or variant"));
        return;
      }

      try {
        setLoadingWishlistItems((prev) => ({ ...prev, [variantId]: true }));

        setWishlistStatus((prev) => ({
          ...prev,
          [variantId]: false,
        }));

        await dispatch(
          wishCart({
            productId: productId,
            variantId: variantId,
          }),
        );

        const payload = { page: 1, pageSize: 50 };
        await dispatch(wishListCart({ payload }));

        // toast.success(t("Removed from Wishlist"));
      } catch (error) {
        console.error("Remove wishlist error:", error);
        toast.error(t("Failed to remove from Wishlist"));
      } finally {
        setLoadingWishlistItems((prev) => ({ ...prev, [variantId]: false }));
      }
    };

    // Memoized product list computation
    const productList = useMemo(
      () => products?.products || products?.wishList || products || [],
      [products],
    );

    const SmallLoader = () => (
      <div className="small-loader">
        <div className="spinner"></div>
      </div>
    );

    const SmallWishlistLoader = () => (
      <div className="small-loader wishlist-loader">
        <div className="spinner"></div>
      </div>
    );

    // Handler functions for image slider
    const handleMouseEnter = (productId) => {
      setHoveredProduct(productId);
      setCurrentImageIndex((prev) => ({ ...prev, [productId]: 0 }));
    };

    const handleMouseLeave = () => {
      setHoveredProduct(null);
    };

    const handleImageNavigation = (productId, direction, totalImages) => {
      setCurrentImageIndex((prev) => {
        const current = prev[productId] || 0;
        let newIndex;

        if (direction === "next") {
          newIndex = (current + 1) % totalImages;
        } else {
          newIndex = current === 0 ? totalImages - 1 : current - 1;
        }

        return { ...prev, [productId]: newIndex };
      });
    };

    const handleDotClick = (productId, index) => {
      setCurrentImageIndex((prev) => ({ ...prev, [productId]: index }));
    };

    const addToWishlist = async (product, variant) => {
      if (!variant || !variant._id) {
        toast.error(t("Invalid variant"));
        return;
      }

      const itemId = variant._id;

      try {
        if (isUserLoggedIn) {
          setLoadingWishlistItems((prev) => ({ ...prev, [itemId]: true }));

          setWishlistStatus((prev) => ({
            ...prev,
            [variant._id]: !prev[variant._id],
          }));

          const result = await dispatch(
            wishCart({
              productId: product,
              variantId: variant._id,
            }),
          );
          dispatch(wishListCart());
          // dispatch(getCounts());
          if (result?.error) {
            setWishlistStatus((prev) => ({
              ...prev,
              [variant._id]: !prev[variant._id],
            }));
            toast.error(result?.message || t("Failed to update wishlist"));
          } else {
            toast.success(
              wishlistStatus[variant._id]
                ? t("Removed from Wishlist")
                : t("Added to Wishlist"),
            );
          }
        } else {
          navigate("*");
        }
      } catch (error) {
        console.error(error?.message);
        toast.error(t("Failed to update wishlist"));
      } finally {
        setLoadingWishlistItems((prev) => ({ ...prev, [itemId]: false }));
      }
    };

    // Skeleton Card Component
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

    const settings = {
      // infinite: true,
      // slidesToShow: 1.5,
      // slidesToScroll: 1,
      // arrows: true,
      // dots: false,
      // autoplay: true,
      // autoplaySpeed: 3000,

      infinite: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 3000,
      arrows: true,
      dots: false,
      centerMode: true,
      centerPadding: "40px",
    };

    // Show full-screen loader when any cart/buy-now/wishlist operation is in progress
    const isAnyCartLoading =
      Object.values(loadingCartItems).some(Boolean) ||
      Object.values(loadingBuyNowItems).some(Boolean) ||
      Object.values(loadingWishlistItems).some(Boolean);

    return (
      <>
        {isAnyCartLoading && <Loading />}
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              className={
                classType === "col-medium"
                  ? "col-6 px-2 col-sm-4 col-md-3 col-lg-3 py-3"
                  : classType === "col-large"
                    ? "col-6 px-2 col-sm-4 col-md-3 col-lg-3 mb-4"
                    : classType === "col-small"
                      ? "col-6 px-2 col-md-4 col-lg-3 mb-4"
                      : "col-6 px-2 col-md-4 col-lg-3 mb-4"
              }
              key={i}
            >
              <SkeletonCard />
            </div>
          ))
        ) : !productList || productList.length === 0 ? (
          <div className="col-12 text-center py-5">
            <h4 className="text-muted">{t("products.messages.noProducts")}</h4>
          </div>
        ) : isMobile ? (
          <Slider {...settings}>
            {productList.map((item, index) => {
              const { product, variant } = getProductData(item);
              const productId = product?._id || item?._id;
              // Use unique key for carousel to prevent cross-variant interference in wishlist
              const carouselKey = isWishList
                ? variant?._id || item?._id || productId
                : productId;
              const selectedVariant = selectedVariants[productId] || {};

              // Get images: for wishlist show variant images first, otherwise product images first
              const variantImages = isWishList
                ? variant?.images?.length > 0
                  ? variant.images
                  : product?.images?.length > 0
                    ? product.images
                    : []
                : product?.images?.length > 0
                  ? product.images
                  : item?.images?.length > 0
                    ? item.images
                    : variant?.images?.length > 0
                      ? variant.images
                      : [];
              const currentImgIndex = currentImageIndex[carouselKey] || 0;
              const displayImage =
                hoveredProduct === carouselKey && variantImages.length > 0
                  ? variantImages[currentImgIndex]?.url
                  : variantImages[0]?.url || "/assets/img/dummy.jpg";

              const imageUrl = displayImage;

              // Check isAddedInWishList from multiple sources:
              // 1. variant returned by getProductData
              // 2. item.variant directly (in case getProductData returned from variants array)
              // 3. Any variant in the variants array that has isAddedInWishList === true
              // 4. product.wishlists array
              // 5. local wishlistStatus state
              const hasWishlistedVariant =
                Array.isArray(item?.variants) &&
                item.variants.some((v) => v?.isAddedInWishList === true);

              const isWishlisted =
                variant?.isAddedInWishList === true ||
                item?.variant?.isAddedInWishList === true ||
                hasWishlistedVariant ||
                wishlistStatus[variant?._id] === true;

              const isAddingToCart = loadingCartItems[variant?._id] || false;
              const isWishlistLoading =
                loadingWishlistItems[variant?._id] || false;
              const isBuyNowLoading =
                loadingBuyNowItems[selectedVariant.selectedVariant?._id] ||
                loadingBuyNowItems[item.variants?.[0]?._id] ||
                false;

              // Get available colors and sizes
              const availableColors = getAvailableColors(item);
              const availableSizes = getAvailableSizes(
                item,
                selectedVariant.selectedColor,
              );
              const hasVariants = hasAvailableVariants(item);

              return (
                <div
                  className="product-comman-wrapper mobile-products-card px-2"
                  key={`${carouselKey}-${index}`}
                >
                  <div className="productcomman">
                    {/* <div className="productType">{getTagText(item)}</div> */}
                    <div
                      className="productcommanimg mb-2"
                      onMouseEnter={() => handleMouseEnter(carouselKey)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <Link href={`/Product/${productId}`}>
                        <img
                          src={imageUrl}
                          alt={product?.name_en || item?.name_en}
                          loading="lazy"
                          decoding="async"
                          style={{
                            maxWidth: "100%",
                            height: "100%",
                            transition: "opacity 0.3s ease",
                          }}
                        />
                      </Link>

                      {/* Image Navigation Controls - Show on hover if multiple images */}
                      {hoveredProduct === carouselKey &&
                        variantImages.length > 1 && (
                          <>
                            <button
                              className="image-nav-btn prev-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                handleImageNavigation(
                                  carouselKey,
                                  "prev",
                                  variantImages.length,
                                );
                              }}
                            >
                              &#8249;
                            </button>
                            <button
                              className="image-nav-btn next-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                handleImageNavigation(
                                  carouselKey,
                                  "next",
                                  variantImages.length,
                                );
                              }}
                            >
                              &#8250;
                            </button>

                            {/* Dots indicator */}
                            <div className="image-dots">
                              {variantImages.map((_, idx) => (
                                <span
                                  key={idx}
                                  className={`dot ${currentImgIndex === idx ? "active" : ""}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDotClick(carouselKey, idx);
                                  }}
                                />
                              ))}
                            </div>
                          </>
                        )}

                      {location?.pathname.startsWith("/MyWishlists") ? (
                        <a className="favicon">
                          {isWishlistLoading ? (
                            <SmallWishlistLoader />
                          ) : (
                            <img
                              src={"/assets/img/deletebtn.png"}
                              alt={t("Remove from wishlist")}
                              onClick={() =>
                                handleRemoveWishlist(item, variant)
                              }
                              style={{ cursor: "pointer" }}
                            />
                          )}
                        </a>
                      ) : (
                        <a className="favicon">
                          {isWishlistLoading ? (
                            <SmallWishlistLoader />
                          ) : (
                            <img
                              src={
                                isWishlisted
                                  ? "/assets/img/liked.png"
                                  : "/assets/img/heart.png"
                              }
                              alt={t("wishlist")}
                              onClick={() => addToWishlist(item?._id, variant)}
                              style={{ cursor: "pointer" }}
                            />
                          )}
                        </a>
                      )}
                    </div>

                    <div className="productcommandetails">
                      {availableColors.length > 0 && (
                        <div className="colorboxes d-flex align-items-center mb-2">
                          {availableColors.slice(0, 3).map((color, index) => (
                            <div
                              key={index}
                              className="cb_cmn"
                              title={t(color.name)}
                              custom-color={color?.color_code}
                              style={{
                                backgroundColor:
                                  color?.color_code ||
                                  COLOUR_MAP[color.name] ||
                                  "#CCCCCC",
                                border: "1px solid #ddd",
                              }}
                            />
                          ))}

                          {availableColors.length > 3 && (
                            <span className="ms-2">
                              +{availableColors.length - 3} {t("more")}
                            </span>
                          )}
                        </div>
                      )}

                      {/* <Link href={`/Product/${productId}`}>
                      <div className="productname">
                        {(
                          i18next.language === "ar"
                            ? product?.name_ar || item?.name_ar
                            : product?.name_en || item?.name_en
                        )?.length > 20
                          ? (
                            i18next.language === "ar"
                              ? product?.name_ar || item?.name_ar
                              : product?.name_en || item?.name_en
                          ).slice(0, 20) + "..."
                          : i18next.language === "ar"
                            ? product?.name_ar || item?.name_ar
                            : product?.name_en || item?.name_en || ""}
                      </div>
                    </Link> */}

                      <Link href={`/Product/${productId}`}>
                        <div className="productname">
                          {formatDescription(
                            i18next.language === "ar"
                              ? product?.name_ar || item?.name_ar
                              : product?.name_en || item?.name_en || "",
                            3,
                          )}
                        </div>
                      </Link>

                      <div className="productprice mb-2">
                        {variant?.discountPrice || item?.discountPrice ? (
                          <>
                            {getCurrencySymbol(userCountry)}{" "}
                            <span className="text-decoration-line-through me-2">
                              {variant?.price.toFixed(2) ||
                                item?.price.toFixed(2)}
                            </span>
                            <span className="fw-bold text-danger">
                              {/* {getCurrencySymbol(userCountry)} {" "} */}
                              {variant?.totalPrice.toFixed(2) ||
                                item?.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span>
                            {getCurrencySymbol(userCountry)}{" "}
                            {variant?.price.toFixed(2) ||
                              item?.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <button
                        className="addtocart"
                        dir="ltr"
                        onClick={() => {
                          if (location?.pathname.startsWith("/MyWishlists")) {
                            handleAddtoCart(item, variant);
                          } else {
                            setSelectedProduct(item);

                            setMobileModal(true); // flag that modal should open
                            setSelectedProduct(item);
                          }
                        }}
                        data-bs-toggle="modal"
                        data-bs-target={`${!location?.pathname.startsWith("/MyWishlists") ? "#mobile-product-modal" : ""}`}
                        // {...(!location?.pathname.startsWith("/MyWishlists") && {
                        //   "data-bs-toggle": "modal",
                        //   "data-bs-target": "#mobile-product-modal",
                        // })}
                      >
                        {isAddingToCart ? (
                          <SmallLoader />
                        ) : (
                          <>
                            <img src="/assets/img/bag.png" alt="bag" />{" "}
                            {variant?.isAddedInCart
                              ? t("ADDED TO CART")
                              : t("ADD TO CART")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </Slider>
        ) : cardDetails ? (
          productList.map((item, index) => {
            const { product, variant } = getProductData(item);
            const productId = product?._id || item?._id;
            // Use unique key for carousel to prevent cross-variant interference in wishlist
            const carouselKey = isWishList
              ? variant?._id || item?._id || productId
              : productId;
            const selectedVariant = selectedVariants[productId] || {};

            // Get images: for wishlist show variant images first, otherwise product images first
            const variantImages = isWishList
              ? variant?.images?.length > 0
                ? variant.images
                : product?.images?.length > 0
                  ? product.images
                  : []
              : product?.images?.length > 0
                ? product.images
                : item?.images?.length > 0
                  ? item.images
                  : variant?.images?.length > 0
                    ? variant.images
                    : [];
            const currentImgIndex = currentImageIndex[carouselKey] || 0;
            const displayImage =
              hoveredProduct === carouselKey && variantImages.length > 0
                ? variantImages[currentImgIndex]?.url
                : variantImages[0]?.url || "/assets/img/dummy.jpg";

            const imageUrl = displayImage;

            // Check isAddedInWishList from multiple sources:
            // 1. variant returned by getProductData
            // 2. item.variant directly (in case getProductData returned from variants array)
            // 3. Any variant in the variants array that has isAddedInWishList === true
            // 4. product.wishlists array
            // 5. local wishlistStatus state
            const hasWishlistedVariant =
              Array.isArray(item?.variants) &&
              item.variants.some((v) => v?.isAddedInWishList === true);

            const isWishlisted =
              variant?.isAddedInWishList === true ||
              item?.variant?.isAddedInWishList === true ||
              hasWishlistedVariant ||
              wishlistStatus[variant?._id] === true;

            const isAddingToCart = loadingCartItems[variant?._id] || false;
            const isWishlistLoading =
              loadingWishlistItems[variant?._id] || false;
            const isBuyNowLoading =
              loadingBuyNowItems[selectedVariant.selectedVariant?._id] ||
              loadingBuyNowItems[item.variants?.[0]?._id] ||
              false;

            // Get available colors and sizes
            const availableColors = getAvailableColors(item);
            const availableSizes = getAvailableSizes(
              item,
              selectedVariant.selectedColor,
            );
            const hasVariants = hasAvailableVariants(item);

            return (
              <div
                className="col-6 px-2 col-md-4 col-lg-3 mb-4 cart-details-products-card"
                key={`${carouselKey}-${index}`}
              >
                <div className="product-comman-wrapper">
                  <div className="productcomman">
                    {/* <div className="productType">{getTagText(item)}</div> */}
                    <div
                      className="productcommanimg mb-2"
                      onMouseEnter={() => handleMouseEnter(carouselKey)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <Link href={`/Product/${productId}`}>
                        <img
                          src={imageUrl}
                          alt={product?.name_en || item?.name_en}
                          loading="lazy"
                          decoding="async"
                          style={{
                            maxWidth: "100%",
                            height: "100%",
                            transition: "opacity 0.3s ease",
                          }}
                        />
                      </Link>

                      {/* Image Navigation Controls - Show on hover if multiple images */}
                      {hoveredProduct === carouselKey &&
                        variantImages.length > 1 && (
                          <>
                            <button
                              className="image-nav-btn prev-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                handleImageNavigation(
                                  carouselKey,
                                  "prev",
                                  variantImages.length,
                                );
                              }}
                            >
                              &#8249;
                            </button>
                            <button
                              className="image-nav-btn next-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                handleImageNavigation(
                                  carouselKey,
                                  "next",
                                  variantImages.length,
                                );
                              }}
                            >
                              &#8250;
                            </button>

                            {/* Dots indicator */}
                            <div className="image-dots">
                              {variantImages.map((_, idx) => (
                                <span
                                  key={idx}
                                  className={`dot ${currentImgIndex === idx ? "active" : ""}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDotClick(carouselKey, idx);
                                  }}
                                />
                              ))}
                            </div>
                          </>
                        )}

                      {location?.pathname.startsWith("/MyWishlists") ? (
                        <a className="favicon">
                          {isWishlistLoading ? (
                            <SmallWishlistLoader />
                          ) : (
                            <img
                              src={"/assets/img/deletebtn.png"}
                              alt={t("Remove from wishlist")}
                              onClick={() =>
                                handleRemoveWishlist(item, variant)
                              }
                              style={{ cursor: "pointer" }}
                            />
                          )}
                        </a>
                      ) : (
                        <a className="favicon">
                          {isWishlistLoading ? (
                            <SmallWishlistLoader />
                          ) : (
                            <img
                              src={
                                isWishlisted
                                  ? "/assets/img/liked.png"
                                  : "/assets/img/heart.png"
                              }
                              alt={t("wishlist")}
                              onClick={() => addToWishlist(item?._id, variant)}
                              style={{ cursor: "pointer" }}
                            />
                          )}
                        </a>
                      )}
                    </div>

                    <div className="productcommandetails">
                      {availableColors.length > 0 && (
                        <div className="colorboxes d-flex align-items-center mb-2">
                          {availableColors.slice(0, 3).map((color, index) => (
                            <div
                              key={index}
                              className="cb_cmn"
                              title={t(color.name)}
                              custom-color={color?.color_code}
                              style={{
                                backgroundColor:
                                  color?.color_code ||
                                  COLOUR_MAP[color.name] ||
                                  "#CCCCCC",
                                border: "1px solid #ddd",
                              }}
                            >
                              {/* {color?.color_code} */}
                            </div>
                          ))}

                          {availableColors.length > 3 && (
                            <span className="ms-2">
                              +{availableColors.length - 3} {t("more")}
                            </span>
                          )}
                        </div>
                      )}

                      {/* <Link href={`/Product/${productId}`}>
                        <div className="productname">
                          {(
                            i18next.language === "ar"
                              ? product?.name_ar || item?.name_ar
                              : product?.name_en || item?.name_en
                          )?.length > 20
                            ? (
                              i18next.language === "ar"
                                ? product?.name_ar || item?.name_ar
                                : product?.name_en || item?.name_en
                            ).slice(0, 20) + "..."
                            : i18next.language === "ar"
                              ? product?.name_ar || item?.name_ar
                              : product?.name_en || item?.name_en || ""}
                        </div>
                      </Link> */}

                      <Link href={`/Product/${productId}`}>
                        <div className="productname">
                          {formatDescription(
                            i18next.language === "ar"
                              ? product?.name_ar || item?.name_ar
                              : product?.name_en || item?.name_en || "",
                            3,
                          )}
                        </div>
                      </Link>

                      <div className="productprice mb-2">
                        {variant?.discountPrice || item?.discountPrice ? (
                          <>
                            {getCurrencySymbol(userCountry)}{" "}
                            <span className="text-decoration-line-through me-2">
                              {variant?.price.toFixed(2) ||
                                item?.price.toFixed(2)}
                            </span>
                            <span className="fw-bold text-danger">
                              {/* {getCurrencySymbol(userCountry)} {" "} */}
                              {variant?.totalPrice.toFixed(2) ||
                                item?.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span>
                            {getCurrencySymbol(userCountry)}{" "}
                            {variant?.price.toFixed(2) ||
                              item?.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <button
                        className="addtocart"
                        dir="ltr"
                        onClick={
                          location?.pathname.startsWith("/MyWishlists")
                            ? () => handleAddtoCart(item, variant)
                            : () => setSelectedProduct(item)
                        }
                        {...(!location?.pathname.startsWith("/MyWishlists") && {
                          "data-bs-toggle": "modal",
                          "data-bs-target": `#addtocard-${productId}-cardDetails`,
                        })}
                      >
                        {isAddingToCart ? (
                          <SmallLoader />
                        ) : (
                          <>
                            <img src="/assets/img/bag.png" alt="bag" />{" "}
                            {variant?.isAddedInCart
                              ? t("ADDED TO CART")
                              : t("ADD TO CART")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* DYNAMIC MODAL */}
                  <div
                    className="modal fade addtocartmodal"
                    id={`addtocard-${productId}-cardDetails`}
                    tabIndex={-1}
                    aria-labelledby="exampleModalLabel-cardDetailss"
                    aria-hidden="true"
                  >
                    <div className="modal-dialog modal-dialog-centered">
                      <div className="modal-content">
                        <div className="modal-body position-relative">
                          {/* <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                          ></button> */}
                          <div className="row">
                            <div className="col-md-10 mb-4">
                              <div className="modalhead">
                                <h2>{t("Choose Below Option")}</h2>
                                <p>
                                  {t(
                                    "Choose your desired colors and the perfect size.",
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Select Color - Optional */}
                            {availableColors.length > 0 && (
                              <div className="col-md-12 pb-3">
                                <div className="cartoptionhead">
                                  <div>
                                    {t("Select Color")}:{" "}
                                    {selectedVariant?.selectedColor ===
                                    undefined
                                      ? ""
                                      : selectedVariant?.selectedColor}
                                    {availableColors?.length > 0 && ""}
                                  </div>
                                </div>
                                <div className="row px-2">
                                  {availableColors.length > 0 ? (
                                    <>
                                      {availableColors.map((color, idx) => (
                                        <div
                                          className="col-auto px-1 w-auto"
                                          key={idx}
                                        >
                                          <button
                                            type="button"
                                            className={`cartcolor ${selectedVariant.selectedColor === color.name ? "selected" : ""}`}
                                            title={color.name}
                                            color-code={color?.color_code}
                                            onClick={() =>
                                              handleColorSelect(
                                                productId,
                                                color.name,
                                                item,
                                              )
                                            }
                                            style={{
                                              backgroundColor:
                                                color?.color_code ||
                                                COLOUR_MAP[color.name] ||
                                                "#CCCCCC",
                                              border:
                                                selectedVariant.selectedColor ===
                                                color.name
                                                  ? "2px solid #000"
                                                  : "1px solid #ddd",
                                              width: 30,
                                              height: 30,
                                              borderRadius: "50%",
                                              cursor: "pointer",
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </>
                                  ) : null}
                                </div>
                                {/* {selectedVariant.selectedColor && (
                                <div className="mt-2 text-success">
                                  {t("Selected")}: {selectedVariant.selectedColor}
                                </div>
                              )} */}
                              </div>
                            )}

                            {/* Select Size - Optional */}
                            {availableSizes.length > 0 && (
                              <div className="col-md-12 mb-3">
                                <div className="cartoptionhead">
                                  <div>
                                    {t("Select Size")}{" "}
                                    {availableSizes.length > 0 && ""}
                                  </div>
                                </div>
                                <div className="row px-2">
                                  {availableSizes.length > 0
                                    ? availableSizes.map((size, idx) => (
                                        <div
                                          className="col-auto px-1 w-auto"
                                          key={idx}
                                        >
                                          <button
                                            type="button"
                                            className={`selectsizee ${selectedVariant.selectedSize === size.name ? "selected" : ""}`}
                                            onClick={() =>
                                              handleSizeSelect(
                                                productId,
                                                size.name,
                                                item,
                                                selectedVariant.selectedColor,
                                              )
                                            }
                                            style={{
                                              minWidth: 40,
                                              height: 34,
                                              lineHeight: "34px",
                                              textAlign: "center",
                                              borderRadius: 8,
                                              border:
                                                selectedVariant.selectedSize ===
                                                size.name
                                                  ? "2px solid #000"
                                                  : "1px solid #ddd",
                                              background:
                                                selectedVariant.selectedSize ===
                                                size.name
                                                  ? "#f0f0f0"
                                                  : "#fff",
                                              cursor: "pointer",
                                            }}
                                          >
                                            {size.name}
                                          </button>
                                        </div>
                                      ))
                                    : null}
                                </div>
                                {/* {selectedVariant.selectedSize && (
                                <div className="mt-2 text-success">
                                  {t("Selected")}: {selectedVariant.selectedSize}
                                </div>
                              )} */}
                              </div>
                            )}

                            {/* Footer Buttons */}
                            <div className="col-md-12 mb-4" dir="ltr">
                              <div className="row">
                                <div className="col-md-6 mb-2">
                                  <button
                                    type="button"
                                    onClick={() => handleAddtoCart(item)}
                                    className="authbtns1"
                                    data-bs-dismiss="modal"
                                    disabled={
                                      !hasVariants ||
                                      (availableColors.length > 0 &&
                                        !selectedVariant.selectedColor) ||
                                      (availableSizes.length > 0 &&
                                        !selectedVariant.selectedSize) ||
                                      loadingCartItems[
                                        selectedVariant.selectedVariant?._id
                                      ] ||
                                      loadingCartItems[item.variants[0]?._id]
                                    }
                                    style={{
                                      cursor:
                                        !hasVariants ||
                                        (availableColors.length > 0 &&
                                          !selectedVariant.selectedColor) ||
                                        (availableSizes.length > 0 &&
                                          !selectedVariant.selectedSize) ||
                                        loadingCartItems[
                                          selectedVariant.selectedVariant?._id
                                        ] ||
                                        loadingCartItems[item.variants[0]?._id]
                                          ? "not-allowed"
                                          : "pointer",
                                    }}
                                  >
                                    {loadingCartItems[
                                      selectedVariant.selectedVariant?._id
                                    ] ||
                                    loadingCartItems[
                                      item.variants?.[0]?._id
                                    ] ? (
                                      <SmallLoader />
                                    ) : (
                                      t("ADD TO CART")
                                    )}
                                  </button>
                                </div>
                                <div className="col-md-6">
                                  <button
                                    type="button"
                                    className="authbtns2"
                                    onClick={() => handleBuyNow(item)}
                                    data-bs-dismiss="modal"
                                    disabled={
                                      !hasVariants ||
                                      (availableColors.length > 0 &&
                                        !selectedVariant.selectedColor) ||
                                      (availableSizes.length > 0 &&
                                        !selectedVariant.selectedSize) ||
                                      isBuyNowLoading
                                    }
                                    style={{
                                      cursor:
                                        !hasVariants ||
                                        (availableColors.length > 0 &&
                                          !selectedVariant.selectedColor) ||
                                        (availableSizes.length > 0 &&
                                          !selectedVariant.selectedSize) ||
                                        isBuyNowLoading
                                          ? "not-allowed"
                                          : "pointer",
                                    }}
                                  >
                                    {isBuyNowLoading ? (
                                      <SmallLoader />
                                    ) : (
                                      t("BUY NOW")
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {!hasVariants && (
                              <div className="col-md-12 mb-3">
                                <div className="alert alert-warning text-center">
                                  {t("No variants available for this product")}
                                </div>
                              </div>
                            )}

                            <div className="col-md-12 mb-2 text-center">
                              <div className="needhelp">
                                {t("Need Help?")}{" "}
                                <a
                                  className=""
                                  href="https://wa.me/96597698498?text=Hello%20there!%20I%20would%20like%20to%20know%20more%20about%20your%20services."
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {t("WhatsApp")}
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          productList.map((item, index) => {
            const { product, variant } = getProductData(item);
            const productId = product?._id || item?._id;
            // Use unique key for carousel to prevent cross-variant interference in wishlist
            const carouselKey = isWishList
              ? variant?._id || item?._id || productId
              : productId;
            const selectedVariant = selectedVariants[productId] || {};

            // Get images: for wishlist show variant images first, otherwise product images first
            const variantImages = isWishList
              ? variant?.images?.length > 0
                ? variant.images
                : product?.images?.length > 0
                  ? product.images
                  : []
              : product?.images?.length > 0
                ? product.images
                : item?.images?.length > 0
                  ? item.images
                  : variant?.images?.length > 0
                    ? variant.images
                    : [];
            const currentImgIndex = currentImageIndex[carouselKey] || 0;
            const displayImage =
              hoveredProduct === carouselKey && variantImages.length > 0
                ? variantImages[currentImgIndex]?.url
                : variantImages[0]?.url || "/assets/img/dummy.jpg";

            const imageUrl = displayImage;

            // Check isAddedInWishList from multiple sources:
            // 1. variant returned by getProductData
            // 2. item.variant directly (in case getProductData returned from variants array)
            // 3. Any variant in the variants array that has isAddedInWishList === true
            // 4. product.wishlists array
            // 5. local wishlistStatus state
            const hasWishlistedVariant =
              Array.isArray(item?.variants) &&
              item.variants.some((v) => v?.isAddedInWishList === true);

            const isWishlisted =
              variant?.isAddedInWishList === true ||
              item?.variant?.isAddedInWishList === true ||
              hasWishlistedVariant ||
              wishlistStatus[variant?._id] === true;

            const isAddingToCart = loadingCartItems[variant?._id] || false;
            const isWishlistLoading =
              loadingWishlistItems[variant?._id] || false;
            const isBuyNowLoading =
              loadingBuyNowItems[selectedVariant.selectedVariant?._id] ||
              loadingBuyNowItems[item.variants?.[0]?._id] ||
              false;

            // Get available colors and sizes
            const availableColors = getAvailableColors(item);
            const availableSizes = getAvailableSizes(
              item,
              selectedVariant.selectedColor,
            );
            const hasVariants = hasAvailableVariants(item);

            return (
              // <div className="col-6 px-2 col-md-4 col-lg-3 mb-4">
              <div
                className="product-comman-wrapper normal-product-card"
                key={`${carouselKey}-${index}`}
              >
                <div className="productcomman">
                  {/* <div className="productType">{getTagText(item)}</div> */}
                  <div
                    className="productcommanimg mb-2"
                    onMouseEnter={() => handleMouseEnter(carouselKey)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link href={`/Product/${productId}`}>
                      <img
                        src={imageUrl}
                        alt={product?.name_en || item?.name_en}
                        loading="lazy"
                        decoding="async"
                        style={{
                          maxWidth: "100%",
                          height: "100%",
                          transition: "opacity 0.3s ease",
                        }}
                      />
                    </Link>

                    {/* Image Navigation Controls - Show on hover if multiple images */}
                    {hoveredProduct === carouselKey &&
                      variantImages.length > 1 && (
                        <>
                          <button
                            className="image-nav-btn prev-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              handleImageNavigation(
                                carouselKey,
                                "prev",
                                variantImages.length,
                              );
                            }}
                          >
                            &#8249;
                          </button>
                          <button
                            className="image-nav-btn next-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              handleImageNavigation(
                                carouselKey,
                                "next",
                                variantImages.length,
                              );
                            }}
                          >
                            &#8250;
                          </button>

                          {/* Dots indicator */}
                          <div className="image-dots">
                            {variantImages.map((_, idx) => (
                              <span
                                key={idx}
                                className={`dot ${currentImgIndex === idx ? "active" : ""}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDotClick(carouselKey, idx);
                                }}
                              />
                            ))}
                          </div>
                        </>
                      )}

                    {location?.pathname.startsWith("/MyWishlists") ? (
                      <a className="favicon">
                        {isWishlistLoading ? (
                          <SmallWishlistLoader />
                        ) : (
                          <img
                            src={"/assets/img/deletebtn.png"}
                            alt={t("Remove from wishlist")}
                            onClick={() => handleRemoveWishlist(item, variant)}
                            style={{ cursor: "pointer" }}
                          />
                        )}
                      </a>
                    ) : (
                      <a className="favicon">
                        {isWishlistLoading ? (
                          <SmallWishlistLoader />
                        ) : (
                          <img
                            src={
                              isWishlisted
                                ? "/assets/img/liked.png"
                                : "/assets/img/heart.png"
                            }
                            alt={t("wishlist")}
                            onClick={() => addToWishlist(item?._id, variant)}
                            style={{ cursor: "pointer" }}
                          />
                        )}
                      </a>
                    )}
                  </div>

                  <div className="productcommandetails">
                    {availableColors.length > 0 && (
                      <div className="colorboxes d-flex align-items-center mb-2">
                        {availableColors.slice(0, 3).map((color, idx) => (
                          <div
                            key={color._id || color.name || idx}
                            className="cb_cmn"
                            title={t(color.name)}
                            custom-color={color?.color_code}
                            style={{
                              backgroundColor:
                                color?.color_code ||
                                COLOUR_MAP[color.name] ||
                                "#CCCCCC",
                              border: "1px solid #ddd",
                            }}
                          />
                        ))}

                        {availableColors.length > 3 && (
                          <span className="ms-2">
                            +{availableColors.length - 3} {t("more")}
                          </span>
                        )}
                      </div>
                    )}

                    {/* <Link href={`/Product/${productId}`}>
                      <div className="productname">
                        {(
                          i18next.language === "ar"
                            ? product?.name_ar || item?.name_ar
                            : product?.name_en || item?.name_en
                        )?.length > 20
                          ? (
                            i18next.language === "ar"
                              ? product?.name_ar || item?.name_ar
                              : product?.name_en || item?.name_en
                          ).slice(0, 20) + "..."
                          : i18next.language === "ar"
                            ? product?.name_ar || item?.name_ar
                            : product?.name_en || item?.name_en || ""}
                      </div>
                    </Link> */}

                    <Link href={`/Product/${productId}`}>
                      <div className="productname">
                        {formatDescription(
                          i18next.language === "ar"
                            ? product?.name_ar || item?.name_ar
                            : product?.name_en || item?.name_en || "",
                          3,
                        )}
                      </div>
                    </Link>

                    <div className="productprice mb-2">
                      {variant?.discountPrice || item?.discountPrice ? (
                        <>
                          {getCurrencySymbol(userCountry)}{" "}
                          <span className="text-decoration-line-through me-2">
                            {variant?.price.toFixed(2) ||
                              item?.price.toFixed(2)}
                          </span>
                          <span className="fw-bold text-danger">
                            {/* {getCurrencySymbol(userCountry)} {" "} */}
                            {variant?.totalPrice.toFixed(2) ||
                              item?.price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span>
                          {getCurrencySymbol(userCountry)}{" "}
                          {variant?.price.toFixed(2) || item?.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button
                      className="addtocart"
                      dir="ltr"
                      onClick={
                        location?.pathname.startsWith("/MyWishlists")
                          ? () => handleAddtoCart(item, variant)
                          : () => setSelectedProduct(item)
                      }
                      {...(!location?.pathname.startsWith("/MyWishlists") && {
                        "data-bs-toggle": "modal",
                        "data-bs-target": `#addtocard-${productId}`,
                      })}
                    >
                      {isAddingToCart ? (
                        <SmallLoader />
                      ) : (
                        <>
                          <img src="/assets/img/bag.png" alt="bag" />{" "}
                          {variant?.isAddedInCart
                            ? t("ADDED TO CART")
                            : t("ADD TO CART")}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* DYNAMIC MODAL */}
                <div
                  className="modal fade addtocartmodal"
                  id={`addtocard-${productId}`}
                  tabIndex={-1}
                  aria-labelledby="exampleModalLabel"
                  aria-hidden="true"
                >
                  <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                      <div className="modal-body position-relative">
                        {/* <button
                          type="button"
                          className="btn-close"
                          data-bs-dismiss="modal"
                          aria-label="Close"
                        ></button> */}
                        <div className="row">
                          <div className="col-md-10 mb-4">
                            <div className="modalhead">
                              <h2>{t("Choose Below Option")}</h2>
                              <p>
                                {t(
                                  "Choose your desired colors and the perfect size.",
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Select Color - Optional */}
                          {availableColors.length > 0 && (
                            <div className="col-md-12 pb-3">
                              <div className="cartoptionhead">
                                <div>
                                  {t("Select Color")}:{" "}
                                  {selectedVariant?.selectedColor === undefined
                                    ? ""
                                    : selectedVariant?.selectedColor}
                                  {availableColors.length > 0 && ""}
                                </div>
                              </div>
                              <div className="row px-2 pt-2 g-2">
                                {availableColors.length > 0 ? (
                                  <>
                                    {availableColors.map((color, idx) => (
                                      <div
                                        className="col-auto px-1 w-auto"
                                        key={idx}
                                      >
                                        <button
                                          type="button"
                                          className={`cartcolor ${selectedVariant.selectedColor === color.name ? "selected" : ""}`}
                                          title={color.name}
                                          color-code={color?.color_code}
                                          onClick={() =>
                                            handleColorSelect(
                                              productId,
                                              color.name,
                                              item,
                                            )
                                          }
                                          style={{
                                            backgroundColor:
                                              color?.color_code ||
                                              COLOUR_MAP[color.name] ||
                                              "#CCCCCC",
                                            border:
                                              selectedVariant.selectedColor ===
                                              color.name
                                                ? "2px solid #000"
                                                : "1px solid #ddd",
                                            width: 30,
                                            height: 30,
                                            borderRadius: "50%",
                                            cursor: "pointer",
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </>
                                ) : null}
                              </div>
                              {/* {selectedVariant.selectedColor && (
                              <div className="mt-2 text-success">
                                {t("Selected")}: {selectedVariant.selectedColor}
                              </div>
                            )} */}
                            </div>
                          )}

                          {/* Select Size - Optional */}
                          {availableSizes.length > 0 && (
                            <div className="col-md-12 mb-3">
                              <div className="cartoptionhead">
                                <div>
                                  {t("Select Size")}:{" "}
                                  {selectedVariant.selectedSize}
                                  {availableSizes.length > 0 && ""}
                                </div>
                              </div>
                              <div className="row px-2 pt-2 g-2">
                                {availableSizes.length > 0
                                  ? availableSizes.map((size, idx) => (
                                      <div
                                        className="col-auto px-1 w-auto"
                                        key={idx}
                                      >
                                        <button
                                          type="button"
                                          className={`selectsizee ${selectedVariant.selectedSize === size.name ? "selected" : ""}`}
                                          onClick={() =>
                                            handleSizeSelect(
                                              productId,
                                              size.name,
                                              item,
                                              selectedVariant.selectedColor,
                                            )
                                          }
                                          style={{
                                            minWidth: 40,
                                            height: 34,
                                            lineHeight: "34px",
                                            textAlign: "center",
                                            borderRadius: 8,
                                            border:
                                              selectedVariant.selectedSize ===
                                              size.name
                                                ? "2px solid #000"
                                                : "1px solid #ddd",
                                            background:
                                              selectedVariant.selectedSize ===
                                              size.name
                                                ? "#f0f0f0"
                                                : "#fff",
                                            cursor: "pointer",
                                          }}
                                        >
                                          {size.name}
                                        </button>
                                      </div>
                                    ))
                                  : null}
                              </div>
                              {/* {selectedVariant.selectedSize && (
                              <div className="mt-2 text-success">
                                {t("Selected")}: {selectedVariant.selectedSize}
                              </div>
                            )} */}
                            </div>
                          )}

                          {/* Footer Buttons */}
                          <div className="col-md-12 mb-4" dir="ltr">
                            <div className="row">
                              <div className="col-md-6 mb-2">
                                <button
                                  type="button"
                                  onClick={() => handleAddtoCart(item)}
                                  className="authbtns1"
                                  data-bs-dismiss="modal"
                                  disabled={
                                    !hasVariants ||
                                    (availableColors.length > 0 &&
                                      !selectedVariant.selectedColor) ||
                                    (availableSizes.length > 0 &&
                                      !selectedVariant.selectedSize) ||
                                    loadingCartItems[
                                      selectedVariant.selectedVariant?._id
                                    ] ||
                                    loadingCartItems[item.variants[0]?._id]
                                  }
                                  style={{
                                    cursor:
                                      !hasVariants ||
                                      (availableColors.length > 0 &&
                                        !selectedVariant.selectedColor) ||
                                      (availableSizes.length > 0 &&
                                        !selectedVariant.selectedSize) ||
                                      loadingCartItems[
                                        selectedVariant.selectedVariant?._id
                                      ] ||
                                      loadingCartItems[item.variants[0]?._id]
                                        ? "not-allowed"
                                        : "pointer",
                                  }}
                                >
                                  {loadingCartItems[
                                    selectedVariant.selectedVariant?._id
                                  ] ||
                                  loadingCartItems[item.variants?.[0]?._id] ? (
                                    <SmallLoader />
                                  ) : (
                                    t("ADD TO CART")
                                  )}
                                </button>
                              </div>
                              <div className="col-md-6">
                                <button
                                  type="button"
                                  className="authbtns2"
                                  onClick={() => handleBuyNow(item)}
                                  data-bs-dismiss="modal"
                                  disabled={
                                    !hasVariants ||
                                    (availableColors.length > 0 &&
                                      !selectedVariant.selectedColor) ||
                                    (availableSizes.length > 0 &&
                                      !selectedVariant.selectedSize) ||
                                    isBuyNowLoading
                                  }
                                  style={{
                                    cursor:
                                      !hasVariants ||
                                      (availableColors.length > 0 &&
                                        !selectedVariant.selectedColor) ||
                                      (availableSizes.length > 0 &&
                                        !selectedVariant.selectedSize) ||
                                      isBuyNowLoading
                                        ? "not-allowed"
                                        : "pointer",
                                  }}
                                >
                                  {isBuyNowLoading ? (
                                    <SmallLoader />
                                  ) : (
                                    t("BUY NOW")
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {!hasVariants && (
                            <div className="col-md-12 mb-3">
                              <div className="alert alert-warning text-center">
                                {t("No variants available for this product")}
                              </div>
                            </div>
                          )}

                          <div className="col-md-12 mb-2 text-center">
                            <div className="needhelp">
                              {t("Need Help?")}{" "}
                              <a
                                className=""
                                href="https://wa.me/96597698498?text=Hello%20there!%20I%20would%20like%20to%20know%20more%20about%20your%20services."
                                target="_blank"
                                rel="noreferrer"
                              >
                                {t("WhatsApp")}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              // </div>
            );
          })
        )}

        {/* SHARED MOBILE PRODUCT MODAL */}

        <div
          className={`modal fade addtocartmodal custom-modal-design ${mobileModal ? "show d-block" : ""}`}
          id="mobile-product-modal"
          tabIndex={-1}
          aria-labelledby="exampleModalLabel-isMobile"
          aria-hidden="true"
          onClick={() => {
            setMobileModal(false);
            setSelectedProduct(null);
            document.getElementById("mobile-modal-close-button").click();
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn-close d-none"
              data-bs-dismiss="modal"
              aria-label="Close"
              id="mobile-modal-close-button"
            ></button>
            <div className="modal-content">
              {selectedProduct &&
                ((item) => {
                  const { product, variant } = getProductData(item);

                  const productId = product?._id || item?._id;
                  const selectedVariant = selectedVariants[productId] || {};

                  const availableColors = getAvailableColors(item);
                  const availableSizes = getAvailableSizes(
                    item,
                    selectedVariant.selectedColor,
                  );
                  const hasVariants = hasAvailableVariants(item);

                  const isBuyNowLoading =
                    loadingBuyNowItems[selectedVariant.selectedVariant?._id] ||
                    loadingBuyNowItems[item.variants?.[0]?._id] ||
                    false;

                  return (
                    <div className="modal-body position-relative">
                      <div className="row">
                        <div className="col-md-10 mb-4">
                          <div className="modalhead">
                            <h2>{t("Choose Below Option")}</h2>
                            <p>
                              {t(
                                "Choose your desired colors and the perfect size.",
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Select Color */}
                        {availableColors.length > 0 && (
                          <div className="col-md-12">
                            <div className="cartoptionhead">
                              <div>
                                {t("Select Color")}{" "}
                                {availableColors.length > 0 && ""}
                                {`: ${
                                  selectedVariant?.selectedColor === undefined
                                    ? ""
                                    : selectedVariant?.selectedColor
                                }` || ""}
                              </div>
                            </div>
                            <div className="row px-2">
                              {availableColors.map((color, idx) => (
                                <div className="col-auto px-1 w-auto" key={idx}>
                                  <button
                                    type="button"
                                    className={`cartcolor ${selectedVariant.selectedColor === color.name ? "selected" : ""}`}
                                    title={color.name}
                                    color-code={color?.color_code}
                                    onClick={() =>
                                      handleColorSelect(
                                        productId,
                                        color.name,
                                        item,
                                      )
                                    }
                                    style={{
                                      backgroundColor:
                                        color?.color_code ||
                                        COLOUR_MAP[color.name] ||
                                        "#CCCCCC",
                                      border:
                                        selectedVariant.selectedColor ===
                                        color.name
                                          ? "2px solid #000"
                                          : "1px solid #ddd",
                                      width: 30,
                                      height: 30,
                                      borderRadius: "50%",
                                      cursor: "pointer",
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                            {/* {selectedVariant.selectedColor && (
                          <div className="text-dark">
                            {t("Selected")}: {selectedVariant.selectedColor}
                          </div>
                        )} */}
                          </div>
                        )}

                        {/* Select Size */}
                        {availableSizes.length > 0 && (
                          <div className="col-md-12 mb-3">
                            <div className="cartoptionhead">
                              <div>
                                {t("Select Size")}{" "}
                                {availableSizes.length > 0 && ""}
                                {`: ${
                                  selectedVariant?.selectedSize === undefined
                                    ? ""
                                    : selectedVariant?.selectedSize
                                }` || ""}
                              </div>
                            </div>
                            <div className="row px-2">
                              {availableSizes.map((size, idx) => (
                                <div className="col-auto px-1 w-auto" key={idx}>
                                  {console.log(size, "---availableSizes---")}
                                  <button
                                    type="button"
                                    className={`selectsizee ${selectedVariant.selectedSize === size.name ? "selected" : ""}`}
                                    onClick={() =>
                                      handleSizeSelect(
                                        productId,
                                        size.name,
                                        item,
                                        selectedVariant.selectedColor,
                                      )
                                    }
                                    style={{
                                      fontFamily: "inherit !important",
                                      minWidth: 40,
                                      height: 34,
                                      lineHeight: "34px",
                                      textAlign: "center",
                                      borderRadius: 8,
                                      border:
                                        selectedVariant.selectedSize ===
                                        size.name
                                          ? "2px solid #000"
                                          : "1px solid #ddd",
                                      background:
                                        selectedVariant.selectedSize ===
                                        size.name
                                          ? "#f0f0f0"
                                          : "#fff",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {size.name}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Footer Buttons */}
                        <div className="col-md-12 mb-4" dir="ltr">
                          <div className="row">
                            <div className="col-md-6 mb-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setMobileModal(false);
                                  setSelectedProduct(null);
                                  document
                                    .getElementById("mobile-product-modal")
                                    .click();
                                  handleAddtoCart(item);
                                }}
                                className="authbtns1"
                                data-bs-dismiss="modal"
                                disabled={
                                  !hasVariants ||
                                  (availableColors.length > 0 &&
                                    !selectedVariant.selectedColor) ||
                                  (availableSizes.length > 0 &&
                                    !selectedVariant.selectedSize) ||
                                  loadingCartItems[
                                    selectedVariant.selectedVariant?._id
                                  ] ||
                                  loadingCartItems[item.variants[0]?._id]
                                }
                                style={{
                                  cursor:
                                    !hasVariants ||
                                    (availableColors.length > 0 &&
                                      !selectedVariant.selectedColor) ||
                                    (availableSizes.length > 0 &&
                                      !selectedVariant.selectedSize) ||
                                    loadingCartItems[
                                      selectedVariant.selectedVariant?._id
                                    ] ||
                                    loadingCartItems[item.variants[0]?._id]
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                              >
                                {loadingCartItems[
                                  selectedVariant.selectedVariant?._id
                                ] ||
                                loadingCartItems[item.variants?.[0]?._id] ? (
                                  <SmallLoader />
                                ) : (
                                  t("ADD TO CART")
                                )}
                              </button>
                            </div>
                            <div className="col-md-6">
                              <button
                                type="button"
                                className="authbtns2"
                                onClick={() => {
                                  setMobileModal(false);
                                  setSelectedProduct(null);
                                  document
                                    .getElementById("mobile-product-modal")
                                    .click();
                                  handleBuyNow(item);
                                }}
                                data-bs-dismiss="modal"
                                disabled={
                                  !hasVariants ||
                                  (availableColors.length > 0 &&
                                    !selectedVariant.selectedColor) ||
                                  (availableSizes.length > 0 &&
                                    !selectedVariant.selectedSize) ||
                                  isBuyNowLoading
                                }
                                style={{
                                  cursor:
                                    !hasVariants ||
                                    (availableColors.length > 0 &&
                                      !selectedVariant.selectedColor) ||
                                    (availableSizes.length > 0 &&
                                      !selectedVariant.selectedSize) ||
                                    isBuyNowLoading
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                              >
                                {isBuyNowLoading ? (
                                  <SmallLoader />
                                ) : (
                                  t("BUY NOW")
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {!hasVariants && (
                          <div className="col-md-12 mb-3">
                            <div className="alert alert-warning text-center">
                              {t("No variants available for this product")}
                            </div>
                          </div>
                        )}

                        <div className="col-md-12 mb-2 text-center">
                          <div className="needhelp">
                            {t("Need Help?")}{" "}
                            <a
                              className=""
                              href="https://wa.me/96597698498?text=Hello%20there!%20I%20would%20like%20to%20know%20more%20about%20your%20services."
                              target="_blank"
                              rel="noreferrer"
                            >
                              {t("WhatsApp")}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })(selectedProduct)}
            </div>
          </div>
        </div>

        <style jsx>{`
          .productcommanimg {
            position: relative;
            overflow: hidden;
          }

          .image-nav-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.9);
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            transition: all 0.3s ease;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          }

          .image-nav-btn:hover {
            background: rgba(255, 255, 255, 1);
            transform: translateY(-50%) scale(1.1);
          }

          .prev-btn {
            left: 10px;
          }

          .next-btn {
            right: 10px;
          }

          .image-dots {
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 6px;
            z-index: 10;
          }

          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid rgba(0, 0, 0, 0.2);
          }

          .dot:hover {
            background: rgba(255, 255, 255, 0.8);
            transform: scale(1.2);
          }

          .dot.active {
            background: rgba(255, 255, 255, 1);
            width: 10px;
            height: 10px;
          }

          .small-loader {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .small-loader .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
          }

          .wishlist-loader .spinner {
            border: 2px solid rgba(0, 0, 0, 0.1);
            border-top-color: #000;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes shimmer {
            0% {
              left: -100%;
            }
            100% {
              left: 100%;
            }
          }
        `}</style>
      </>
    );
  },
);

Products.displayName = "Products";

export default Products;
