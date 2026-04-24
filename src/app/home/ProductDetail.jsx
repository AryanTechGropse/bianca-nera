"use client";
import React, { useEffect, useRef, useState } from "react";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import {
  addCart,
  getCart,
  getCounts,
  wishCart,
  wishListCart,
} from "@/store/serviceSlices/commonSlice";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import i18next, { t } from "i18next";
import i18n from "@/i18n/i18n";
import Loading from "@/common/Loading";

/* ── colour hex lookup ── */
const COLOUR_MAP = {
  Red: "#FF0000",
  Green: "#008000",
  Blue: "#0000FF",
  Yellow: "#FFFF00",
  Fuchsia: "#ff00ff",
  Orange: "#FFA500",
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

/* ── helpers ── */
const isColorAttribute = (attrName) => {
  if (!attrName) return false;
  const lower = attrName.toLowerCase();
  return lower.includes("color") || lower.includes("colour");
};

const isSizeAttribute = (attrName) => {
  if (!attrName) return false;
  return attrName.toLowerCase().includes("size");
};

const getAttrId = (field) => (typeof field === "string" ? field : field?._id);
const getValId = (field) => (typeof field === "string" ? field : field?._id);

const ProductDetail = () => {
  const isRTL = i18n.dir() === "rtl";
  const dispatch = useDispatch();
  const router = useRouter();
  const [productDetails, setProductDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // Generic attribute selection: { attributeId → selected valueId }
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [attributes, setAttributes] = useState([]);
  const [wishlistStatus, setWishlistStatus] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  // modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const { isUserLoggedIn, currency } = useSelector((state) => ({
    isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
    currency: state?.commonSlice?.currency,
  }));
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // You can adjust the breakpoint
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "products/getHomeProductList",
        data: { page: 1, pageSize: 10 },
      });

      const firstProduct = response?.results?.homeProducts?.[0];
      if (firstProduct) {
        setProductDetails(firstProduct);
        initAttributesAndVariant(firstProduct);
      } else {
        setError("No product details found");
      }
    } catch (error) {
      console.log(error?.message);
      setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  // State to track user country for currency display
  const [userCountry, setUserCountry] = useState(() => {
    return localStorage.getItem("country") || "United States";
  });

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

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(price);
  };

  /* ── build unique attributes list from variant combinations ── */
  const buildAttributesFromVariants = (variants) => {
    if (!variants?.length) return [];
    const attrMap = {};
    variants.forEach((variant) => {
      (variant.combination || []).forEach((comb) => {
        const aId = getAttrId(comb.attributeId);
        const vId = getValId(comb.valueId);
        if (!aId || !vId) return;
        if (!attrMap[aId]) {
          attrMap[aId] = {
            _id: aId,
            name_en:
              typeof comb.attributeId === "object"
                ? comb.attributeId.name_en
                : "",
            name_ar:
              typeof comb.attributeId === "object"
                ? comb.attributeId.name_ar
                : "",
            values: {},
          };
        }
        if (!attrMap[aId].values[vId]) {
          attrMap[aId].values[vId] = {
            _id: vId,
            name_en:
              typeof comb.valueId === "object" ? comb.valueId.name_en : "",
            name_ar:
              typeof comb.valueId === "object" ? comb.valueId.name_ar : "",
            color_code:
              typeof comb.valueId === "object"
                ? comb.valueId.color_code
                : undefined,
            image:
              typeof comb.valueId === "object" ? comb.valueId.image : undefined,
          };
        }
      });
    });
    return Object.values(attrMap).map((attr) => ({
      ...attr,
      values: Object.values(attr.values),
    }));
  };

  /* ── initialize attributes and first variant selection ── */
  const initAttributesAndVariant = (productItem) => {
    const variants = productItem?.productId?.variants;
    if (!variants?.length) return;
    const builtAttrs = buildAttributesFromVariants(variants);
    setAttributes(builtAttrs);
    // Set initial selections from first variant
    const initAttrs = {};
    const firstVariant = variants[0];
    (firstVariant?.combination || []).forEach((comb) => {
      const aId = getAttrId(comb.attributeId);
      const vId = getValId(comb.valueId);
      if (aId && vId) initAttrs[aId] = vId;
    });
    setSelectedAttributes(initAttrs);
    setSelectedVariant(firstVariant);
  };

  /* ── find variant matching attribute selections ── */
  const findVariantIndex = (variants, attrs) => {
    if (!variants?.length) return -1;
    const entries = Object.entries(attrs);
    if (!entries.length) return -1;
    // prefer exact full match
    const exactIdx = variants.findIndex((v) =>
      entries.every(([attrId, valId]) =>
        v.combination?.some(
          (c) =>
            getAttrId(c?.attributeId) === attrId &&
            getValId(c?.valueId) === valId,
        ),
      ),
    );
    if (exactIdx !== -1) return exactIdx;
    // partial match fallback
    let bestIdx = -1;
    let bestCount = 0;
    variants.forEach((v, idx) => {
      const count = entries.filter(([attrId, valId]) =>
        v.combination?.some(
          (c) =>
            getAttrId(c?.attributeId) === attrId &&
            getValId(c?.valueId) === valId,
        ),
      ).length;
      if (count > bestCount) {
        bestCount = count;
        bestIdx = idx;
      }
    });
    return bestIdx;
  };

  /* ── cross-attribute availability filtering ── */
  const getAvailableValueIds = (targetAttrId) => {
    const variants = productDetails?.productId?.variants;
    if (!variants) return new Set();
    const otherSelections = { ...selectedAttributes };
    delete otherSelections[targetAttrId];
    return new Set(
      variants
        .filter((variant) =>
          Object.entries(otherSelections).every(([attrId, valId]) =>
            variant.combination?.some(
              (c) =>
                getAttrId(c?.attributeId) === attrId &&
                getValId(c?.valueId) === valId,
            ),
          ),
        )
        .flatMap((variant) =>
          (variant.combination || [])
            .filter((c) => getAttrId(c?.attributeId) === targetAttrId)
            .map((c) => getValId(c?.valueId)),
        ),
    );
  };

  /* ── check if ANY variant exists for a value (absolute availability) ── */
  const hasAnyVariantForValue = (attrId, valId) => {
    const variants = productDetails?.productId?.variants;
    if (!variants) return false;
    return variants.some((v) =>
      v.combination?.some(
        (c) =>
          getAttrId(c?.attributeId) === attrId &&
          getValId(c?.valueId) === valId,
      ),
    );
  };

  useEffect(() => {
    getProductDetails();
  }, []);

  // Re-fetch product details when currency/country changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      setUserCountry(localStorage.getItem("userCountry") || "United States");
      getProductDetails();
    };
    const handleStorageChange = (e) => {
      if (e.key === "userCountry") {
        setUserCountry(e.newValue || "United States");
        getProductDetails();
      }
    };

    window.addEventListener("currencyChanged", handleCurrencyChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("currencyChanged", handleCurrencyChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Update variant when attribute selection changes
  useEffect(() => {
    if (productDetails && Object.keys(selectedAttributes).length > 0) {
      const product = productDetails.productId;
      const idx = findVariantIndex(product?.variants, selectedAttributes);
      if (idx !== -1) {
        setSelectedVariant(product.variants[idx]);
        const variantImages = product.variants[idx]?.images;
        if (variantImages?.length > 0) {
          setSelectedImageIndex(0);
        }
      }
    }
  }, [selectedAttributes, productDetails]);

  // Auto-rotate images every 3 seconds
  useEffect(() => {
    const product = productDetails?.productId;
    const varImgs =
      selectedVariant?.images?.length > 0 ? selectedVariant.images : [];
    const prodImgs = product?.images || [];
    const imgs =
      varImgs.length > 0
        ? varImgs
        : prodImgs.length > 0
          ? prodImgs
          : product?.variants?.[0]?.images || [];
    startAutoRotate(imgs);
    return () => clearInterval(autoRotateRef.current);
  }, [selectedVariant, productDetails]);

  /* ── auto-rotate main image every 3 seconds ── */
  const autoRotateRef = useRef(null);

  const startAutoRotate = (imgArray) => {
    if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    if (!imgArray || imgArray.length <= 1) return;
    autoRotateRef.current = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % imgArray.length);
    }, 3000);
  };

  useEffect(() => {
    return () => clearInterval(autoRotateRef.current);
  }, []);

  const changeImage = (index) => {
    setSelectedImageIndex(index);
    // reset timer on manual click
    const product = productDetails?.productId;
    console.log(product, "productDetails?.productId");
    const varImgs =
      selectedVariant?.images?.length > 0 ? selectedVariant.images : [];
    const prodImgs = product?.images || [];
    const imgs =
      varImgs.length > 0
        ? varImgs
        : prodImgs.length > 0
          ? prodImgs
          : product?.variants?.[0]?.images || [];
    startAutoRotate(imgs);
  };

  const handleAddtoCart = async () => {
    if (!selectedVariant || !selectedVariant._id) {
      toast.error("Please select a variant");
      return;
    }
    setAddingToCart(true);
    try {
      const cartItem = {
        productId: productDetails?.productId?._id,
        variantId: selectedVariant._id,
        quantity: 1,
      };

      await dispatch(addCart(cartItem));
      dispatch(getCart());
      dispatch(getCounts());
      window.scrollTo(0, 0, "smooth");
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error(error?.message || "Something went wrong");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!selectedVariant || !selectedVariant._id) {
      toast.error("Please select a variant");
      return;
    }
    setBuyingNow(true);
    try {
      const cartItem = {
        productId: productDetails?.productId?._id,
        variantId: selectedVariant._id,
        quantity: 1,
      };

      await dispatch(addCart(cartItem));
      dispatch(getCart());
      router.push("/cart");
    } catch (error) {
      console.error("Buy now error:", error);
      toast.error(error?.message || "Something went wrong");
    } finally {
      setBuyingNow(false);
    }
  };

  // Handler for Try On button
  const handleTryOnClick = () => {
    if (!isUserLoggedIn) {
      setShowLoginModal(true);
    } else {
      setShowWarningModal(true);
    }
  };

  const addToWishlist = async () => {
    if (!selectedVariant || !selectedVariant._id) {
      toast.error("Invalid variant");
      return;
    }

    try {
      if (isUserLoggedIn) {
        // 🔹 Optimistic UI update
        setWishlistStatus((prev) => ({
          ...prev,
          [selectedVariant._id]: !prev[selectedVariant._id],
        }));

        const result = await dispatch(
          wishCart({
            productId: productDetails?.productId?._id,
            variantId: selectedVariant._id,
          }),
        );
        dispatch(wishListCart());

        if (result?.error) {
          // rollback if API fails
          setWishlistStatus((prev) => ({
            ...prev,
            [selectedVariant._id]: !prev[selectedVariant._id],
          }));
          toast.error(result?.message || "Failed to update wishlist");
        } else {
          toast.success(
            wishlistStatus[selectedVariant._id]
              ? "Removed from Wishlist"
              : "Added to Wishlist",
          );
        }
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error(error?.message);
      toast.error("Failed to update wishlist");
    }
  };

  /* ── generic attribute selection handler ── */
  const handleAttributeSelect = (attrId, valId) => {
    const next = { ...selectedAttributes, [attrId]: valId };
    const variants = productDetails?.productId?.variants;

    // If the new selection doesn't have an exact match, auto-fix
    // incompatible attributes (e.g. pick the first available size
    // when the chosen colour doesn't pair with the current size).
    if (variants?.length) {
      const exactMatch = variants.some((v) =>
        Object.entries(next).every(([aId, vId]) =>
          v.combination?.some(
            (c) =>
              getAttrId(c?.attributeId) === aId && getValId(c?.valueId) === vId,
          ),
        ),
      );

      if (!exactMatch) {
        for (const attr of attributes) {
          const otherAttrId = attr._id;
          if (otherAttrId === attrId || !next[otherAttrId]) continue;

          const compatible = variants.some(
            (v) =>
              v.combination?.some(
                (c) =>
                  getAttrId(c?.attributeId) === attrId &&
                  getValId(c?.valueId) === valId,
              ) &&
              v.combination?.some(
                (c) =>
                  getAttrId(c?.attributeId) === otherAttrId &&
                  getValId(c?.valueId) === next[otherAttrId],
              ),
          );

          if (!compatible) {
            const firstAvailable = variants
              .filter((v) =>
                v.combination?.some(
                  (c) =>
                    getAttrId(c?.attributeId) === attrId &&
                    getValId(c?.valueId) === valId,
                ),
              )
              .flatMap((v) =>
                (v.combination || [])
                  .filter((c) => getAttrId(c?.attributeId) === otherAttrId)
                  .map((c) => getValId(c?.valueId)),
              )[0];

            if (firstAvailable) {
              next[otherAttrId] = firstAvailable;
            }
          }
        }
      }
    }

    setSelectedAttributes(next);
  };

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div className="productdetailspage pt-lg-4 pb-lg-5">
      <div className="container">
        <div className="row">
          {/* Image Gallery Skeleton */}
          <div className="col-md-6 colleft">
            <div className="productshow">
              <div
                className="productmainimg skeleton-image"
                style={{ height: "600px", borderRadius: "8px" }}
              />
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
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="col-md-6 colright">
            <div className="productright">
              <div className="productdetilstop mb-4">
                <div
                  className="skeleton-line"
                  style={{ width: "30%", height: "16px", marginBottom: "12px" }}
                />
                <div
                  className="skeleton-line"
                  style={{ width: "70%", height: "28px", marginBottom: "12px" }}
                />
                <div
                  className="skeleton-line"
                  style={{ width: "40%", height: "32px", marginBottom: "20px" }}
                />
              </div>

              <div className="productdetilmid mb-4">
                <div className="mb-3 border-bottom pb-3">
                  <div
                    className="skeleton-line"
                    style={{
                      width: "25%",
                      height: "18px",
                      marginBottom: "12px",
                    }}
                  />
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
                      />
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <div
                    className="skeleton-line"
                    style={{
                      width: "25%",
                      height: "18px",
                      marginBottom: "12px",
                    }}
                  />
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
                      />
                    ))}
                  </div>
                </div>
                <div className="row mt-4">
                  <div className="col-md-6 mb-md-0 mb-3">
                    <div
                      className="skeleton-line"
                      style={{
                        width: "100%",
                        height: "50px",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <div className="col-md-6">
                    <div
                      className="skeleton-line"
                      style={{
                        width: "100%",
                        height: "50px",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Accordion Skeleton */}
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
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
                .skeleton-image,
                .skeleton-thumbnail,
                .skeleton-line,
                .skeleton-circle {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: 4px;
                }
                @keyframes shimmer {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .skeleton-circle {
                    border-radius: 50% !important;
                }
            `}</style>
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="productdetailspage pt-lg-4 pb-lg-5">
        <div className="container">
          <div className="alert alert-danger text-center">
            {error}
            <button className="btn btn-dark ms-3" onClick={getProductDetails}>
              {t("Try Again")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!productDetails) {
    return (
      <div className="productdetailspage pt-lg-4 pb-lg-5">
        <div className="container">
          <div className="alert alert-warning text-center">
            {t("No product details available")}
          </div>
        </div>
      </div>
    );
  }

  const product = productDetails.productId;
  const variantImages =
    selectedVariant?.images?.length > 0 ? selectedVariant.images : [];
  const productImages = product?.images || [];
  const images =
    variantImages.length > 0
      ? variantImages
      : productImages.length > 0
        ? productImages
        : product?.variants?.[0]?.images || [];
  const mainImage =
    images[selectedImageIndex]?.url ||
    images[0]?.url ||
    "/assets/img/dummy.jpg";

  return (
    mainImage && (
      <>
        {(addingToCart || buyingNow) && <Loading />}
        <div className="productdetailspage pt-lg-4 pb-lg-5">
          <div className="container">
            <div className="row">
              <div className="col-md-6 colleft">
                <div className="productshow">
                  <div
                    className={
                      isMobile
                        ? "productmaindetailimgmobile"
                        : "productmaindetailimg"
                    }
                  >
                    <img
                      id="mainProductImage"
                      src={mainImage}
                      alt={product?.name_en || "Product Image"}
                      style={{
                        width: "100%",
                        height: isMobile ? "550px" : "750px",
                        objectFit: "contain !important",
                      }}
                    />
                    <button
                      className="favicon"
                      onClick={addToWishlist}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                      }}
                    >
                      <img
                        src={
                          wishlistStatus[selectedVariant?._id]
                            ? "/assets/img/liked.png"
                            : "/assets/img/heart.png"
                        }
                        alt="Add to favorites"
                      />
                    </button>
                  </div>
                  {images.length > 0 && (
                    <div className="producthumbnail">
                      {console.log(images, "Images----")}
                      {images.map((image, index) => (
                        <div key={index} className="thumbnailbox">
                          <img
                            src={image.url}
                            alt={`Thumbnail ${index + 1}`}
                            onClick={() => changeImage(index)}
                            style={{
                              // width: '80px',
                              // height: '80px',
                              objectFit: "cover",
                              cursor: "pointer",
                              border:
                                selectedImageIndex === index
                                  ? "2px solid #007bff"
                                  : "1px solid #ddd",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-6 colright">
                <div className="productright">
                  <div className="productdetilstop">
                    <div className="row align-items-center">
                      <div className="col">
                        <div className="sku mb-1">
                          SKU#: {product?.productId || "N/A"}
                        </div>
                        <div className="prdtnamee mb-1">
                          {i18next.language === "ar"
                            ? product?.name_ar
                            : product?.name_en || "Product Name"}
                        </div>
                        {/* <div className="prdtpriceee">
                                                    {currency === 'Saudi Arabia'
                                                        ? 'SAR'
                                                        : currency === 'Qatar'
                                                            ? 'QAR'
                                                            : currency === 'United Arab Emirates'
                                                                ? 'AED'
                                                                : currency === 'United States'
                                                                    ? '$'
                                                                    : '$'}{selectedVariant?.price.toFixed(2) || product?.price || "0.00"}
                                                </div> */}
                        <div className="prdtpriceee">
                          {selectedVariant?.discountPrice ? (
                            <>
                              <span className="original-price text-muted text-decoration-line-through me-2">
                                {formatPrice(selectedVariant.price || 0)}
                              </span>{" "}
                              <span className="discounted-price text-danger fw-bold">
                                {formatPrice(
                                  selectedVariant.totalPrice ||
                                    selectedVariant.price ||
                                    0,
                                )}
                              </span>
                              {selectedVariant.discountPercentage && (
                                <span className="discount-percentage text-success ms-2">
                                  (
                                  {Math.round(
                                    selectedVariant.discountPercentage || 0,
                                  )}
                                  % {t("OFF")})
                                </span>
                              )}
                            </>
                          ) : (
                            <div>
                              {" "}
                              {formatPrice(selectedVariant?.price || 0)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-auto">
                        <button
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                          }}
                          onClick={async () => {
                            try {
                              // Build product-specific URL safely
                              const productUrl = `${window.location.origin}/Product/${product?._id}`;
                              console.log(productUrl);
                              if (navigator.share) {
                                await navigator.share({
                                  title: product?.name_en || "Product",
                                  text: product?.description_en || "",
                                  url: productUrl,
                                });
                              } else if (navigator.clipboard) {
                                await navigator.clipboard.writeText(productUrl);
                                toast.success("Link copied to clipboard!");
                              } else {
                                // Fallback method for older browsers
                                const textArea =
                                  document.createElement("textarea");
                                textArea.value = productUrl;
                                document.body.appendChild(textArea);
                                textArea.select();
                                document.execCommand("copy");
                                document.body.removeChild(textArea);
                                toast.success("Link copied to clipboard!");
                              }
                            } catch (err) {
                              console.error("Share error:", err);
                              toast.error(
                                "Unable to share link. Please copy manually.",
                              );
                            }
                          }}
                        >
                          <img src="/assets/img/upload.png" alt="Share" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="productdetilmid mb-4">
                    <div className="row mb-4">
                      <div className="col-md-12 mb-0">
                        <div className="row addtocartmodalmain">
                          {/* Dynamic Attribute Selectors */}
                          {(attributes || []).map((attr) => {
                            const attrId = attr._id;
                            const attrName = attr.name_en;
                            const isColor = isColorAttribute(attrName);
                            const isSize = isSizeAttribute(attrName);
                            const availableIds = getAvailableValueIds(attrId);

                            return (
                              <div
                                key={attrId}
                                className="col-md-12 mb-3 border-bottom pb-3"
                              >
                                <div className="row">
                                  {/* attribute label */}
                                  <div className="col-md-12 mb-2 d-flex align-items-center justify-content-between">
                                    <div className="cartoptionhead">
                                      {t("Select")}{" "}
                                      {isRTL ? attr.name_ar : attrName}:{" "}
                                      <span style={{ fontWeight: 400 }}>
                                        {(() => {
                                          const selVal = attr.values?.find(
                                            (v) =>
                                              v._id ===
                                              selectedAttributes[attrId],
                                          );
                                          if (!selVal) return t("Select");
                                          return isRTL
                                            ? selVal.name_ar
                                            : selVal.name_en;
                                        })()}
                                      </span>
                                    </div>
                                    {isSize && (
                                      <button
                                        className="sizeguide"
                                        href="javascript:void(0);"
                                        data-bs-toggle="modal"
                                        data-bs-target="#sizeguide"
                                        style={{
                                          background: "none",
                                          border: "none",
                                          textDecoration: "underline",
                                          cursor: "pointer",
                                        }}
                                      >
                                        {t("Size Guide")}
                                      </button>
                                    )}
                                  </div>

                                  {/* attribute values */}
                                  <div className="col-md-12">
                                    <div className="row flex-nowrap px-2">
                                      {(attr.values || []).map((val) => {
                                        const valId = val._id;
                                        const isSelected =
                                          selectedAttributes[attrId] === valId;
                                        const existsInAnyVariant =
                                          hasAnyVariantForValue(attrId, valId);
                                        const isAvailableNow =
                                          availableIds.has(valId);

                                        /* ─ colour swatch ─ */
                                        if (isColor) {
                                          const bgColor =
                                            COLOUR_MAP[val.name_en] ||
                                            val.color_code ||
                                            null;
                                          const colorImage = val.image?.url;

                                          return (
                                            <div
                                              key={valId}
                                              className="col-auto px-1"
                                            >
                                              <button
                                                className={`cartcolor ${isSelected ? "active" : ""}`}
                                                onClick={() =>
                                                  handleAttributeSelect(
                                                    attrId,
                                                    valId,
                                                  )
                                                }
                                                title={val.name_en}
                                                style={{
                                                  border: isSelected
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
                                                  opacity: 1,
                                                  cursor: "pointer",
                                                  position: "relative",
                                                }}
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
                                                    alt={val.name_en}
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
                                        }

                                        /* ─ generic / size pill ─ */
                                        return (
                                          <div
                                            key={valId}
                                            className="col-auto px-1"
                                          >
                                            <button
                                              className={`selectsizee ${isSelected ? "active" : ""}`}
                                              disabled={
                                                !existsInAnyVariant ||
                                                !isAvailableNow
                                              }
                                              onClick={() =>
                                                handleAttributeSelect(
                                                  attrId,
                                                  valId,
                                                )
                                              }
                                              title={
                                                !existsInAnyVariant
                                                  ? `${val.name_en} — ${t("Unavailable")}`
                                                  : !isAvailableNow
                                                    ? `${val.name_en} — ${t("Not available with current selection")}`
                                                    : val.name_en
                                              }
                                              style={{
                                                background: isSelected
                                                  ? ""
                                                  : "white",
                                                border: "1px solid #ddd",
                                                opacity: !existsInAnyVariant
                                                  ? 0.3
                                                  : !isAvailableNow
                                                    ? 0.4
                                                    : 1,
                                                cursor:
                                                  !existsInAnyVariant ||
                                                  !isAvailableNow
                                                    ? "not-allowed"
                                                    : "pointer",
                                                textDecoration:
                                                  !existsInAnyVariant
                                                    ? "line-through"
                                                    : "none",
                                              }}
                                            >
                                              {isRTL
                                                ? val.name_ar
                                                : val.name_en}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-12 mb-md-0 mb-3 py-2">
                        {product?.categoryId?.[0]?.name_en ===
                        "Accessories" ? null : (
                          <button
                            className="authbtns1"
                            style={{ width: "100%" }}
                            onClick={handleTryOnClick}
                          >
                            <img src="/assets/img/tryon.png" alt="Try on" />{" "}
                            {t("products.tryOn")}
                          </button>
                        )}
                      </div>
                      <div className="col-md-6 mb-md-0 mb-3">
                        <button
                          className="authbtns1"
                          style={{ width: "100%" }}
                          onClick={handleBuyNow}
                          disabled={addingToCart}
                        >
                          {t("BUY NOW")}
                        </button>
                      </div>
                      <div className="col-md-6">
                        <button
                          className="authbtns2"
                          style={{
                            width: "100%",
                            opacity: addingToCart ? 0.7 : 1,
                            cursor: addingToCart ? "not-allowed" : "pointer",
                          }}
                          onClick={handleAddtoCart}
                          disabled={addingToCart}
                        >
                          {addingToCart ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              />
                              {t("ADDING...")}
                            </>
                          ) : (
                            t("ADD TO CART")
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* <hr /> */}
                  <div className="productdetbottom">
                    {/* <div className="row justify-content-center text-center mt-3">
                                  {
                                    isMobile ? (
                                         <img src="/assets/img/Frame.png" alt="" />
                                    ):(
                                        <>
  <div className="col-auto d-flex align-items-center mx-3">
    <img src="/assets/img/delivery.png" alt="Delivery" className="me-2" />
    <span><>Delivery in 2-5 Days</></span>
  </div>
  <div className="col-auto d-flex align-items-center mx-3">
    <img src="/assets/img/lockk.png" alt="Safe Payments" className="me-2" />
    <span><>Safe Payments</></span>
  </div>
  <div className="col-auto d-flex align-items-center mx-3">
    <img src="/assets/img/box.png" alt="Free Shipping" className="me-2" />
    <span><>Free Shipping</></span>
  </div>
  </>
                                    )
                                  }

</div> */}

                    <div className="accordion my-3" id="accordionExample">
                      <div className="accordion-item mb-3">
                        <h2 className="accordion-header" id="headingOne">
                          <button
                            className="accordion-button"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseOne"
                            aria-expanded="false"
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
                            <div className="d-flex justify-content-between pb-2">
                              <span>{t("Category")}</span>
                              <span>
                                {isRTL
                                  ? product?.categoryId?.[0]?.name_ar
                                  : product?.categoryId?.[0]?.name_en ||
                                    "Dress"}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between pb-2">
                              <span>{t("Designer")}</span>
                              <span>
                                {isRTL
                                  ? product?.brandId?.name_ar
                                  : product?.brandId?.name_en || "General"}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between pb-2">
                              <span>{t("Brand")}</span>
                              <span>
                                {isRTL
                                  ? product?.productBrandId?.name_ar
                                  : product?.productBrandId?.name_en ||
                                    "General"}
                              </span>
                            </div>
                            {/* <div className="d-flex justify-content-between pb-0">
                                                            <span>{t('Designer')}</span>
                                                            <span>{isRTL ? product?.brandId?.name_ar : product?.brandId?.name_en || "bn_collection"}</span>
                                                        </div> */}
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
                                ? product?.description_ar
                                : product?.description_en ||
                                  "No description available."}
                            </p>
                          </div>
                        </div>
                      </div>
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
                            {t("products.delivery_timeline")}
                          </button>
                        </h2>
                        <div
                          id="collapseThree"
                          className="accordion-collapse collapse"
                          aria-labelledby="headingThree"
                          data-bs-parent="#accordionExample"
                        >
                          <div className="accordion-body">
                            <div className="d-flex justify-content-between pb-2">
                              <span>{t("Delivery Time")}</span>
                              <span>{t("5-10 business days")}</span>
                            </div>
                            <div className="d-flex justify-content-between pb-0">
                              <span>{t("Return Policy")}</span>
                              <span>{t("Returnable within 7 days")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                    aria-label="Close"
                  />
                  <div className="row pt-3">
                    <div className="col-md-6">
                      <div className="tryontable">
                        <div className="table-responsive">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>{t("STANDARD")}</th>
                                <th>US SIZE</th>
                                <th>EU SIZE</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>XXS</td>
                                <td>4</td>
                                <td>34</td>
                              </tr>
                              <tr>
                                <td>XS</td>
                                <td>6</td>
                                <td>36</td>
                              </tr>
                              <tr>
                                <td>S</td>
                                <td>8</td>
                                <td>38</td>
                              </tr>
                              <tr>
                                <td>M</td>
                                <td>10</td>
                                <td>40</td>
                              </tr>
                              <tr>
                                <td>L</td>
                                <td>12</td>
                                <td>42</td>
                              </tr>
                              <tr>
                                <td>XL</td>
                                <td>14</td>
                                <td>44</td>
                              </tr>
                              <tr>
                                <td>XXL</td>
                                <td>16</td>
                                <td>46</td>
                              </tr>
                              <tr>
                                <td>3XL</td>
                                <td>18</td>
                                <td>48</td>
                              </tr>
                              <tr>
                                <td>4XL</td>
                                <td>16</td>
                                <td>46</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="tryonimg">
                        <img
                          src="/assets/img/tryonimg.png"
                          alt="try on image"
                        />
                      </div>
                    </div>
                    <div className="col-md-12 mb-2 text-center">
                      <div className="noteee">
                        {t(
                          "*Please note the measurements may vary according to different brands and style.",
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className="modal fade commanmodal"
            id="warning"
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
                        <img src="/assets/img/warnning.png" alt="warning" />
                        <h2>{t("Warning")}</h2>
                        <button
                          type="button"
                          className="close d-none"
                          id="ccncl"
                          data-dismiss="modal"
                          aria-label="Close"
                        >
                          <span aria-hidden="true">&times;</span>
                        </button>
                        <p>
                          {t(
                            "This feature lets you preview clothes on a virtual model for a better shopping experience.",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-12 mt-4">
                      <div className="row">
                        <div className="col-md-12">
                          <a
                            className="authbtns1"
                            style={{
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              document.getElementById("ccncl").click();
                              document
                                .querySelector(".modal")
                                .classList.remove("show");
                              document
                                .querySelector(".modal-backdrop")
                                .remove();
                              navigate(
                                `/Product/TryOn/${productDetails?.productId?._id}`,
                              );
                            }}
                          >
                            {t("OKAY")}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <style jsx>
            {`
              .skeleton-box {
                width: 100%;
              }

              .skeleton-image {
                width: 100%;
                height: 400px;
                background: #e0e0e0;
                border-radius: 8px;
                margin-bottom: 15px;
                animation: pulse 1.5s infinite;
              }

              .skeleton-thumbnails {
                display: flex;
                gap: 10px;
              }

              .skeleton-thumbnail {
                width: 80px;
                height: 80px;
                background: #e0e0e0;
                border-radius: 4px;
                animation: pulse 1.5s infinite;
              }

              .skeleton-info {
                width: 100%;
              }

              .skeleton-line {
                height: 16px;
                background: #e0e0e0;
                margin-bottom: 12px;
                border-radius: 4px;
                animation: pulse 1.5s infinite;
              }

              .skeleton-line.short {
                width: 30%;
              }

              .skeleton-line.medium {
                width: 60%;
              }

              .skeleton-line.long {
                width: 100%;
              }

              .skeleton-options {
                margin-bottom: 20px;
              }

              .skeleton-color-options,
              .skeleton-size-options {
                display: flex;
                gap: 10px;
                margin-top: 10px;
              }

              .skeleton-color {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #e0e0e0;
                animation: pulse 1.5s infinite;
              }

              .skeleton-size {
                width: 50px;
                height: 40px;
                border-radius: 4px;
                background: #e0e0e0;
                animation: pulse 1.5s infinite;
              }

              .skeleton-buttons {
                display: flex;
                gap: 15px;
                margin-bottom: 30px;
              }

              .skeleton-button {
                flex: 1;
                height: 50px;
                background: #e0e0e0;
                border-radius: 4px;
                animation: pulse 1.5s infinite;
              }

              .skeleton-accordions {
                display: flex;
                flex-direction: column;
                gap: 15px;
              }

              .skeleton-accordion {
                height: 50px;
                background: #e0e0e0;
                border-radius: 4px;
                animation: pulse 1.5s infinite;
              }

              @keyframes pulse {
                0% {
                  opacity: 1;
                }
                50% {
                  opacity: 0.5;
                }
                100% {
                  opacity: 1;
                }
              }

              .cartcolor.active {
                border: 2px solid #000 !important;
                transform: scale(1.1);

                width: 50px;
                height: 50px;
                border-radius: 50%;
              }

              .selectsizee.active {
                background-color: #000;
                color: #fff;
              }
            `}
          </style>
        </div>
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
                            navigate("*");
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
                            navigate(
                              `/Product/TryOn/${productDetails?.productId?._id}`,
                            );
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
      </>
    )
  );
};

export default ProductDetail;
