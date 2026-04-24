"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import socket from "@/utils/socket-config";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import {
  addCart,
  getCart,
  wishCart,
  wishListCart,
  getCounts,
} from "@/store/serviceSlices/commonSlice";
import toast from "react-hot-toast";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import { t } from "i18next";
import { generateNewSession } from "@/httpServices/sessionId";
import i18n from "@/i18n/i18n";

const Chatbot = () => {
  const isRTL = i18n.dir() === "rtl";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [wishlistStatus, setWishlistStatus] = useState({});
  const [loadingCartItems, setLoadingCartItems] = useState({});
  const [loadingWishlistItems, setLoadingWishlistItems] = useState({});
  const [loadingBuyNowItems, setLoadingBuyNowItems] = useState({});
  const [selectedVariants, setSelectedVariants] = useState({});
  const [isChatId, setChatId] = useState(null);
  const [hasClickedShowMore, setHasClickedShowMore] = useState(false);

  // console.log(messages, "Message----");

  const chatWindowRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        chatWindowRef.current &&
        !chatWindowRef.current.contains(event.target) &&
        isOpen
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle body scroll lock
  // useEffect(() => {
  //   if (isOpen) {
  //     // Store original styles to restore later
  //     const originalOverflow = document.body.style.overflow;
  //     const originalHeight = document.body.style.height;

  //     // Apply scroll lock
  //     document.body.style.overflow = "hidden";
  //     document.body.style.height = "100vh";

  //     // Cleanup function to restore styles
  //     return () => {
  //       document.body.style.overflow = originalOverflow;
  //       document.body.style.height = originalHeight;
  //     };
  //   }
  // }, [isOpen]);

  const dispatch = useDispatch();

  // console.log(messages, "===Messages===");

  const { profile, isUserLoggedIn, currency, chatId } = useSelector(
    (state) => ({
      profile: state?.commonSlice?.profile?.chatId,
      isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
      currency: state?.commonSlice?.currency,
      chatId: state?.commonSlice?.counts?.chatId,
    }),
  );

  console.log(chatId, "Chat ID-----");

  const COLOUR_MAP = {
    Moka: "#6D3B07",
    Red: "#FF0000",
    Green: "#008000",
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
    Fuchsia: "#ff00ff",
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

  const country = localStorage.getItem("country");
  const chatBotCountry = (() => {
    const userCurrency = localStorage.getItem("userCurrency") || "";
    const currencyToCountryMap = {
      "SAR - Saudi Riyal": "Saudi Arabia",
      "USD - US Dollar": "United States",
      "AED - UAE Dirham": "United Arab Emirates",
      "QAR - Qatari Riyal": "Qatar",
      "KWD - Kuwaiti Dinar": "Kuwait",
      "OMR - Omani Rial": "Oman",
      "GBP - British Pound": "United Kingdom",
    };
    return currencyToCountryMap[userCurrency] || "United States";
  })();

  console.log(chatBotCountry, "Chatbot---");
  const userCountry = localStorage.getItem("userCountry");
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);

  // Get available colors from variants
  const getAvailableColors = (product) => {
    const variants = product?.variants || [];
    if (!variants || variants.length === 0) return [];

    const colors = variants
      .map((variant) => {
        const colorCombination = variant.combination?.find(
          (comb) => comb.attributeId?.name_en === "Colour",
        );
        return colorCombination
          ? {
              name: colorCombination.valueId?.name_en,
              valueId: colorCombination.valueId?._id,
              combination: colorCombination,
            }
          : null;
      })
      .filter(Boolean);

    return [...new Map(colors.map((item) => [item.name, item])).values()];
  };

  // Get available sizes for selected color
  const getAvailableSizes = (product, selectedColor) => {
    const variants = product?.variants || [];
    if (!variants || variants.length === 0) return [];

    if (!selectedColor) {
      const allSizes = variants
        .map((variant) => {
          const sizeCombination = variant.combination?.find(
            (comb) => comb.attributeId?.name_en === "Size",
          );
          return sizeCombination
            ? {
                name: sizeCombination.valueId?.name_en,
                valueId: sizeCombination.valueId?._id,
                variant: variant,
                combination: sizeCombination,
              }
            : null;
        })
        .filter(Boolean);

      return [...new Map(allSizes.map((item) => [item.name, item])).values()];
    }

    const sizes = variants
      .filter((variant) => {
        const colorCombination = variant.combination?.find(
          (comb) => comb.attributeId?.name_en === "Colour",
        );
        return colorCombination?.valueId?.name_en === selectedColor;
      })
      .map((variant) => {
        const sizeCombination = variant.combination?.find(
          (comb) => comb.attributeId?.name_en === "Size",
        );
        return sizeCombination
          ? {
              name: sizeCombination.valueId?.name_en,
              valueId: sizeCombination.valueId?._id,
              variant: variant,
              combination: sizeCombination,
            }
          : null;
      })
      .filter(Boolean);

    return [...new Map(sizes.map((item) => [item.name, item])).values()];
  };

  // Get first available variant based on selections
  const getFirstAvailableVariant = (product, selectedColor, selectedSize) => {
    const variants = product?.variants || [];
    if (!variants || variants.length === 0) return null;

    if (selectedColor && selectedSize) {
      const exactVariant = variants.find((variant) => {
        const hasColor = variant.combination?.some(
          (comb) =>
            comb.attributeId?.name_en === "Colour" &&
            comb.valueId?.name_en === selectedColor,
        );
        const hasSize = variant.combination?.some(
          (comb) =>
            comb.attributeId?.name_en === "Size" &&
            comb.valueId?.name_en === selectedSize,
        );
        return hasColor && hasSize;
      });
      if (exactVariant) return exactVariant;
    }

    if (selectedColor) {
      const colorVariant = variants.find((variant) => {
        const hasColor = variant.combination?.some(
          (comb) =>
            comb.attributeId?.name_en === "Colour" &&
            comb.valueId?.name_en === selectedColor,
        );
        return hasColor;
      });
      if (colorVariant) return colorVariant;
    }

    if (selectedSize) {
      const sizeVariant = variants.find((variant) => {
        const hasSize = variant.combination?.some(
          (comb) =>
            comb.attributeId?.name_en === "Size" &&
            comb.valueId?.name_en === selectedSize,
        );
        return hasSize;
      });
      if (sizeVariant) return sizeVariant;
    }

    return variants.length > 0 ? variants[0] : null;
  };

  // Handle color selection
  const handleColorSelect = (productId, color, product) => {
    const availableSizes = getAvailableSizes(product, color);
    const selectedVariant = getFirstAvailableVariant(product, color, null);

    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selectedColor: color,
        selectedSize: availableSizes.length > 0 ? availableSizes[0].name : null,
        selectedVariant: selectedVariant,
      },
    }));
  };

  // Handle size selection
  const handleSizeSelect = (productId, size, product, selectedColor) => {
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
  };

  // Handle Add to Cart
  const handleAddtoCart = async (product, variant = null) => {
    const productId = product?._id;
    const selectedVariant = selectedVariants[productId];
    let finalVariant = variant || selectedVariant?.selectedVariant;

    if (!finalVariant && product?.variants && product.variants.length > 0) {
      finalVariant = product.variants[0];
    }

    if (!finalVariant || !finalVariant._id) {
      toast.error(t("No variants available for this product"));
      return;
    }

    const itemId = finalVariant._id;

    try {
      setLoadingCartItems((prev) => ({ ...prev, [itemId]: true }));

      const cartItem = {
        productId: productId,
        variantId: finalVariant._id,
        quantity: 1,
      };

      await dispatch(addCart(cartItem));
      document.querySelector(".modal").classList.remove("show");
      document.querySelector(".modal-backdrop").remove();

      dispatch(getCart());
      // toast.success(t("Product added to cart successfully!"));
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error(error?.message || t("Something went wrong"));
    } finally {
      setLoadingCartItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  // Handle Buy Now
  const handleBuyNow = async (product, variant = null) => {
    const productId = product?._id;
    const selectedVariant = selectedVariants[productId];
    let finalVariant = variant || selectedVariant?.selectedVariant;

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

      const cartItem = {
        productId: productId,
        variantId: finalVariant._id,
        quantity: 1,
      };

      await dispatch(addCart(cartItem));
      dispatch(getCart());

      // Navigate to cart page
      window.location.href = "/Cart";
    } catch (error) {
      console.error("Buy Now error:", error);
      toast.error(error?.message || t("Something went wrong"));
    } finally {
      setLoadingBuyNowItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  // Check if product has variants
  const hasAvailableVariants = (product) => {
    return product?.variants && product.variants.length > 0;
  };

  // Add to wishlist handler
  const addToWishlist = async (product, variant) => {
    if (!variant || !variant._id) {
      toast.error("Invalid variant");
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
            productId: product?._id,
            variantId: variant._id,
          }),
        );
        dispatch(wishListCart());

        if (result?.error) {
          setWishlistStatus((prev) => ({
            ...prev,
            [variant._id]: !prev[variant._id],
          }));
          toast.error(result?.message || "Failed to update wishlist");
        } else {
          toast.success(
            wishlistStatus[variant._id]
              ? "Removed from Wishlist"
              : "Added to Wishlist",
          );
        }
      } else {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error(error?.message);
      toast.error("Failed to update wishlist");
    } finally {
      setLoadingWishlistItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  // Format price display
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Small Loader Components
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

  // Get counts for chat ID
  useEffect(() => {
    dispatch(getCounts());
  }, [dispatch]);

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

  // Evee-style Product Card Component with Modal
  const EveeProductCard = ({ product }) => {
    console.log(product, "Product--");
    const variant =
      product.variant || (product.variants && product.variants[0]) || {};
    const hasDiscount = variant.discountPrice > 0;
    const finalPrice = hasDiscount ? variant.discountPrice : variant.price;
    const productId = product._id;

    const selectedVariant = selectedVariants[productId] || {};
    const availableColors = getAvailableColors(product);
    const availableSizes = getAvailableSizes(
      product,
      selectedVariant.selectedColor,
    );
    const hasVariants = hasAvailableVariants(product);

    const isAddingToCart =
      loadingCartItems[selectedVariant.selectedVariant?._id] ||
      loadingCartItems[variant?._id] ||
      false;
    const isWishlistLoading = loadingWishlistItems[variant?._id] || false;
    const isBuyNowLoading =
      loadingBuyNowItems[selectedVariant.selectedVariant?._id] ||
      loadingBuyNowItems[variant?._id] ||
      false;

    const description = isRTL
      ? product.variant?.descriptionAr
      : product.variant?.descriptionEn;

    return (
      <>
        <div
          className="product-card-evee"
          style={{ position: "relative", zIndex: "100px" }}
        >
          <div className="product-image-container">
            <img
              src={
                product?.images?.[0]?.url ||
                variant?.images?.[0]?.url ||
                "/assets/img/placeholder-product.jpg"
              }
              alt={product.name_en}
              className="product-image"
              onError={(e) => {
                e.target.src = "/assets/img/placeholder-product.jpg";
              }}
            />

            <a
              className="favicon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToWishlist(product, variant);
              }}
            >
              {isWishlistLoading ? (
                <SmallWishlistLoader />
              ) : (
                <img
                  src={
                    wishlistStatus[variant._id]
                      ? "/assets/img/liked.png"
                      : "/assets/img/heart.png"
                  }
                  alt="wishlist"
                />
              )}
            </a>
          </div>

          <div className="product-info">
            <Link
              href={`/Product/${product._id}`}
              className="text-decoration-none text-dark"
            >
              <h4 className="product-name">
                {isRTL ? product.name_ar : product.name_en}
              </h4>
              <p className="product-brand">
                {isRTL ? product.brandId?.name_ar : product.brandId?.name_en}
              </p>

              <div className="colorboxes d-flex align-items-center mb-2">
                {availableColors.slice(0, 3).map((color, index) => (
                  <div
                    key={index}
                    className="cb_cmn"
                    title={t(color.name)}
                    style={{
                      backgroundColor: COLOUR_MAP[color.name] || "#CCCCCC",
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

              <div className="product-pricing mb-2">
                {hasDiscount ? (
                  <>
                    <span className="text-decoration-line-through me-2">
                      {getCurrencySymbol(localStorage.getItem("country"))}
                      {formatPrice(variant.price)}
                    </span>
                    <span className="fw-bold text-danger">
                      {getCurrencySymbol(localStorage.getItem("country"))}
                      {formatPrice(finalPrice)}
                    </span>
                  </>
                ) : (
                  <span>
                    {getCurrencySymbol(localStorage.getItem("country"))}
                    {formatPrice(finalPrice)}
                  </span>
                )}
              </div>
            </Link>

            <div className="row align-items-center">
              <div className="col-11">
                <button
                  className="addtocart"
                  // onClick={(e) => {
                  //   e.preventDefault();
                  //   e.stopPropagation();
                  //   // Open modal for products with variants, direct add for products without variants
                  //   if (hasVariants) {
                  //     const modalId = `addtocard-${productId}`;
                  //     const modalElement = document.getElementById(modalId);
                  //     if (modalElement) {
                  //       const modal = new window.bootstrap.Modal(modalElement);
                  //       modal.show();
                  //     }
                  //   } else {
                  //     handleAddtoCart(product, variant);
                  //   }
                  // }}
                  data-bs-toggle={hasVariants ? "modal" : ""}
                  data-bs-target={hasVariants ? `#addtocard-${productId}` : ""}
                >
                  {isAddingToCart ? (
                    <SmallLoader />
                  ) : (
                    <>
                      <div className="w-100 position-relative">
                        <img src="/assets/img/bag.png" alt="bag" />
                        {variant?.isAddedInCart
                          ? t("ADDED TO CART")
                          : t("ADD TO CART")}
                      </div>
                    </>
                  )}
                </button>
              </div>
              <div className="col-1 px-0">
                <button
                  className="icon-info"
                  tooltip={description || t("Product Info")}
                >
                  <img src="/assets/img/information-fill.svg" alt="info" />
                  <div className="show-description">
                    {description || t("No description available")}
                  </div>
                </button>
              </div>
            </div>
            {/* <span>
              <img src="/assets/img/info.png" alt="info" />
            </span> */}
          </div>
        </div>

        {/* DYNAMIC MODAL - Same as in Products component */}
        {hasVariants && (
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
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    onClick={() => {
                      document.querySelector(".modal").classList.remove("show");
                      document.querySelector(".modal-backdrop").remove();
                    }}
                  ></button>
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
                    <div className="col-md-12 mb-3 border-bottom pb-3">
                      <div className="cartoptionhead">
                        {t("Select Color")} {availableColors.length > 0 && ""}
                      </div>
                      <div className="row flex-nowrap px-2">
                        {availableColors.length > 0
                          ? availableColors.map((color, idx) => (
                              <div className="col-auto px-1" key={idx}>
                                <button
                                  type="button"
                                  className={`cartcolor ${selectedVariant.selectedColor === color.name ? "selected" : ""}`}
                                  title={color.name}
                                  onClick={() =>
                                    handleColorSelect(
                                      productId,
                                      color.name,
                                      product,
                                    )
                                  }
                                  style={{
                                    backgroundColor:
                                      COLOUR_MAP[color.name] || "#CCCCCC",
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
                            ))
                          : null}
                      </div>
                      {selectedVariant.selectedColor && (
                        <div className="mt-2 text-success">
                          {t("Selected")}: {selectedVariant.selectedColor}
                        </div>
                      )}
                    </div>

                    {/* Select Size */}
                    <div className="col-md-12 mb-3">
                      <div className="cartoptionhead">
                        {t("Select Size")} {availableSizes.length > 0 && ""}
                      </div>
                      <div className="row flex-nowrap px-2">
                        {availableSizes.length > 0
                          ? availableSizes.map((size, idx) => (
                              <div className="col-auto px-1" key={idx}>
                                <button
                                  type="button"
                                  className={`selectsizee ${selectedVariant.selectedSize === size.name ? "selected" : ""}`}
                                  onClick={() =>
                                    handleSizeSelect(
                                      productId,
                                      size.name,
                                      product,
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
                                      selectedVariant.selectedSize === size.name
                                        ? "2px solid #000"
                                        : "1px solid #ddd",
                                    background:
                                      selectedVariant.selectedSize === size.name
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
                      {selectedVariant.selectedSize && (
                        <div className="mt-2 text-success">
                          {t("Selected")}: {selectedVariant.selectedSize}
                        </div>
                      )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="col-md-12 mb-4">
                      <div className="row">
                        <div className="col-md-6 mb-2">
                          <button
                            type="button"
                            onClick={() => handleAddtoCart(product)}
                            className="authbtns1"
                            data-bs-dismiss="modal"
                            disabled={isAddingToCart}
                          >
                            {isAddingToCart ? <SmallLoader /> : "ADD TO CART"}
                          </button>
                        </div>
                        <div className="col-md-6">
                          <button
                            type="button"
                            className="authbtns2"
                            onClick={() => handleBuyNow(product)}
                            data-bs-dismiss="modal"
                            disabled={!hasVariants || isBuyNowLoading}
                          >
                            {isBuyNowLoading ? <SmallLoader /> : "BUY NOW"}
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
        )}
      </>
    );
  };

  // Clear chat function
  const clearChat = useCallback(
    (chatIdParam) => {
      try {
        const currentChatId = chatIdParam || profile || chatId;
        if (currentChatId) {
          // Emit clear chat event via socket
          socket.emit("clearChat", {
            chatId: currentChatId,
            country: chatBotCountry,
          });

          // Clear local messages state
          setMessages([]);
          setIsTyping(false);
          setIsLoading(false);

          console.log("Chat cleared for chatId:", currentChatId);
        }
      } catch (error) {
        console.error("Error clearing chat:", error);
      }
    },
    [profile, chatId, country],
  );

  // Toggle chat window
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Add message to chat
  const addMessage = useCallback((message, sender, data = null) => {
    setMessages((prev) => {
      const newMessage = {
        text: message,
        sender,
        data,
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.random(),
      };

      // Prevent duplicates
      const messageExists = prev.some(
        (msg) =>
          msg.text === newMessage.text &&
          msg.sender === newMessage.sender &&
          Math.abs(new Date(msg.timestamp) - new Date(newMessage.timestamp)) <
            1000,
      );

      return messageExists ? prev : [...prev, newMessage];
    });
  }, []);

  // Send message to bot
  const sendMessage = useCallback(async () => {
    const message = inputValue.trim();
    if (!message || isTyping) return;

    // Add user message immediately
    addMessage(message, "user");
    setInputValue("");
    setHasClickedShowMore(false);
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Emit message via socket
      const payload = {
        chatId: profile || chatId,
        message: message,
        country: chatBotCountry,
        currentCountry: userCountry,
        sessionID: generateNewSession(),
      };

      console.log("Sending message:", payload);
      socket.emit("sendMessage", payload);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);
      setIsLoading(false);
      addMessage("Sorry, I encountered an error. Please try again.", "bot");
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, profile, chatId, country, addMessage, isTyping]);

  // Handle socket messages
  useEffect(() => {
    let isMounted = true;

    const handleBotResponse = (response) => {
      if (!isMounted) return;

      console.log("Bot response received:", response);
      console.log("Response details:", {
        message: response?.message,
        sentBy: response?.sentBy,
        productIds: response?.productIds?.length || 0,
        categoryIds: response?.categoryIds?.length || 0,
        brandIds: response?.brandIds?.length || 0,
        timestamp: new Date().toISOString(),
      });

      setIsTyping(false);
      setIsLoading(false);

      if (response && response.sentBy === "Bot") {
        addMessage(response.message, "bot", {
          productIds: response.productIds,
          categoryIds: response.categoryIds,
          brandIds: response.brandIds,
        });
      }

      setIsTyping(false);
    };

    const handleMessageList = (messageList) => {
      if (!isMounted) return;

      console.log("Message list received:", messageList);
      console.log("Message list details:", {
        messageCount: Array.isArray(messageList) ? messageList.length : 0,
        messages: Array.isArray(messageList)
          ? messageList.map((msg) => ({
              id: msg._id,
              sentBy: msg.sentBy,
              messageLength: msg.message?.length || 0,
              hasProducts: !!msg.productIds?.length,
              hasCategories: !!msg.categoryIds?.length,
              hasBrands: !!msg.brandIds?.length,
              createdAt: msg.createdAt,
            }))
          : [],
      });

      if (Array.isArray(messageList)) {
        const formattedMessages = messageList.map((msg) => ({
          text: msg.message,
          sender: msg.sentBy.toLowerCase(),
          data: {
            productIds: msg.productIds,
            categoryIds: msg.categoryIds,
            brandIds: msg.brandIds,
          },
          timestamp: msg.createdAt,
          id: msg._id || Date.now() + Math.random(),
        }));
        setMessages(formattedMessages);
        setIsTyping(false);
      }
    };

    const handleSocketError = (error) => {
      console.error("Socket error:", error);
      if (!isMounted) return;
      setIsTyping(false);
      setIsLoading(false);
    };

    // Socket event listeners
    socket.on("botResponse", handleBotResponse);
    socket.on("messageList", handleMessageList);
    socket.on("error", handleSocketError);
    socket.on("connect_error", handleSocketError);

    // Get message history when component mounts or profile/chatId changes
    const activeChatId = profile || chatId;
    console.log("Debug getMessageList:", {
      profile,
      chatId,
      activeChatId,
      country,
      socketConnected: socket.connected,
    });

    if (activeChatId) {
      if (socket.connected) {
        console.log("Emitting getMessageList for chatId:", activeChatId);
        socket.emit(
          "getMessageList",
          {
            chatId: activeChatId,
            country: chatBotCountry,
            currentCountry: userCountry,
          },
          (response) => {
            console.log("getMessageList acknowledgment response:", response);
          },
        );
      } else {
        console.warn("Socket not connected yet — waiting for connection");
        const onConnect = () => {
          console.log(
            "Socket connected, now emitting getMessageList for chatId:",
            activeChatId,
          );
          socket.emit(
            "getMessageList",
            {
              chatId: activeChatId,
              country: chatBotCountry,
              currentCountry: userCountry,
            },
            (response) => {
              console.log(
                "getMessageList acknowledgment response (delayed connect):",
                response,
              );
            },
          );
          socket.off("connect", onConnect);
        };
        socket.on("connect", onConnect);
      }
    } else {
      console.warn(
        "No chatId available (profile:",
        profile,
        ", chatId:",
        chatId,
        ") — getMessageList will NOT be emitted",
      );
    }

    // Cleanup function
    return () => {
      isMounted = false;
      socket.off("botResponse", handleBotResponse);
      socket.off("messageList", handleMessageList);
      socket.off("error", handleSocketError);
      socket.off("connect_error", handleSocketError);
    };
  }, [profile, chatId, country, addMessage]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Handle input key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Simple markdown parser for bot messages
  const parseMarkdown = (text) => {
    if (!text) return null;

    // Split into lines for list handling
    const lines = text.split("\n");
    const elements = [];
    let key = 0;

    lines.forEach((line, lineIdx) => {
      // Process inline markdown (bold, italic)
      const processInline = (str) => {
        const parts = [];
        let remaining = str;
        let inlineKey = 0;

        while (remaining.length > 0) {
          // Bold: **text**
          const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
          // Italic: *text*
          const italicMatch = remaining.match(
            /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/,
          );

          const firstMatch = [boldMatch, italicMatch]
            .filter(Boolean)
            .sort((a, b) => a.index - b.index)[0];

          if (!firstMatch) {
            parts.push(remaining);
            break;
          }

          // Add text before match
          if (firstMatch.index > 0) {
            parts.push(remaining.substring(0, firstMatch.index));
          }

          if (firstMatch === boldMatch) {
            parts.push(
              <strong key={`b-${lineIdx}-${inlineKey++}`}>
                {firstMatch[1]}
              </strong>,
            );
          } else {
            parts.push(
              <em key={`i-${lineIdx}-${inlineKey++}`}>{firstMatch[1]}</em>,
            );
          }

          remaining = remaining.substring(
            firstMatch.index + firstMatch[0].length,
          );
        }

        return parts;
      };

      // Numbered list item: "1. text" or "1) text"
      const listMatch = line.match(/^(\d+)[.)\s]\s*(.*)/);
      if (listMatch) {
        elements.push(
          <div key={key++} style={{ marginBottom: "4px" }}>
            <strong>{listMatch[1]}.</strong> {processInline(listMatch[2])}
          </div>,
        );
      } else if (line.trim() === "") {
        elements.push(<br key={key++} />);
      } else {
        elements.push(
          <span key={key++}>
            {lineIdx > 0 && elements.length > 0 && <br />}
            {processInline(line)}
          </span>,
        );
      }
    });

    return elements;
  };

  // Parse bot message and render appropriate content
  const renderBotMessage = (message, isLastProductMessage = false) => {
    if (!message) return null;
    // console.log(message, "message----");
    try {
      // Check if message contains product data
      if (message.productIds && message.productIds.length > 0) {
        return (
          <div className="w-100">
            <div className="message-content w-100">
              <div className="products-recommendation">
                <p>
                  {parseMarkdown(message.message) ||
                    "Here are some products you might like:"}
                </p>
                <div className="products-grid-evee">
                  {message.productIds.map((product) => (
                    <EveeProductCard
                      key={product._id || `${product.name_en}_${Date.now()}`}
                      product={product}
                    />
                  ))}
                </div>
                {/* <div className="text-center mt-3">
                  <Link
                    to="/Product/All/All-Products"
                    className="see-all-btn text-white"
                    style={{ cursor: 'pointer', borderRadius: '5px', padding: '8px 16px', border: '1px solid #fff' }}
                  >
                    {t("Show More Like This")}
                  </Link>
                </div> */}

                {isLastProductMessage && !hasClickedShowMore && (
                  <div className="text-center mt-3">
                    <button
                      className="see-all-btn text-white"
                      style={{
                        cursor: isTyping ? "not-allowed" : "pointer",
                        borderRadius: "5px",
                        padding: "8px 16px",
                        border: "1px solid #fff",
                        background: "transparent",
                        opacity: isTyping ? 0 : 1,
                      }}
                      disabled={isTyping}
                      onClick={() => {
                        setHasClickedShowMore(true);
                        setIsTyping(true);
                        // setIsLoading(true);
                        socket.emit("showMore", {
                          chatId: profile || isChatId || chatId,
                          country: chatBotCountry,
                          currentCountry: userCountry,
                        });
                      }}
                    >
                      {!hasClickedShowMore
                        ? t("Show More Like This")
                        : t("Showing More...")}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* <div className="bg-white mb-5 px-1 rounded-3 text-start">
              {message.productIds.map((product, index) => {
                const productDescription = isRTL
                  ? product.variant?.descriptionAr
                  : product.variant?.descriptionEn;

                console.log(productDescription, "Description----");

                if (!productDescription) return null;

                return (
                  <p
                    key={`desc_${product._id}_${index}`}
                    style={{ marginTop: '10px', marginBottom: '10px' }}
                  >
                    {productDescription}
                  </p>
                );
              })}
            </div> */}
          </div>
        );
      }

      // Check if message contains category data
      if (message.categoryIds && message.categoryIds.length > 0) {
        return (
          <div className="categories-recommendation">
            <p className="bg-white w-fit p-1 rounded-3">
              {parseMarkdown(message.message) || "Browse by category:"}
            </p>
            <div className="row">
              {message.categoryIds.map((category, index) => (
                <div
                  className="col-lg-4 col-md-6 mb-4 w-100"
                  key={category._id || index}
                >
                  <Link
                    href={`/category/${category._id}`}
                    className="bannercategorybox"
                  >
                    <img src={category.image} alt={category.name_en} />
                    <div className="categoryname">
                      {isRTL ? category.name_ar : category.name_en}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // Check if message contains brand data
      if (message.brandIds && message.brandIds.length > 0) {
        return (
          <div className="brands-recommendation">
            <p>{parseMarkdown(message.message) || "Shop by brand:"}</p>
            <div className="brands-grid row g-4">
              {message.brandIds.map((brand, index) => (
                <Link
                  href={`/Designer/${brand?._id}`}
                  key={brand._id || index}
                  className="brand-card col-6"
                >
                  <div className="brand-logo">
                    <img
                      src={brand.logo}
                      className="w-100 object-fit-contain h-100"
                      alt={isRTL ? brand.name_ar : brand.name_en}
                      onError={(e) => {
                        e.target.src = "/assets/img/placeholder-brand.jpg";
                      }}
                    />
                  </div>
                  <p
                    className="brand-name text-white mt-2"
                    style={{ fontSize: "10px" }}
                  >
                    {brand.name_en}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        );
      }

      // Regular text message
      return (
        <div className="message-bot-content bg-white p-2 rounded-3">
          <div className="">{parseMarkdown(message.message)}</div>
        </div>
      );
    } catch (error) {
      console.error("Error rendering bot message:", error);
      return (
        <div className="message-text">
          {message.message || "I can't help you for this."}
        </div>
      );
    }
  };

  // const renderDescription = (message) => {
  //   if (!message) return null;

  //   if (message.productIds && message.productIds.length > 0) {
  //     return (
  //       <div className="products-grid-evee">
  //         {message.productIds.map((product, index) => {
  //           const productDescription = isRTL
  //             ? product.variant?.descriptionAr
  //             : product.variant?.descriptionEn;

  //           return (
  //             <React.Fragment key={index}>
  //               {productDescription && (
  //                 <p style={{ marginTop: '10px', marginBottom: '10px' }}>
  //                   {productDescription}
  //                 </p>
  //               )}
  //             </React.Fragment>
  //           );
  //         })}
  //       </div>
  //     );
  //   }

  //   return null;
  // };

  // Quick suggestions
  const quickSuggestions = [
    t("chatBot.allCategories"),
    t("chatBot.allBrands"),
    // t("chatBot.searchForAbaaya"),
    t("chatBot.whatIsReturnPolicy"),
  ];
  useEffect(() => {
    const handleMessage = (msgs) => {
      console.log("messageResponse received:", msgs);
      console.log("Message response details:", {
        hasMessage: !!msgs?.message,
        messageContent: msgs?.message?.message,
        sentBy: msgs?.message?.sentBy,
        productIds: msgs?.message?.productIds?.length || 0,
        categoryIds: msgs?.message?.categoryIds?.length || 0,
        brandIds: msgs?.message?.brandIds?.length || 0,
        timestamp: msgs?.message?.createdAt,
      });

      if (msgs) {
        const msg = msgs?.message;
        const formattedMessages = {
          text: msg.message,
          sender: msg.sentBy.toLowerCase(),
          data: {
            productIds: msg.productIds,
            categoryIds: msg.categoryIds,
            brandIds: msg.brandIds,
          },
          timestamp: msg.createdAt,
          id: msg._id || Date.now() + Math.random(),
        };
        setMessages((prev) => [...prev, formattedMessages]);
        setIsTyping(false);
        setIsLoading(false);
      }
    };
    socket.on("messageResponse", handleMessage);
    return () => {
      socket.off("messageResponse", handleMessage);
    };
  }, []);

  if (isOpen) {
    // const el = document.getElementsByClassName("homepage-container")[0];
    const ChatBg = document.getElementsByClassName("chatbot-backdrop")[0];
    const el = document.body;
    if (el && ChatBg) {
      el.style.overflow = "hidden";
      el.style.height = "100vh";
      ChatBg.classList.add("active");
    }
  } else {
    // const el = document.getElementsByClassName("homepage-container")[0];
    const ChatBg = document.getElementsByClassName("chatbot-backdrop")[0];
    const el = document.body;
    if (el && ChatBg) {
      el.style.overflow = "auto";
      el.style.height = "100%";
      ChatBg.classList.remove("active");
    }
  }

  return (
    <div className="chatbot-backdrop">
      <div className="chatbot-container">
        {/* Chat Toggle Button */}
        {!isOpen && (
          <button
            className={`chat-toggle ${isOpen ? "active" : ""}`}
            onClick={toggleChat}
          >
            <img src="/assets/img/chatbotIcon.png" alt="Chat with us" />
            {messages.length > 0 && <span className="notification-dot"></span>}
          </button>
        )}

        {/* Chat Window */}
        <div className="chat-window-wrapper">
          <div
            className={`chat-window ${isOpen ? "active" : ""}`}
            ref={chatWindowRef}
          >
            {/* Chat Header */}
            <div className="chat-header">
              <div className="bot-avatar">
                <img
                  src="/assets/img/chatbotIcon.png"
                  alt="Chat with us"
                  style={{ width: "30px", height: "30px" }}
                />
              </div>

              <div className="bot-info">
                <h3>{t("chatBot.fashionAssistant")}</h3>
                <div className="bot-status">
                  <span className="status-dot"></span>
                  <span>{t("chatBot.online")}</span>
                </div>
              </div>

              {/* CLEAR BUTTON */}
              <button
                className="clear-chat-btn"
                onClick={() => clearChat(profile || chatId)}
                title={t("chatBot.clearChat")}
              >
                {t("chatBot.clear")}
              </button>

              {/* CLOSE BUTTON */}
              <button
                className="close-chat"
                onClick={toggleChat}
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                }}
              >
                ×
              </button>
            </div>

            {/* Chat Messages */}
            <div
              className="chat-messages"
              style={{ zIndex: "100px" }}
              ref={chatMessagesRef}
            >
              {messages.length === 0 && (
                <div className="welcome-message">
                  <h4>👋 {t("chatBot.welcomeMessage")}</h4>
                  <p>{t("chatBot.askMeQuestion")}</p>
                  <div className="suggestions">
                    {quickSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="suggestion-chip text-white"
                        onClick={() => {
                          setInputValue(suggestion);
                          setTimeout(sendMessage, 100);
                        }}
                        type="button"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(() => {
                // Find the last bot message that has products
                const lastBotProductMsgId = [...messages]
                  .reverse()
                  .find(
                    (m) => m.sender === "bot" && m.data?.productIds?.length > 0,
                  )?.id;

                return messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message ${msg.sender}`}
                    style={{ position: "relative", zIndex: "100px" }}
                  >
                    {msg.sender === "bot" && (
                      <div className="bot-avatar">
                        <img
                          src="/assets/img/chatbotIcon.png"
                          style={{
                            width: "30px",
                            height: "30px",
                          }}
                          alt="Chat with us"
                        />
                      </div>
                    )}
                    {msg.sender === "bot" ? (
                      renderBotMessage(
                        { ...msg, message: msg.text, ...msg.data },
                        msg.id === lastBotProductMsgId,
                      )
                    ) : (
                      <div className="d-flex justify-content-end w-75">
                        <div
                          className="bg-white p-2 rounded-3 text-start mb-3"
                          style={{ width: "auto" }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    )}
                  </div>
                ));
              })()}
              {/* 
            {messages.map((msg) => (
              <div className="message-description">
                {msg.sender === 'bot' ? renderDescription({ ...msg, message: msg.text, ...msg.data }) : msg.text}
              </div>
            ))} */}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="typing-indicator active">
                  <div className="bot-avatar">
                    <img
                      src="/assets/img/chatbotIcon.png"
                      style={{
                        width: "30px",
                        height: "30px",
                      }}
                      alt="Chat with us"
                    />
                  </div>
                  <div className="typing-content">
                    <div className="typing-dots">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                    <span className="typing-text text-white">
                      {t("chatBot.botTyping")}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef}></div>
            </div>

            {/* Chat Input */}
            <div className="chat-input-container z-3">
              <div className="chat-input">
                <textarea
                  className="input-field text-white"
                  placeholder={t("chatBot.askForProducts")}
                  rows={1}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  style={{ height: "auto" }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                />
                <button
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
