import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { t } from "i18next";
import {
  getCart,
  setAppliedCoupon,
  setScreenState,
  setWalletUsed,
} from "@/store/serviceSlices/commonSlice";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import Link from "next/link";
import toast from "react-hot-toast";

const Coupons = ({
  selectedAddress,
  makeDefaultAddress,
  setCoupleApplicable,
  categoryId,
}) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingCoupon, setApplyingCoupon] = useState(null);
  const [walletAmountToUse, setWalletAmountToUse] = useState(0);

  const dispatch = useDispatch();
  const {
    cartState,
    screenState,
    couponApplication,
    couponDefault,
    wallet,
    walletUsed,
    cartData,
    shippingCost,
    isUserLoggedIn,
  } = useSelector((state) => ({
    cartState: state?.commonSlice?.cartState,
    couponDefault: state?.commonSlice?.cartState?.coupon,
    screenState: state?.commonSlice?.screenState || "Cart",
    couponApplication: state?.commonSlice?.appliedCoupon,
    wallet: state?.commonSlice?.profile?.wallet,
    walletUsed: state?.commonSlice?.walletUsed,
    cartData: state?.commonSlice?.cartData,
    shippingCost: state?.commonSlice?.shippingCost,
    isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
  }));

  // console.log(cartState, "cart state......")
  // console.log(wallet, "wallet amount......")
  // console.log(walletUsed, "wallet used amount......")
  // useEffect(() => {
  //   dispatch(getCart());
  // }, []);

  const cartProducts = Array.isArray(cartState?.carts?.products)
    ? cartState?.carts?.products
    : [];
  const subtotal = cartState?.carts?.price || 0;
  const discounts = cartState?.carts?.discountPrice || 0;
  const tax = cartState?.carts?.taxPrice || 0;
  // const shippingCost = cartData?.shippingCost || 0;

  console.log(cartState, "--cartState--");

  // console.log(cartProducts, "Cart Products---")

  const formatPrice = (n) => (Number(n) ? Number(n).toFixed(2) : "0.00");

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const isCouponValid = (coupon) => {
    if (!coupon) return false;
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validTill = new Date(coupon.valid_till);
    return now >= validFrom && now <= validTill && coupon.status === true;
  };

  const meetsMinimumOrder = (coupon) => {
    if (!coupon) return false;
    return subtotal >= coupon.minOrder;
  };

  const getDiscountDisplay = (coupon) => {
    if (!coupon) return "";
    if (coupon.type === "Percentage")
      return `${coupon.percentage}% ${t("OFF")}`;
    if (coupon.type === "Fixed")
      return `${getCurrencySymbol(userCountry)} ${coupon.amount} ${t("OFF")}`;
    return t("Discount");
  };

  // function getDiscountValue(coupon) {
  //   if (!coupon) return 0;
  //   if (coupon.type === "Percentage") {
  //     return ((subtotal - discounts) * coupon.percentage) / 100;
  //   }
  //   if (coupon.type === "Fixed") {
  //     return coupon.amount;
  //   }
  //   return 0;
  // }

  // function getDiscountValue(coupon) {
  //   if (!coupon) return 0;

  //   console.log(cartProducts, "--cartProducts--");
  //   // ✅ Get only matched products
  //   const matchedProducts = cartProducts?.filter((item) =>
  //     item?.productId?.categoryId?.some((catId) =>
  //       coupon?.categories?.includes(catId),
  //     ),
  //   );

  //   if (!matchedProducts?.length) return 0;

  //   // ✅ Calculate total of matched products
  //   const matchedTotal = matchedProducts.reduce((total, item) => {
  //     const price = Number(item?.variantId?.price || 0);
  //     const qty = Number(item?.variantId?.quantity || 1);
  //     return total + price * qty;
  //   }, 0);

  //   console.log("Matched Total:", matchedTotal);

  //   // ✅ Apply discount ONLY on matched total
  //   if (coupon.type === "Percentage") {
  //     return (matchedTotal * (coupon.percentage || 0)) / 100;
  //   }

  //   if (coupon.type === "Fixed") {
  //     return coupon.amount || 0;
  //   }

  //   return 0;
  // }

  function getDiscountValue(coupon) {
    if (!coupon) return 0;

    // ✅ Normalize coupon categories (string)
    const couponCategories = coupon?.categories?.map(String);

    // ✅ Filter matched products
    const matchedProducts = cartProducts?.filter((item) => {
      const productCategories = item?.productId?.categoryId?.map(String) || [];

      return productCategories.some((catId) =>
        couponCategories.includes(catId),
      );
    });

    console.log("Matched Products:", matchedProducts);

    if (!matchedProducts.length) return 0;

    // ✅ Calculate ONLY matched total
    const matchedTotal = matchedProducts.reduce((total, item) => {
      const price = Number(item?.variantId?.price || 0);
      const qty = Number(item?.quantity || 1);
      return total + price * qty;
    }, 0);

    console.log("Matched Total:", matchedTotal);

    // ✅ Apply discount only on matched
    if (coupon.type === "Percentage") {
      return (matchedTotal * (coupon.percentage || 0)) / 100;
    }

    if (coupon.type === "Fixed") {
      return Math.min(coupon.amount || 0, matchedTotal);
    }

    return 0;
  }

  const getMaxWalletAmount = () => {
    const walletBalance = wallet?.amount || 0;
    const totalBeforeWallet = subtotal - discounts - couponDiscount + tax;
    return Math.min(walletBalance, totalBeforeWallet);
  };

  const handleWalletToggle = (checked) => {
    if (cartProducts.length === 0 || subtotal === 0) {
      toast.error(t("Cart is empty"));
      return;
    }
    if (checked) {
      const maxAmount = getMaxWalletAmount();
      setWalletAmountToUse(maxAmount);
      dispatch(setWalletUsed(maxAmount));
    } else {
      setWalletAmountToUse(0);
      dispatch(setWalletUsed(0));
    }
  };

  // console.log(useWallet, "UseWallet.........")
  // console.log(walletAmountToUse, "UseWallet.........")

  const handleWalletAmountChange = (amount) => {
    const maxAmount = getMaxWalletAmount();
    const finalAmount = Math.min(Math.max(0, amount), maxAmount);
    setWalletAmountToUse(finalAmount);
    dispatch(setWalletUsed(finalAmount));
  };

  const couponDiscount = couponApplication
    ? getDiscountValue(couponApplication)
    : 0;

  const walletDiscount = walletUsed > 0 ? walletAmountToUse : 0;

  const calculateGrandTotal = () => {
    let total = subtotal;

    if (discounts > 0) {
      total -= discounts;
    }

    if (couponDiscount > 0) {
      total -= couponDiscount;
    }

    if (tax > 0) {
      total += tax;
    }

    if (walletDiscount > 0) {
      total -= walletDiscount;
    }

    if (shippingCost && shippingCost > 0) {
      total += shippingCost;
    }

    return Math.max(0, total);
  };

  const grandTotal = calculateGrandTotal();

  const getAllCoupons = async () => {
    try {
      setLoading(true);
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "/products/getCoupons",
        data: {
          page: 1,
          pageSize: 100,
          amount: subtotal - discounts + tax,
          categoryIds: [
            ...new Set(
              categoryId.flatMap((item) => item?.productId?.categoryId),
            ),
          ],
        },
      });
      setCoupons(response?.results?.coupons || []);
      setLoading(false);
    } catch (error) {
      console.log(t("Error fetching coupons:"), error?.message);
    } finally {
      setLoading(false);
    }
  };

  const validateAndApplyCoupon = async (coupon) => {
    try {
      if (!isCouponValid(coupon)) {
        console.log(t("Coupon is invalid or expired"));
        return false;
      }
      if (!meetsMinimumOrder(coupon)) {
        console.log(
          `${t("Minimum order of")} $${coupon.minOrder} ${t("required.")}`,
        );
        return false;
      }

      const validationResponse = await callMiddleWare({
        method: "POST",
        endpoint: "products/checkValidCoupon",
        data: {
          name: coupon.name,
          amount: subtotal - discounts + tax,
          categoryIds: [
            ...new Set(
              categoryId.flatMap((item) => item?.productId?.categoryId),
            ),
          ],
        },
      });

      if (!validationResponse?.error) {
        dispatch(setAppliedCoupon(coupon));
        setCoupleApplicable(validationResponse || null);
        toast.success(t("Coupon applied"));
        return true;
      } else {
        toast.error(t("Invalid Coupon"));
        return false;
      }
    } catch (error) {
      console.error(t("Error applying coupon:"), error);
      return false;
    }
  };

  const handleApplyCoupon = async (coupon) => {
    try {
      setApplyingCoupon(coupon._id);
      if (categoryId.length > 0) {
        await validateAndApplyCoupon(coupon);
      }
      document.getElementById("cllose").click();
    } finally {
      setApplyingCoupon(null);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      dispatch(setAppliedCoupon(null));
      setCoupleApplicable(null);
      console.log(t("Coupon removed successfully"));
      toast.success(t("Coupon removed"));
    } catch (error) {
      console.error(t("Error removing coupon:"), error);
    }
  };

  const handleToggleCoupon = async (coupon) => {
    if (couponApplication?._id === coupon._id) {
      await handleRemoveCoupon();
    } else {
      await handleApplyCoupon(coupon);
    }
  };

  // Reset wallet state on component mount to ensure checkbox is unchecked initially
  useEffect(() => {
    setWalletAmountToUse(0);
    dispatch(setWalletUsed(0));
  }, []);

  // Reset wallet usage when cart is empty or screen state changes back to Cart
  useEffect(() => {
    if (cartProducts.length === 0 || subtotal === 0) {
      setWalletAmountToUse(0);
      dispatch(setWalletUsed(0));
    }
  }, [cartProducts.length, subtotal]);

  useEffect(() => {
    if (walletUsed > 0) {
      const maxAmount = getMaxWalletAmount();
      // Update wallet amount whenever cart values change
      // This ensures wallet amount adjusts both when total decreases or increases
      setWalletAmountToUse(maxAmount);
      dispatch(setWalletUsed(maxAmount));
    }
  }, [subtotal, discounts, couponDiscount, tax, walletUsed]);

  // Sync wallet state from Redux only on initial mount or when explicitly changed elsewhere
  useEffect(() => {
    if (walletUsed !== walletAmountToUse && cartProducts.length > 0) {
      setWalletAmountToUse(walletUsed || 0);
    }
  }, [walletUsed]);

  useEffect(() => {
    if (!categoryId) return;
    if (categoryId?.length > 0) {
      console.log(
        categoryId.map((item) => item?.productId?.categoryId),
        "categoryId.map((item) => item?.categoryId)",
      );
      getAllCoupons();
    }
  }, [categoryId]);

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
  return (
    <>
      <div className="col-lg-5">
        <div className="samedesignborder mb-3">
          <div className="row">
            <div className="col-md-12 mb-3 d-flex align-items-center justify-content-between">
              <div className="couponhead">{t("Select Coupons")}</div>
              <a
                className="allcoupon"
                data-bs-toggle="modal"
                data-bs-target="#coupon"
                href="#"
              >
                {t("All Coupons")}{" "}
                <img src="assets/img/couponarrow.png" alt="" />
              </a>
            </div>
            <div className="col-md-12">
              {couponApplication && (
                <div className="applied-coupon-info mb-3 p-3 bg-light rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{t("Applied Coupon")}: </strong>
                      {couponApplication?.name}
                      <br />
                      {}
                      <small className="text-success">
                        {getCurrencySymbol(userCountry)}{" "}
                        {getDiscountDisplay(couponApplication)}
                      </small>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={handleRemoveCoupon}
                    >
                      {t("Remove")}
                    </button>
                  </div>
                </div>
              )}
              <a
                className="couponbtns row align-items-center"
                href="#"
                data-bs-toggle="modal"
                data-bs-target="#coupon"
                dir="ltr"
              >
                <div className="col d-flex align-items-center">
                  <img src="assets/img/coupon.png" alt="" />
                  <span>{t("Apply Coupons")}</span>
                </div>
                <div className="col-auto">
                  <img src="assets/img/arroww.png" alt="" />
                </div>
              </a>

              {wallet?.amount > 0 && (
                <div className="wallet-box mt-3" dir="ltr">
                  <div className="wallet-balance d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div className="d-flex align-items-center flex-grow-1">
                      <input
                        type="checkbox"
                        className="form-check-input me-3"
                        checked={walletUsed > 0}
                        onChange={(e) => handleWalletToggle(e.target.checked)}
                        style={{ transform: "scale(1.2)" }}
                      />
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <label
                              className="wallet-use fw-bold mb-1"
                              style={{ cursor: "pointer" }}
                            >
                              {t("Use Your Wallet Balance")}
                            </label>
                            <div className="text-muted small">
                              {t("coupon.available")}:{" "}
                              {getCurrencySymbol(userCountry)}{" "}
                              {formatPrice(wallet?.amount || "0.00")}
                            </div>
                          </div>
                          <div className="text-end">
                            <span className="wallet-amount fw-bold text-success">
                              {getCurrencySymbol(userCountry)}{" "}
                              {formatPrice(walletAmountToUse)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {screenState == "Payment" ? null : (
          <div className="samedesignborder mb-3">
            {/* {console.log(cartState, "Cart State in coupons.....")} */}
            <div className="ordersummary">
              <div className="couponhead mb-3">{t("Price Details")}</div>
              <div className="ordersummryinner">
                <div className="ordersummrytxt">
                  <strong>{t("Subtotal")}</strong>
                  <span>
                    {getCurrencySymbol(userCountry)}{" "}
                    {formatPrice(subtotal)}{" "}
                  </span>
                </div>
                {/* {console.log(shippingCost)} */}
                {shippingCost > 0 && (
                  <div className="ordersummrytxt">
                    <strong>{t("orders.shippingCost")}</strong>
                    <span>
                      {getCurrencySymbol(userCountry)}{" "}
                      {formatPrice(shippingCost)}{" "}
                    </span>
                  </div>
                )}
                {discounts > 0 && (
                  <div className="ordersummrytxt">
                    <strong>{t("Discounts")}</strong>
                    <span>
                      -{getCurrencySymbol(userCountry)}{" "}
                      {formatPrice(discounts)}{" "}
                    </span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="ordersummrytxt">
                    <strong>{t("Coupon Discount")}</strong>
                    <span>
                      -{getCurrencySymbol(userCountry)}{" "}
                      {formatPrice(couponDiscount)}{" "}
                    </span>
                  </div>
                )}

                {walletDiscount > 0 && (
                  <div className="ordersummrytxt text-success">
                    <strong>{t("Wallet Balance Used")}</strong>
                    <span>
                      -{getCurrencySymbol(userCountry)}{" "}
                      {formatPrice(walletDiscount)}{" "}
                    </span>
                  </div>
                )}
              </div>
              <div className="ordersummrytotal">
                <strong>{t("Grand Total")}</strong>
                <strong>
                  {getCurrencySymbol(userCountry)} {formatPrice(grandTotal)}
                </strong>
              </div>
              {walletDiscount > 0 && (
                <div className="ordersummrytxt text-success small mt-2">
                  <strong>{t("coupon.remaining_balance")} </strong>
                  <span>
                    {getCurrencySymbol(userCountry)}{" "}
                    {formatPrice((wallet?.amount || 0) - walletDiscount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {screenState === "Cart" && (
          <div className="mt-4">
            <a
              className="authbtns2 w-100"
              style={{ cursor: "pointer" }}
              onClick={() => {
                dispatch(setScreenState("Address"));
                window.scrollTo(0, 0);
              }}
            >
              {t("Continue to Checkout")}
            </a>
          </div>
        )}

        {screenState === "Address" && !selectedAddress && (
          <div className="mt-4">
            <a
              style={{ cursor: "pointer" }}
              className="authbtns2 w-100"
              onClick={() => {
                const addressSave = document
                  .getElementById("buttonSaveAddress")
                  .click();
                window.scrollTo(0, 0);
                if (addressSave) {
                  makeDefaultAddress(selectedAddress._id);
                  window.scrollTo(0, 0);
                }
              }}
            >
              {t("Continue to Checkout")}
            </a>
          </div>
        )}

        {selectedAddress && (
          <div className="mt-4">
            <a
              style={{ cursor: "pointer" }}
              className="authbtns2 w-100"
              onClick={() => makeDefaultAddress(selectedAddress._id)}
            >
              {t("Continue to Checkout")}
            </a>
          </div>
        )}
      </div>

      <div
        className="modal fade addtocartmodal allcoupons"
        id="coupon"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body position-relative">
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                id="cllose"
                aria-label="Close"
              />
              <div className="row">
                <div className="col-md-12 mb-4">
                  <div className="modalhead text-center">
                    <h2>{t("Available Coupons")}</h2>
                  </div>
                </div>
                <div className="col-md-12 mb-3">
                  <div className="row">
                    {loading ? (
                      [...Array(4)].map((_, idx) => (
                        <div className="col-md-6 mb-3" key={idx}>
                          <div className="mycouponmain p-3 skeleton">
                            <div
                              className="skeleton-box mb-2"
                              style={{ height: "20px", width: "70%" }}
                            ></div>
                            <div
                              className="skeleton-box"
                              style={{ height: "14px", width: "100%" }}
                            ></div>
                          </div>
                        </div>
                      ))
                    ) : coupons.length > 0 ? (
                      coupons.map((coupon) => {
                        const isValid = isCouponValid(coupon);
                        const meetsMinOrder = meetsMinimumOrder(coupon);
                        const canApply = isValid && meetsMinOrder;
                        const isDefaultCoupon =
                          couponDefault?._id === coupon._id;

                        return (
                          <div className="col-md-6 mb-3" key={coupon._id}>
                            <div
                              className={`mycouponmain h-100 ${
                                couponApplication?._id === coupon._id
                                  ? "applied"
                                  : ""
                              } ${!canApply ? "expired" : ""}`}
                            >
                              <div className="row border-bottom mb-2 pb-3 align-items-center mx-0">
                                <div className="col-auto ps-0">
                                  <div className="Couponsicon">
                                    <img
                                      src="assets/img/profileicon3.png"
                                      alt=""
                                    />
                                  </div>
                                </div>
                                <div className="col ps-0">
                                  <div className="coupontitle">
                                    {coupon.name}
                                  </div>
                                  <div className="coupon-code">
                                    <small className="text-muted">
                                      {t("Code:")}{" "}
                                      <strong>{coupon.name}</strong>
                                    </small>
                                  </div>
                                  <div className="discount-badge">
                                    <span className="badge bg-success">
                                      {getDiscountDisplay(coupon)}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-md-auto mt-md-0 mt-3 pe-md-0">
                                  <button
                                    className={`couponapplybtn ${
                                      applyingCoupon === coupon._id
                                        ? "loading"
                                        : ""
                                    }`}
                                    disabled={
                                      applyingCoupon === coupon._id ||
                                      !canApply ||
                                      couponApplication?._id === coupon._id
                                    }
                                    onClick={() => handleToggleCoupon(coupon)}
                                  >
                                    {applyingCoupon === coupon._id
                                      ? t("Applying...")
                                      : couponApplication?._id === coupon._id
                                        ? t("Applied ✓")
                                        : !canApply
                                          ? t("Cannot Apply")
                                          : t("Apply")}
                                  </button>
                                </div>
                              </div>

                              <div className="Couponsdetails">
                                <div className="mb-2">
                                  {coupon.description_en}
                                </div>
                                <div className="coupon-details">
                                  <div className="detail-item">
                                    <small>
                                      <strong>{t("Min. Order:")}</strong>
                                      {/* {t(`Get ${getCurrencySymbol(userCountry)} ${coupon.minOrder} off on a minimum order of ${getCurrencySymbol(userCountry)}${coupon.amount}`)} */}
                                      {t("coupon.coupon_offer", {
                                        symbol: getCurrencySymbol(userCountry),
                                        minOrder: coupon.minOrder,
                                        amount: coupon.amount,
                                      })}
                                      {!meetsMinOrder && (
                                        <span className="text-danger">
                                          {" "}
                                          {t("coupon.not_met")}
                                        </span>
                                      )}
                                    </small>
                                  </div>
                                  <div className="detail-item">
                                    <small>
                                      <strong>{t("coupon.Valid")}:</strong>{" "}
                                      {formatDate(coupon.valid_from)} {t("to")}{" "}
                                      {formatDate(coupon.valid_till)}
                                      {!isValid && (
                                        <span className="text-danger">
                                          {" "}
                                          {t("coupon.Expired")}
                                        </span>
                                      )}
                                    </small>
                                  </div>
                                  {/* <div className="detail-item">
                                    <small>
                                      <strong>{t("Usage:")}</strong> {coupon.used}/
                                      {coupon.limit}
                                    </small>
                                  </div> */}
                                  {canApply && (
                                    <div className="detail-item">
                                      <small className="text-success">
                                        <strong>{t("You save:")}</strong>{" "}
                                        {getCurrencySymbol(userCountry)}{" "}
                                        {getDiscountValue(coupon).toFixed(2)}
                                      </small>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-12">
                        <p className="text-center">
                          {t("No Coupons Available")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
          .skeleton {
            background: #f2f2f2;
            border-radius: 8px;
            animation: pulse 1.5s infinite;
          }
          .skeleton-box {
            background: #e0e0e0;
            border-radius: 4px;
          }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
          }
          .mycouponmain {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            transition: all 0.3s ease;
          }
          .mycouponmain.applied {
            border: 2px solid #28a745;
            background-color: #f8fff9;
          }
          .mycouponmain.expired {
            border: 1px solid #ccc;
            background-color: #f8f9fa;
            opacity: 0.7;
          }
          .couponapplybtn {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
          .couponapplybtn:disabled {
            background: #7dc98bff;
            cursor: not-allowed;
          }
          .couponapplybtn.loading {
            background: #17a2b8;
          }
          .applied-coupon-info {
            border-left: 4px solid #28a745;
          }
          .discount-badge {
            margin-top: 5px;
          }
          .coupon-details {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #eee;
          }
          .detail-item {
            margin-bottom: 3px;
          }
          .coupon-code {
            margin: 2px 0;
          }
          .wallet-box .form-control {
            max-width: 120px;
          }
        `}
      </style>
    </>
  );
};

export default Coupons;
