// ========NewProductDetails.jsx==========

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
// import JsBarcode from "jsbarcode";
import Header from "@/header/Header";
import Footer from "@/footer/Footer";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import i18next, { t } from "i18next";
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
import { useTranslation } from "react-i18next";
import Head from "next/head";

const language = localStorage.getItem("i18nextLng") || "en";

/* ── colour hex lookup ── */
const COLOUR_MAP = {
  Moka: "#6D3B07",
  Red: "#FF0000",
  Green: "#008000",
  Fuchsia: "#ff00ff",
  Blue: "#0000FF",
  Yellow: "#FFFF00",
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
  Fuchsia: "#ff00ff",
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

/* ── Barcode component ── */
// const BarcodeDisplay = ({ value }) => {
//     const svgRef = useRef(null);

//     useEffect(() => {
//         if (svgRef.current && value) {
//             try {
//                 JsBarcode(svgRef.current, value, {
//                     format: "CODE128",
//                     width: 1.5,
//                     height: 30,
//                     displayValue: false,
//                     margin: 5,
//                 });
//             } catch (e) {
//                 console.error("Barcode generation error:", e);
//             }
//         }
//     }, [value]);

//     return <svg ref={svgRef} />;
// };

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

/* ================================================================== */
/*  NewProductDetails                                                  */
/* ================================================================== */
const NewProductDetails = () => {
  const isRTL = i18n.dir() === "rtl";
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const searchParamsObj = useSearchParams();
  const variantIdFromUrl = searchParamsObj?.get("variantId");
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  /* responsive */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ── state ── */
  const [productData, setProductData] = useState(null);
  const [products, setNewProducts] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  // Generic attribute selection map: { attributeId -> selected valueId }
  const [selectedAttributes, setSelectedAttributes] = useState({});

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [mainImage, setMainImage] = useState(null);
  const [wishlistStatus, setWishlistStatus] = useState({});

  // modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const { isUserLoggedIn } = useSelector((state) => ({
    isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
  }));

  // Currency
  const [userCountry, setUserCountry] = useState(
    () => localStorage.getItem("country") || "United States",
  );

  // useEffect(() => {
  //     const handleStorageChange = (e) => {
  //         if (e.key === "country") setUserCountry(e.newValue || "United States");
  //     };
  //     const handleCurrencyChange = () =>
  //         setUserCountry(localStorage.getItem("country") || "United States");

  //     window.addEventListener("storage", handleStorageChange);
  //     window.addEventListener("currencyChanged", handleCurrencyChange);
  //     return () => {
  //         window.removeEventListener("storage", handleStorageChange);
  //         window.removeEventListener("currencyChanged", handleCurrencyChange);
  //     };
  // }, []);

  /* ── normalize API response ── */
  const normalizeResponse = (raw) => {
    if (!raw) return null;
    if (raw.product) return raw.product;
    if (raw.variants || raw.attributes || raw.name_en) return raw;
    return raw;
  };

  /* ── fetch product ── */
  const getProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await callMiddleWare({
        method: "GET",
        endpoint: "products/getProductDetails",
        id,
      });

      if (response?.error)
        throw new Error(
          response?.message || t("Failed to fetch product details"),
        );

      const raw = response?.results;
      const normalized = normalizeResponse(raw);
      if (!normalized) throw new Error(t("Invalid product response"));

      normalized.variants = normalized.variants || [];
      // attributes may live at the same level as product (sibling), not inside it
      normalized.attributes = normalized.attributes?.length
        ? normalized.attributes
        : raw?.attributes || [];

      setProductData(normalized);

      // wishlist map
      const initWish = {};
      normalized.variants.forEach((v) => {
        if (v?._id) initWish[v._id] = !!v?.isWishlisted || false;
      });
      setWishlistStatus(initWish);

      /* ── pick initial selections ── */
      let initAttrs = {};
      let initIndex = 0;

      // If variantId comes from URL, derive selections from that variant
      if (variantIdFromUrl) {
        const vIdx = normalized.variants.findIndex(
          (v) => v?._id === variantIdFromUrl,
        );
        if (vIdx !== -1) {
          initIndex = vIdx;
          normalized.variants[vIdx]?.combination?.forEach((comb) => {
            if (comb?.attributeId?._id && comb?.valueId?._id) {
              initAttrs[comb.attributeId._id] = comb.valueId._id;
            }
          });
        }
      }

      // If nothing picked yet, default to the first available variant's combination
      if (Object.keys(initAttrs).length === 0 && normalized.variants.length) {
        const availIdx = normalized.variants.findIndex(
          (v) => v && !v.isDeleted,
        );
        initIndex = availIdx !== -1 ? availIdx : 0;
        normalized.variants[initIndex]?.combination?.forEach((comb) => {
          if (comb?.attributeId?._id && comb?.valueId?._id) {
            initAttrs[comb.attributeId._id] = comb.valueId._id;
          }
        });
      }

      setSelectedAttributes(initAttrs);
      setSelectedVariantIndex(initIndex);

      const chosenV = normalized.variants[initIndex];
      setMainImage(
        chosenV?.images?.[0]?.url ||
          normalized?.images?.[0]?.url ||
          normalized?.thumbnail ||
          "/assets/img/dummy.jpg",
      );
    } catch (err) {
      console.error(err);
      setError(err?.message || t("Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) getProductDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Re-fetch product details when currency/country changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      if (id) getProductDetails();
      getSimilar(); // Also re-fetch similar products
    };
    const handleStorageChange = (e) => {
      if (e.key === "country" && id) {
        getProductDetails();
        getSimilar(); // Also re-fetch similar products
      }
    };

    window.addEventListener("currencyChanged", handleCurrencyChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("currencyChanged", handleCurrencyChange);
      window.removeEventListener("storage", handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Re-sync when variantId in URL changes after product loaded
  useEffect(() => {
    if (!variantIdFromUrl || !productData?.variants) return;
    const vIdx = productData.variants.findIndex(
      (v) => v?._id === variantIdFromUrl,
    );
    if (vIdx === -1) return;
    setSelectedVariantIndex(vIdx);
    const attrs = {};
    productData.variants[vIdx]?.combination?.forEach((comb) => {
      if (comb?.attributeId?._id && comb?.valueId?._id)
        attrs[comb.attributeId._id] = comb.valueId._id;
    });
    setSelectedAttributes(attrs);
    if (productData.variants[vIdx]?.images?.[0]?.url)
      setMainImage(productData.variants[vIdx].images[0].url);
  }, [variantIdFromUrl, productData]);

  /* ── recommended / similar ── */
  const getRecommended = useCallback(async () => {
    try {
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "products/getRecomendedAccessories",
        data: { page: 1, pageSize: 100, productId: id },
      });
      setNewProducts(response?.results?.products || []);
    } catch (error) {
      console.error("Recommended fetch error:", error?.message);
    }
  }, [id]);

  const getSimilar = useCallback(async () => {
    try {
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "products/getSimilarProducts",
        data: { page: 1, pageSize: 100, productId: id },
      });
      setSimilar(response?.results?.products || []);
    } catch (error) {
      console.error("Similar fetch error:", error?.message);
    }
  }, [id]);

  useEffect(() => {
    getRecommended();
    getSimilar();
  }, [getRecommended, getSimilar]);

  /* ================================================================ */
  /*  CORE: variant ↔ attribute mapping helpers                        */
  /* ================================================================ */

  /**
   * Build a Set of valueIds that exist in at least one variant for a given
   * attributeId, optionally constrained by the current selections on OTHER
   * attributes. This enables cross-attribute filtering: once the user picks
   * a colour, only sizes that pair with that colour stay enabled, and vice
   * versa.
   */
  // helper: get the _id from an attributeId field that may be a string or object
  const getAttrId = (field) => (typeof field === "string" ? field : field?._id);
  const getValId = (field) => (typeof field === "string" ? field : field?._id);

  const getAvailableValueIds = useCallback(
    (targetAttrId) => {
      if (!productData?.variants) return new Set();

      const otherSelections = { ...selectedAttributes };
      delete otherSelections[targetAttrId]; // don't filter by self

      return new Set(
        productData.variants
          .filter((variant) => {
            // variant must match every OTHER currently-selected attribute
            return Object.entries(otherSelections).every(([attrId, valId]) =>
              variant.combination?.some(
                (c) =>
                  getAttrId(c?.attributeId) === attrId &&
                  getValId(c?.valueId) === valId,
              ),
            );
          })
          .flatMap((variant) =>
            (variant.combination || [])
              .filter((c) => getAttrId(c?.attributeId) === targetAttrId)
              .map((c) => getValId(c?.valueId)),
          ),
      );
    },
    [productData, selectedAttributes],
  );

  /**
   * Check whether ANY variant at all exists that contains a given valueId
   * for a given attributeId (ignoring other selections). Used to show a
   * value as absolutely unavailable (no variant has it at all) vs just
   * incompatible with the current selection.
   */
  const hasAnyVariantForValue = useCallback(
    (attrId, valId) => {
      if (!productData?.variants) return false;
      return productData.variants.some((v) =>
        v.combination?.some(
          (c) =>
            getAttrId(c?.attributeId) === attrId &&
            getValId(c?.valueId) === valId,
        ),
      );
    },
    [productData],
  );

  /* ── find matching variant index from current selections ── */
  const findVariantIndex = useCallback(
    (attrs) => {
      if (!productData?.variants) return -1;
      const entries = Object.entries(attrs);
      if (!entries.length) return -1;

      // prefer exact full match first
      const exactIdx = productData.variants.findIndex((v) =>
        entries.every(([attrId, valId]) =>
          v.combination?.some(
            (c) =>
              getAttrId(c?.attributeId) === attrId &&
              getValId(c?.valueId) === valId,
          ),
        ),
      );
      if (exactIdx !== -1) return exactIdx;

      // partial match fallback (most attributes matched)
      let bestIdx = -1;
      let bestCount = 0;
      productData.variants.forEach((v, idx) => {
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
    },
    [productData],
  );

  /* ── attribute selection handler ── */
  const handleAttributeSelect = (attrId, valId) => {
    const next = { ...selectedAttributes, [attrId]: valId };
    const variants = productData?.variants;

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
        const attrs = productData?.attributes || [];
        for (const attr of attrs) {
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

    const idx = findVariantIndex(next);
    if (idx !== -1) {
      setSelectedVariantIndex(idx);
      const v = productData.variants[idx];
      const img = v?.images?.[0]?.url;
      if (img) setMainImage(img);
    }
  };

  /* ── current variant ── */
  const currentVariantAll = productData?.variants || null;
  const currentVariant = productData?.variants?.[selectedVariantIndex] || null;

  /* ── all images: variant images + product images ── */
  const allImages = useMemo(() => {
    const imgs = [];
    if (productData?.images?.length) {
      productData.images.forEach((img) => {
        if (!imgs.includes(img.url)) imgs.push(img.url);
      });
    }

    currentVariantAll?.forEach((itemVariant) => {
      itemVariant?.images?.forEach((img) => {
        if (img?.url && img.url.trim() !== "") {
          if (!imgs.includes(img.url)) {
            imgs.push(img.url);
          }
        }
      });
    });

    // if (currentVariant?.images?.length) {
    //   currentVariant.images.forEach((img) => imgs.push(img.url));
    // }

    if (!imgs.length) imgs.push("/assets/img/dummy.jpg");
    return imgs;
  }, [currentVariantAll, productData]);

  /* ── auto-rotate main image every 3 seconds ── */
  const autoRotateRef = useRef(null);

  // useEffect(() => {
  //   if (allImages.length <= 1) return;
  //   autoRotateRef.current = setInterval(() => {
  //     setMainImage((prev) => {
  //       const currentIdx = allImages.indexOf(prev);
  //       const nextIdx = (currentIdx + 1) % allImages.length;
  //       return allImages[nextIdx];
  //     });
  //   }, 3000);
  //   return () => clearInterval(autoRotateRef.current);
  // }, [allImages]);

  // Reset timer when user manually picks a thumbnail
  const handleThumbnailClick = (url) => {
    setMainImage(url);
    if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    autoRotateRef.current = setInterval(() => {
      setMainImage((prev) => {
        const currentIdx = allImages.indexOf(prev);
        const nextIdx = (currentIdx + 1) % allImages.length;
        return allImages[nextIdx];
      });
    }, 3000);
  };

  /* ── price formatting ── */
  const formatPrice = (price) => {
    const map = {
      "Saudi Arabia": "SAR",
      "United States": "USD",
      "United Arab Emirates": "AED",
      Qatar: "QAR",
      Kuwait: "KWD",
      Oman: "OMR",
      "United Kingdom": "GBP",
    };
    const code = map[userCountry] || "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
    })
      .format(price)
      .replace(/^([^\d]+)/, "$1 ");
  };

  /* ── cart / wishlist handlers ── */
  const handleAddtoCart = async (product, variant) => {
    if (!variant?._id) {
      toast.error(t("Please select a variant"));
      return;
    }
    setAddingToCart(true);
    try {
      await dispatch(
        addCart({
          productId: product?._id,
          variantId: variant._id,
          quantity: 1,
        }),
      );
      dispatch(getCounts());
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error(err?.message || t("Something went wrong"));
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async (product, variant) => {
    if (!variant?._id) {
      toast.error(t("Please select a variant"));
      return;
    }
    try {
      await dispatch(
        addCart({
          productId: product?._id,
          variantId: variant._id,
          quantity: 1,
        }),
      );
      dispatch(getCart());
      dispatch(setScreenState("Address"));
      router.push("/cart");
    } catch (err) {
      console.error("Buy now error:", err);
      toast.error(err?.message || t("Something went wrong"));
    }
  };

  const addToWishlist = async (productId, variant) => {
    if (!variant?._id) {
      toast.error(t("Invalid variant"));
      return;
    }
    if (!isUserLoggedIn) {
      router.push("*");
      return;
    }
    const vid = variant._id;
    setWishlistStatus((prev) => ({ ...prev, [vid]: !prev[vid] }));
    try {
      const result = await dispatch(wishCart({ productId, variantId: vid }));
      if (result?.error) {
        setWishlistStatus((prev) => ({ ...prev, [vid]: !prev[vid] }));
        toast.error(result?.message || t("Failed to update wishlist"));
      } else {
        dispatch(wishListCart());
        toast.success(
          wishlistStatus[vid]
            ? t("Removed from Wishlist")
            : t("Added to Wishlist"),
        );
      }
    } catch {
      setWishlistStatus((prev) => ({ ...prev, [vid]: !prev[vid] }));
      toast.error(t("Failed to update wishlist"));
    }
  };

  const handleShare = async () => {
    try {
      const productUrl = `${window.location.origin}/Product/${productData?._id}`;
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
      }
    } catch (err) {
      console.error("Share error:", err);
      toast.error(t("unable_to_copy"));
    }
  };

  const handleTryOnClick = () => {
    if (!isUserLoggedIn) setShowLoginModal(true);
    else setShowWarningModal(true);
  };

  const isArabic = i18next.language?.startsWith("ar");

  const getTagText = (product) => {
    if (!product?.tags?.length) return "";

    const isArabic = i18next.language?.startsWith("ar");

    return product.tags
      .map((item) => (isArabic ? item?.name_ar : item?.name_en))
      .filter(Boolean)
      .join(", ");
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  const title =
    language === "ar"
      ? `${productData?.name_ar || productData?.name_en || ""} | فستان مصمم حصري – بيانكا نيرا`
      : `${productData?.name_en || ""} | Exclusive Designer Dress – Bianca Nera`;

  const description =
    language === "ar"
      ? `تسوقي ${productData?.name_ar || productData?.name_en || ""} حصرياً من بيانكا نيرا. اكتشفي هذه القطعة المصممة الرائعة المصنوعة بأناقة. توصيل مجاني إلى قطر والسعودية والإمارات والخليج.`
      : `Shop ${productData?.name_en || ""} exclusively at Bianca Nera. Discover this stunning designer piece crafted for elegance. Free delivery to Qatar, KSA, UAE & GCC.`;
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />

        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta
          property="og:image"
          content="https://bianca-nera.com/assets/img/image-1.jpg"
        />
        <meta
          property="og:url"
          content={`https://bianca-nera.com/Product/${id}`}
        />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Bianca Nera Product" />
        <meta name="twitter:description" content="Explore this product" />
        <meta
          name="twitter:image"
          content="https://bianca-nera.com/assets/img/image-1.jpg"
        />
      </Head>
      <Header />

      {/* breadcrumb */}
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
            {/* ── LEFT: images ── */}
            <div className="col-md-6 colleft">
              {loading ? (
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
              ) : (
                <div className="productshow">
                  {/* <div className="productshowType">
                    {getTagText(productData)}
                  </div> */}
                  <div className="productmainimg">
                    <div
                      className={
                        isMobile ? "" : "h-100 w-fit-content position-relative"
                      }
                    >
                      <img
                        id="mainProductImage"
                        src={mainImage || "/assets/img/dummy.jpg"}
                        alt={productData?.name_en || t("Product")}
                        style={
                          isMobile
                            ? {
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }
                            : {
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }
                        }
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
                        />
                      </a>
                      {productData?.categoryId?.[0]?.name_en !==
                        "Accessories" && (
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

                  {/* thumbnails */}
                  {allImages.length > 1 && (
                    <div className="producthumbnail no-scrollbar">
                      {allImages.map((url, index) => (
                        <div key={index} className="thumbnailbox">
                          <img
                            src={url}
                            alt={t("Thumbnail") + ` ${index + 1}`}
                            onClick={() => handleThumbnailClick(url)}
                            style={{
                              cursor: "pointer",
                              width: "151px",
                              height: "151px",
                              border:
                                mainImage === url
                                  ? "2px solid #000"
                                  : "1px solid #ddd",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT: product info ── */}
            <div className="col-md-6 colright">
              {loading ? (
                <SkeletonRight />
              ) : (
                <div className="productright">
                  {/* ── top: name / price / share ── */}
                  <div className="productdetilstop">
                    <div className="row align-items-center">
                      <div className="col">
                        {/* <div className="sku mb-1">
                                                    {t("SKU#")}: {productData?.productId || t("N/A")}
                                                </div> */}
                        {/* Bar Code */}
                        <div className="sku mb-1">
                          {/* {currentVariant?.oceanBarCode && (
                                                        <BarcodeDisplay value={currentVariant.oceanBarCode} />
                                                    )} */}
                          {currentVariant?.oceanBarCode === "0" ||
                          currentVariant?.oceanBarCode === 0
                            ? null
                            : currentVariant?.oceanBarCode}
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
                              </span>
                              <span className="discounted-price text-danger fw-bold">
                                {formatPrice(
                                  currentVariant.totalPrice ||
                                    currentVariant.price ||
                                    0,
                                )}
                              </span>
                            </>
                          ) : (
                            formatPrice(
                              currentVariant?.price || productData?.price || 0,
                            )
                          )}
                        </div>
                      </div>
                      {/* <div className="col-auto">
                                                <a onClick={handleShare} style={{ cursor: "pointer" }}>
                                                    <img
                                                        src="/assets/img/upload.png"
                                                        alt={t("Share")}
                                                    />
                                                </a>
                                            </div> */}
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
                              const productUrl = `${window.location.origin}/Product/${productData?._id}`;
                              console.log(productUrl);
                              if (navigator.share) {
                                await navigator.share({
                                  title: productData?.name_en || "Product",
                                  text: productData?.description_en || "",
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

                  {/* ── mid: dynamic attribute selectors ── */}
                  <div className="productdetilmid mb-4">
                    <div className="row mb-4">
                      <div className="col-md-12 mb-0">
                        <div className="row addtocartmodalmain">
                          {(productData?.attributes || []).map((attr) => {
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

                                    {/* size guide link (only for size attrs) */}
                                    {isSize && productData?.sizeChart && (
                                      <a
                                        className="sizeguide"
                                        href="#!"
                                        data-bs-toggle="modal"
                                        data-bs-target="#sizeguide"
                                      >
                                        {t("Size Guide")}
                                      </a>
                                    )}
                                  </div>

                                  {/* attribute values */}
                                  <div className="col-md-12">
                                    <div className="row g-2 px-2">
                                      {(() => {
                                        // Step 1: Collect all unique values for this attribute from all variants
                                        const uniqueValueMap = new Map();
                                        (productData?.variants || []).forEach(
                                          (variant) => {
                                            (
                                              variant?.combination || []
                                            ).forEach((combo) => {
                                              if (
                                                getAttrId(
                                                  combo?.attributeId,
                                                ) === attrId
                                              ) {
                                                const valId = getValId(
                                                  combo?.valueId,
                                                );
                                                if (
                                                  !uniqueValueMap.has(valId)
                                                ) {
                                                  uniqueValueMap.set(
                                                    valId,
                                                    combo.valueId,
                                                  );
                                                }
                                              }
                                            });
                                          },
                                        );

                                        // Step 2: Render each unique value
                                        return Array.from(
                                          uniqueValueMap.entries(),
                                        ).map(([valId, valueData]) => {
                                          const isSelected =
                                            selectedAttributes[attrId] ===
                                            valId;
                                          const existsInAnyVariant =
                                            hasAnyVariantForValue(
                                              attrId,
                                              valId,
                                            );
                                          const isAvailableNow =
                                            availableIds.has(valId);

                                          /* ─ colour swatch ─ */
                                          if (isColor) {
                                            // Hide color if it doesn't exist in any variant combination
                                            if (!existsInAnyVariant)
                                              return null;

                                            const bgColor =
                                              valueData?.color_code ||
                                              COLOUR_MAP[valueData?.name_en] ||
                                              null;

                                            const colorImage =
                                              valueData?.image?.url;

                                            return (
                                              <div
                                                key={valId}
                                                className="col-auto px-1"
                                              >
                                                <button
                                                  className={`cartcolor ${
                                                    isSelected ? "active" : ""
                                                  }`}
                                                  onClick={() =>
                                                    handleAttributeSelect(
                                                      attrId,
                                                      valId,
                                                    )
                                                  }
                                                  title={
                                                    isRTL
                                                      ? valueData?.name_ar
                                                      : valueData?.name_en
                                                  }
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
                                                        backgroundColor:
                                                          bgColor,
                                                      }}
                                                    />
                                                  ) : colorImage ? (
                                                    <img
                                                      src={colorImage}
                                                      alt={valueData?.name_en}
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
                                                className={`selectsizee ${
                                                  isSelected ? "active" : ""
                                                }`}
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
                                                    ? `${valueData?.name_en} — ${t("Unavailable")}`
                                                    : !isAvailableNow
                                                      ? `${valueData?.name_en} — ${t("Not available with current selection")}`
                                                      : valueData?.name_en
                                                }
                                                style={{
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
                                                  ? valueData?.name_ar
                                                  : valueData?.name_en}
                                              </button>
                                            </div>
                                          );
                                        });
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* variant status badge */}
                          {productData?.attributes?.length > 0 && (
                            <div className="col-md-12">
                              {(() => {
                                // Check if an exact variant exists for all selected attributes
                                const entries =
                                  Object.entries(selectedAttributes);
                                const hasExactMatch =
                                  entries.length > 0 &&
                                  productData?.variants?.some((v) =>
                                    entries.every(([aId, vId]) =>
                                      v.combination?.some(
                                        (c) =>
                                          getAttrId(c?.attributeId) === aId &&
                                          getValId(c?.valueId) === vId,
                                      ),
                                    ),
                                  );

                                const qty = currentVariant
                                  ? userCountry === "Qatar"
                                    ? currentVariant.qatarQuantity
                                    : currentVariant.quantity
                                  : 0;

                                const isInStock =
                                  hasExactMatch && currentVariant && qty > 0;

                                if (!currentVariant) {
                                  return (
                                    <span
                                      className="badge bg-secondary"
                                      style={{
                                        fontSize: "13px",
                                        padding: "5px 12px",
                                      }}
                                    >
                                      {t("Select options to see availability")}
                                    </span>
                                  );
                                }

                                // return (
                                //   <span
                                //     className="badge"
                                //     style={{
                                //       backgroundColor: isInStock
                                //         ? "#28a745"
                                //         : "#dc3545",
                                //       color: "#fff",
                                //       fontSize: "13px",
                                //       padding: "5px 12px",
                                //     }}
                                //   >
                                //     {isInStock
                                //       ? t("In Stock")
                                //       : t("Out of Stock")}
                                //   </span>
                                // );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* buy / cart buttons */}
                    <div className="row">
                      <div className="col-md-6 mb-md-0 mb-3">
                        <button
                          className="authbtns1 w-100"
                          onClick={() =>
                            handleBuyNow(productData, currentVariant)
                          }
                          disabled={!currentVariant}
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
                          disabled={addingToCart || !currentVariant}
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

                  {/* ── bottom: accordions ── */}
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
                            {productData?.categoryId?.length > 0 && (
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
                                <span>{t("Designer")}</span>
                                <span>
                                  {isRTL
                                    ? productData.brandId?.name_ar
                                    : productData.brandId?.name_en ||
                                      t("General")}
                                </span>
                              </div>
                            )}
                            {productData?.productBrandId && (
                              <div className="d-flex justify-content-between pb-2">
                                <span>{t("Brand")}</span>
                                <span>
                                  {isRTL
                                    ? productData.productBrandId?.name_ar
                                    : productData.productBrandId?.name_en ||
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
                            {/* show selected variant attributes */}
                            {currentVariant?.combination?.map((comb) => (
                              <div
                                key={comb._id}
                                className="d-flex justify-content-between pb-2"
                              >
                                <span>
                                  {isRTL
                                    ? comb.attributeId?.name_ar
                                    : comb.attributeId?.name_en}
                                </span>
                                <span>
                                  {isRTL
                                    ? comb.valueId?.name_ar
                                    : comb.valueId?.name_en}
                                </span>
                              </div>
                            ))}
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

      {/* ── recommended ── */}
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

      {/* ── similar ── */}
      {similar?.length > 0 && (
        <div className="similarproduct py-5">
          <div className="container pb-4">
            <div className="row">
              <div className="col-md-6 mb-4">
                <div className="similarproducthead">
                  {t("Customer Also Viewed")}
                </div>
              </div>
              <div className="col-md-12">
                <div className="row flex-nowrap overflow-auto product-details">
                  <div
                    className={`py-3 ${isMobile ? "w-100 overflow-hidden" : "row"} `}
                  >
                    <Products
                      products={similar.slice(0, 4)}
                      loading={loading}
                      classType={"col-medium"}
                      isMobile={isMobile}
                      cardDetails={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── size guide modal ── */}
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
                    <img
                      src={productData?.sizeChart}
                      className="w-100 object-fit-contain"
                      alt=""
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Login Modal ── */}
      {showLoginModal && (
        <>
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowLoginModal(false)}
          />
          <div
            className="modal fade commanmodal show"
            style={{ display: "block" }}
            tabIndex={-1}
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

      {/* ── Warning modal (Try on) ── */}
      {showWarningModal && (
        <>
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowWarningModal(false)}
          />
          <div
            className="modal fade commanmodal show"
            style={{ display: "block" }}
            tabIndex={-1}
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

      <style>{`
        .skeleton-image,
        .skeleton-thumbnail,
        .skeleton-line,
        .skeleton-circle {
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        .skeleton-circle {
          border-radius: 50% !important;
        }
        .cartcolor.active {
          border: 2px solid #000 !important;
          transform: scale(1.05);
        }
        .selectsizee.active {
          background-color: #000;
          color: #fff;
        }
        .selectsizee:disabled {
          cursor: not-allowed !important;
        }
        .cartcolor:disabled {
          cursor: not-allowed !important;
        }
      `}</style>
    </>
  );
};

/* ── Skeleton placeholder for right column ── */
const SkeletonRight = () => (
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
          style={{ width: "25%", height: "18px", marginBottom: "12px" }}
        />
        <div className="d-flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="skeleton-circle"
              style={{ width: "35px", height: "35px", borderRadius: "50%" }}
            />
          ))}
        </div>
      </div>
      <div className="mb-3">
        <div
          className="skeleton-line"
          style={{ width: "25%", height: "18px", marginBottom: "12px" }}
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
);

export default NewProductDetails;
