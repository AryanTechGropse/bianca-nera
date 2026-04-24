"use client";
import React, { useCallback, useEffect, useState } from "react";
import Header from "@/header/Header";
import Footer from "@/footer/Footer";
import { useDispatch, useSelector } from "react-redux";
import Products from "../Products/Products";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import CartHeader from "@/header/CartHeader";
import {
  getCart,
  getCounts,
  getProfile,
  setAppliedCoupon,
  setScreenState,
  wishCart,
} from "@/store/serviceSlices/commonSlice";
import Loading from "@/common/Loading";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Coupons from "./Coupons";
import toast from "react-hot-toast";
import { t } from "i18next";
import i18n from "@/i18n/i18n";

function debounce(func, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

const CartItemSkeleton = () => (
  <div className="cartproductbox mt-3">
    <div className="row">
      <div className="col-auto mb-md-0 mb-3">
        <div
          className="cartproductimg skeleton-box"
          style={{ width: "120px", height: "120px", borderRadius: "8px" }}
        ></div>
      </div>
      <div className="col mb-md-0 mb-3">
        <div className="cartproductcontent">
          <div
            className="skeleton-box mb-2"
            style={{ width: "70%", height: "20px", borderRadius: "4px" }}
          ></div>
          <div
            className="skeleton-box mb-2"
            style={{ width: "40%", height: "16px", borderRadius: "4px" }}
          ></div>
          <div
            className="skeleton-box mb-2"
            style={{ width: "50%", height: "18px", borderRadius: "4px" }}
          ></div>
          <div
            className="skeleton-box"
            style={{ width: "60%", height: "16px", borderRadius: "4px" }}
          ></div>
        </div>
      </div>
      <div className="col-md-auto">
        <div
          className="skeleton-box"
          style={{ width: "40px", height: "40px", borderRadius: "4px" }}
        ></div>
      </div>
    </div>
  </div>
);

const CartProfile = ({ setCoupleApplicable, couponApplicable }) => {
  const isRTL = i18n.dir() === "rtl";
  const { cartState, data, isLoading, screenState, isUserLoggedIn } =
    useSelector((state) => ({
      cartState: state?.commonSlice?.cartState,
      data: state?.getProfileCalling?.data,
      isLoading: state?.commonSlice?.isLoading,
      screenState: state?.commonSlice?.screenState,
      isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
    }));
  console.log(isUserLoggedIn);
  const dispatch = useDispatch();

  const cartProducts = Array.isArray(cartState?.carts?.products)
    ? cartState?.carts?.products
    : [];

  const [products, setNewProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingItems, setUpdatingItems] = useState({});
  const [localQty, setLocalQty] = useState({});
  const [cartLoading, setCartLoading] = useState(true);
  const [removeModalItem, setRemoveModalItem] = useState(null);
  const [removingItem, setRemovingItem] = useState(false);

  const formatPrice = (n) => (Number(n) ? Number(n).toFixed(2) : "0.00");

  const router = useRouter();

  useEffect(() => {
    dispatch(getProfile());
  }, []);

  const getRecommended = useCallback(async () => {
    const payload = { page: 1, pageSize: 5 };
    try {
      setLoading(true);
      setError(null);
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "products/getRecomendedProducts",
        data: payload,
      });
      setNewProducts(response?.results?.products || []);
    } catch (error) {
      console.error(t("New arrivals fetch error:"), error?.message);
      setError(error?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      setCartLoading(true);
      await dispatch(getCart());
      setCartLoading(false);
    };
    fetchCart();
  }, [dispatch]);

  useEffect(() => {
    getRecommended();
  }, [getRecommended]);

  const removeCart = async (data) => {
    const payload = {
      productId: data?.productId?._id,
      variantId: data?.variantId?._id,
      quantity: data?.quantity,
    };

    const key = `${data.productId?._id}-${data.variantId?._id}`;
    setUpdatingItems((prev) => ({ ...prev, [key]: true }));
    setRemovingItem(true);

    try {
      const response = await callMiddleWare({
        method: "post",
        endpoint: "products/removeFromCart",
        data: payload,
      });
      if (!response?.error) {
        toast.success(response?.message);
        await dispatch(getCart());
        dispatch(setAppliedCoupon(null));
        dispatch(getCounts());
        setScreenState("Cart");
      } else {
        toast.error(response?.message || t("Failed to remove item"));
      }
    } catch (error) {
      console.log(error?.message);
      toast.error(t("Failed to remove item"));
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [key]: false }));
      setRemovingItem(false);
      setRemoveModalItem(null);
    }
  };

  const moveToWishlist = async (item) => {
    setRemovingItem(true);
    try {
      const wishResult = await dispatch(
        wishCart({
          productId: item?.productId?._id,
          variantId: item?.variantId?._id,
        }),
      );

      console.log(wishResult, "API RESPONSE...");

      // Only remove from cart if wishlist add was successful
      if (!wishResult.error) {
        const response = await callMiddleWare({
          method: "post",
          endpoint: "products/removeFromCart",
          data: {
            productId: item?.productId?._id,
            variantId: item?.variantId?._id,
            quantity: item?.quantity,
          },
        });

        if (!response?.error) {
          toast.success(t("Moved to wishlist"));
          await dispatch(getCart());
          dispatch(getCounts());
          dispatch(setAppliedCoupon(null));
        } else {
          toast.error(response?.message || t("Failed to remove from cart"));
        }
      } else {
        // wishCart was rejected (user not logged in, etc.)
        toast.error(t("Failed to add to wishlist"));
      }
    } catch (error) {
      console.error(error?.message);
      toast.error(t("Failed to move to wishlist"));
    } finally {
      setRemovingItem(false);
      setRemoveModalItem(null);
    }
  };

  const updateCartQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;

    const payload = {
      productId: item?.productId?._id,
      variantId: item?.variantId?._id,
      quantity: parseInt(newQuantity),
    };

    const key = `${item.productId?._id}-${item.variantId?._id}`;
    setUpdatingItems((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await callMiddleWare({
        method: "post",
        endpoint: "products/updateCartQuantity",
        data: payload,
      });

      if (!response?.error) {
        dispatch(getCart());
      } else {
        toast.error(response?.message || t("Failed to update quantity"));
        // Revert local quantity on error
        setLocalQty((prev) => ({ ...prev, [key]: item?.quantity }));
      }
    } catch (error) {
      console.log(t("Update cart quantity error:"), error?.message);
      toast.error(t("Failed to update quantity"));
      // Revert local quantity on error
      setLocalQty((prev) => ({ ...prev, [key]: item?.quantity }));
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [key]: false }));
    }
  };

  const debouncedUpdateQuantity = useCallback(
    debounce(updateCartQuantity, 600),
    [],
  );

  const handleQuantityChange = (item, delta) => {
    const key = `${item.productId?._id}-${item.variantId?._id}`;
    const currentQty = localQty[key] ?? item?.quantity ?? 1;
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    setLocalQty((prev) => ({ ...prev, [key]: newQty }));

    debouncedUpdateQuantity(item, newQty);
  };

  const [userCountry, setUserCountry] = useState(() => {
    return localStorage.getItem("country") || "United States";
  });

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

  const appliedCoupon = useSelector((state) => state.commonSlice.appliedCoupon);

  console.log(appliedCoupon, "setAppliedCoupon");
  return (
    <div>
      <div className="cartpage py-md-5 py-4">
        <div className="cart-container">
          <div className="row">
            <div
              className={
                cartState?.carts?.products?.length >= 1
                  ? "col-lg-7 "
                  : "col-lg-12 "
              }
            >
              <div className="samedesignborder mb-3">
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <div className="cartpagehead">{t("Products")}</div>
                  </div>

                  <div className="col-md-12 mb-3">
                    <div className="cart-products-container">
                      {cartLoading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <CartItemSkeleton key={index} />
                        ))
                      ) : cartProducts.length === 0 ? (
                        <div className="cartproductbox">
                          <div className="row">
                            <div className="col-12">
                              <div className="text-center py-4">
                                {t("Your cart is empty.")}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        cartProducts.map((item) => {
                          const pid = item?.productId || {};
                          const productId = item?.productId?._id || "";
                          const vid = item?.variantId || {};
                          const img =
                            vid?.images?.[0]?.url ||
                            pid?.images?.[0]?.url ||
                            "/assets/img/dummy.jpg";
                          const name =
                            pid?.name_en || pid?.name_ar || t("Product");
                          // console.log(name, "NAME----")
                          const sku = pid?.productId || pid?._id || "";
                          const totalPrice = Number(
                            vid?.totalPrice ?? pid?.totalPrice ?? 0,
                          );
                          const key = `${pid?._id ?? pid?.productId}-${vid?._id ?? Math.random()}`;
                          const isUpdating =
                            updatingItems[
                              `${item.productId?._id}-${item.variantId?._id}`
                            ];
                          const qty = localQty[key] ?? item?.quantity ?? 1;

                          return (
                            <div
                              className="cartproductbox mt-3 position-relative"
                              key={key}
                            >
                              {appliedCoupon?.categories?.some((catId) =>
                                pid?.categoryId?.includes(catId),
                              ) && (
                                <span className="coupon-appyed">
                                  Coupon Applyed
                                </span>
                              )}
                              <div className="row">
                                <div className="col-auto mb-md-0 mb-3">
                                  <div className="cartproductimg">
                                    <img src={img} alt={name} />
                                  </div>
                                </div>

                                <div className="col mb-md-0 mb-3">
                                  <div className="cartproductcontent">
                                    <Link
                                      href={`/Product/${productId}`}
                                      className="cartproduct mb-1"
                                    >
                                      {/* {name} */}
                                      {isRTL
                                        ? item?.productId?.name_ar
                                        : item?.productId?.name_en}
                                    </Link>
                                    {/* <span>{sku}</span> */}
                                    <div className="pricecart mb-1">
                                      {getCurrencySymbol(userCountry)}{" "}
                                      {formatPrice(totalPrice)}{" "}
                                      {vid?.discountPrice ? (
                                        <del>
                                          {getCurrencySymbol(userCountry)}{" "}
                                          {formatPrice(vid.discountPrice)}
                                        </del>
                                      ) : null}
                                    </div>
                                    <div className="deliverytime mb-1">
                                      <img
                                        src="assets/img/cartvan.png"
                                        alt={t("delivery")}
                                      />{" "}
                                      4-5 {t("days delivery")}
                                    </div>

                                    <div className="row mt-2">
                                      <div className="col-md-auto col-auto mt-md-0 mt-2 pe-md-0 pe-0">
                                        <div className="cartselect">
                                          <div className="quantitybox d-flex align-items-center">
                                            <span
                                              onClick={() =>
                                                handleQuantityChange(item, -1)
                                              }
                                              style={{
                                                cursor:
                                                  qty > 1 && !isUpdating
                                                    ? "pointer"
                                                    : "not-allowed",
                                                opacity:
                                                  qty > 1 && !isUpdating
                                                    ? 1
                                                    : 0.5,
                                                userSelect: "none",
                                              }}
                                            >
                                              -
                                            </span>

                                            <input
                                              type="text"
                                              className="quantity-value mx-2"
                                              value={qty}
                                              readOnly
                                              style={{ width: "26px" }}
                                            />

                                            <span
                                              onClick={() =>
                                                handleQuantityChange(item, 1)
                                              }
                                              style={{
                                                cursor: !isUpdating
                                                  ? "pointer"
                                                  : "not-allowed",
                                                opacity: !isUpdating ? 1 : 0.5,
                                                userSelect: "none",
                                              }}
                                            >
                                              +
                                            </span>

                                            {/* {isUpdating && (
                                              <div
                                                className="spinner-border spinner-border-sm ms-2"
                                                role="status"
                                              >
                                                <span className="visually-hidden">Loading...</span>
                                              </div>
                                            )} */}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Color Display */}
                                      {vid?.combination?.some(
                                        (c) =>
                                          c.attributeId?.name_en === "Colour",
                                      ) && (
                                        <div className="col-md-auto col-6 mt-md-0 mt-2 pe-0">
                                          <div className="cartselect">
                                            <div
                                              className="simpleBox"
                                              aria-label="Color display"
                                              disabled
                                            >
                                              {t("Color")}:{" "}
                                              {
                                                vid?.combination?.find(
                                                  (c) =>
                                                    c.attributeId?.name_en ===
                                                    "Colour",
                                                )?.valueId?.name_en
                                              }
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Size Display */}
                                      {vid?.combination?.some(
                                        (c) =>
                                          c.attributeId?.name_en === "Size",
                                      ) && (
                                        <div className="col-md-auto col-auto mt-md-0 mt-2 pe-0">
                                          <div className="cartselect">
                                            <div
                                              className="simpleBox"
                                              aria-label="Size display"
                                              disabled
                                            >
                                              {t("Size")}:{" "}
                                              {
                                                vid?.combination?.find(
                                                  (c) =>
                                                    c.attributeId?.name_en ===
                                                    "Size",
                                                )?.valueId?.name_en
                                              }
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="col-md-auto col-auto">
                                  <a
                                    className={`trashbtn ${isUpdating ? "disabled" : ""}`}
                                    onClick={() =>
                                      !isUpdating && setRemoveModalItem(item)
                                    }
                                    style={{
                                      pointerEvents: isUpdating
                                        ? "none"
                                        : "auto",
                                      opacity: isUpdating ? 0.5 : 1,
                                      cursor: isUpdating
                                        ? "not-allowed"
                                        : "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    {isUpdating ? (
                                      <div
                                        className="spinner-border spinner-border-sm"
                                        role="status"
                                      >
                                        <span className="visually-hidden">
                                          {t("Loading...")}
                                        </span>
                                      </div>
                                    ) : (
                                      <img
                                        src="assets/img/carttrash.png"
                                        alt={t("remove")}
                                      />
                                    )}
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {!isUserLoggedIn && (
                <div className="samedesignborder mb-3">
                  <div className="loginbottom d-md-flex justify-content-between align-items-center">
                    <p>
                      {t(
                        "Login to see items from your existing bag and wishlist",
                      )}
                    </p>
                    <Link
                      href="/Authentication"
                      onClick={() =>
                        localStorage.setItem("redirect", "cartProfile")
                      }
                    >
                      {t("LOGIN NOW")}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {cartState?.carts?.products?.length >= 1 ? (
              <Coupons categoryId={cartState?.carts?.products} />
            ) : null}
          </div>
        </div>
      </div>
      {/* Remove from Bag Modal */}
      {removeModalItem && (
        <>
          {removingItem && <Loading />}
          <div
            className="remove-modal-backdrop"
            onClick={() => !removingItem && setRemoveModalItem(null)}
          >
            <div
              className="remove-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="remove-modal-close"
                onClick={() => !removingItem && setRemoveModalItem(null)}
                disabled={removingItem}
              >
                &times;
              </button>
              <div className="remove-modal-body">
                <div className="remove-modal-img">
                  <img
                    src={
                      removeModalItem?.variantId?.images?.[0]?.url ||
                      removeModalItem?.productId?.images?.[0]?.url ||
                      "/assets/img/dummy.jpg"
                    }
                    alt={t("Product")}
                  />
                </div>
                <div className="remove-modal-info">
                  <h6>{t("Move from Bag")}</h6>
                  <p>
                    {t("Are you sure you want to move this item from bag?")}
                  </p>
                </div>
              </div>
              <div className="remove-modal-actions">
                <button
                  className="remove-modal-btn remove-btn"
                  onClick={() => removeCart(removeModalItem)}
                  disabled={removingItem}
                >
                  {t("REMOVE")}
                </button>
                <button
                  className="remove-modal-btn wishlist-btn"
                  onClick={() => moveToWishlist(removeModalItem)}
                  disabled={removingItem}
                >
                  {t("MOVE TO WISHLIST")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .remove-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9998;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .remove-modal-content {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          max-width: 400px;
          position: relative;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          animation: modalFadeIn 0.25s ease-out;
        }
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .remove-modal-close {
          position: absolute;
          top: 12px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #333;
          line-height: 1;
          padding: 0;
        }
        .remove-modal-close:hover {
          color: #000;
        }
        .remove-modal-body {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-right: 20px;
        }
        .remove-modal-img {
          flex-shrink: 0;
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #eee;
        }
        .remove-modal-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .remove-modal-info h6 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #222;
        }
        .remove-modal-info p {
          font-size: 14px;
          color: #666;
          margin: 0;
          line-height: 1.4;
        }
        .remove-modal-actions {
          display: flex;
          gap: 12px;
          border-top: 1px solid #eee;
          padding-top: 16px;
        }
        .remove-modal-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.5px;
        }
        .remove-modal-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .remove-btn {
          background: #fff;
          color: #333;
          border: 1px solid #ddd;
        }
        .remove-btn:hover:not(:disabled) {
          background: #f5f5f5;
          border-color: #bbb;
        }
        .wishlist-btn {
          background: #fff;
          color: #e91e63;
          border: 1px solid #eee;
        }
        .wishlist-btn:hover:not(:disabled) {
          background: #fce4ec;
        }
      `}</style>

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
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CartProfile;
