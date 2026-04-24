import React, { useState, useCallback, useMemo, useEffect } from "react";
import Coupons from "./Coupons";
import { useDispatch, useSelector } from "react-redux";
import {
  setScreenState,
  setWalletUsed,
} from "@/store/serviceSlices/commonSlice";
import { useRouter } from "next/navigation";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import toast from "react-hot-toast";
import { persistor } from "@/store/store";
import { t } from "i18next";
import i18n from "@/i18n/i18n";

const Payment = ({ setCoupleApplicable }) => {
  const isRTL = i18n.dir() === "rtl";
  const dispatch = useDispatch();
  const router = useRouter();

  const cartState = useSelector((state) => state?.commonSlice?.cartState ?? {});

  const addressList = useSelector(
    (state) => state?.commonSlice?.address?.addresses ?? [],
  );
  const { isUserLoggedIn } = useSelector((state) => ({
    isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
  }));
  const couponApplication = useSelector(
    (state) => state?.commonSlice?.appliedCoupon ?? null,
  );
  const isLoading = useSelector((state) => state?.commonSlice?.isLoading);
  const giftCards = useSelector(
    (state) => state?.commonSlice?.giftCards?.gifts,
  );
  const wallet = useSelector((state) => state?.commonSlice?.profile?.wallet);
  const walletUsed = useSelector(
    (state) => state?.commonSlice?.walletUsed ?? 0,
  );
  const shippingCost = useSelector(
    (state) => state?.commonSlice?.shippingCost ?? 0,
  );

  const [useWallet, setUseWallet] = useState(false);
  const [walletAmountToUse, setWalletAmountToUse] = useState(0);

  const carts = cartState?.carts ?? {};
  const cartProducts = Array.isArray(carts?.products) ? carts.products : [];

  const combination = cartProducts?.variantId?.combination;

  const subtotal = Number(carts?.price ?? 0);
  const discounts = Number(carts?.discountPrice ?? 0);
  const tax = Number(carts?.taxPrice ?? 0);

  const defaultAddress =
    Array.isArray(addressList) && addressList.length > 0
      ? addressList.find((addr) => addr.isDefault) || addressList[0]
      : null;
  const addressId = defaultAddress?._id ?? null;

  const [orderDetails, setOrderDetails] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMode, setProcessingMode] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Card");
  const [error, setError] = useState("");

  const formatPrice = (n) => (Number(n) ? Number(n).toFixed(2) : "0.00");

  function getDiscountValue(coupon) {
    if (!coupon) return 0;
    if (coupon.type === "Percentage") {
      return ((subtotal - discounts) * (coupon.percentage ?? 0)) / 100;
    }
    if (coupon.type === "Fixed") {
      return Number(coupon.amount ?? 0);
    }
    return 0;
  }

  const couponDiscount = couponApplication
    ? getDiscountValue(couponApplication)
    : 0;

  const getMaxWalletAmount = () => {
    const walletBalance = wallet?.amount || 0;
    const totalBeforeWallet = subtotal - discounts - couponDiscount + tax;
    return Math.min(walletBalance, totalBeforeWallet);
  };

  const handleWalletToggle = (checked) => {
    setUseWallet(checked);
    if (checked) {
      const maxAmount = getMaxWalletAmount();
      setWalletAmountToUse(maxAmount);
      dispatch(setWalletUsed(maxAmount));
    } else {
      setWalletAmountToUse(0);
      dispatch(setWalletUsed(0));
    }
  };

  const handleWalletAmountChange = (amount) => {
    const maxAmount = getMaxWalletAmount();
    const finalAmount = Math.min(Math.max(0, amount), maxAmount);
    setWalletAmountToUse(finalAmount);
    dispatch(setWalletUsed(finalAmount));
  };

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

    if (useWallet && walletAmountToUse > 0) {
      total -= walletAmountToUse;
    }

    // if (shippingCost && shippingCost > 0) {
    //   total += shippingCost;
    // }

    return Math.max(0, total);
  };

  const grandTotal = calculateGrandTotal();
  const walletDiscount = useWallet ? walletAmountToUse : 0;

  const getCartProducts = useCallback(() => {
    return cartProducts.map((item) => {
      const productId = item?.productId?._id ?? item?.productId ?? null;
      const variant = item?.variantId ?? {};
      const quantity = Number(item?.quantity ?? 1);

      const variantPrice = Number(variant?.price ?? 0);
      const variantDiscountPrice = Number(variant?.discountPrice ?? 0);

      const unitPrice = variantPrice - variantDiscountPrice;

      // ✅ Extract color & size per product
      let color = "";
      let size = "";

      variant?.combination?.forEach((comb) => {
        if (
          comb?.attributeId?.name_en === "Colour" ||
          comb?.attributeId?.name_en === "color" ||
          comb?.attributeId?.name_en === "colour"
        ) {
          color = comb?.valueId?.name_en;
        }
        if (
          comb?.attributeId?.name_en === "Size" ||
          comb?.attributeId?.name_en === "size"
        ) {
          size = comb?.valueId?.name_en;
        }
      });

      return {
        productId,
        variantId: variant?._id ?? null,
        vendorId: item?.productId?.userId?._id ?? null,
        quantity,
        price: Number(unitPrice ?? 0),
        cartId: item?._id ?? null,
        discountPrice: variantDiscountPrice,
        discountPercentage: variant?.discountPercentage ?? 0,
        tax: variant?.tax ?? 0,
        taxPrice: carts?.taxPrice ?? 0,
        totalPrice: Number(unitPrice * quantity ?? 0),
        name_en:
          item?.productId?.name_en ?? item?.productId?.name ?? t("Product"),
        color,
        size,
      };
    });
  }, [cartProducts, carts?.taxPrice]);

  const validateOrder = useCallback(() => {
    if (!addressId) return t("Please select a delivery address.");
    if (!cartProducts.length) return t("Your cart is empty.");
    if (Number(subtotal) <= 0) return t("Invalid order amount.");
    return null;
  }, [addressId, cartProducts.length, subtotal]);

  useEffect(() => {
    if (walletUsed > 0) {
      setUseWallet(true);
      setWalletAmountToUse(walletUsed);
    }
  }, [walletUsed]);

  useEffect(() => {
    if (useWallet) {
      const maxAmount = getMaxWalletAmount();
      if (maxAmount < walletAmountToUse) {
        setWalletAmountToUse(maxAmount);
        dispatch(setWalletUsed(maxAmount));
      }
    }
  }, [subtotal, discounts, couponDiscount, tax]);

  const handlePaymentSubmit = async (e, paymentMode = "Card") => {
    if (e) e.preventDefault();
    try {
      setError("");
      setIsProcessing(true);
      setProcessingMode(paymentMode);

      const validationError = validateOrder();
      if (validationError) {
        setError(validationError);
        setIsProcessing(false);
        setProcessingMode(null);
        return;
      }

      const paymentAmount = Number(grandTotal >= 0 ? grandTotal : 0);

      const paymentData = {
        amount: (Number(paymentAmount) + Number(shippingCost)).toFixed(2),
        products: getCartProducts().map((p) => ({
          name_en: p.name_en || t("Product"),
          quantity: p.quantity,
          price: p.price.toFixed(2) * p.quantity,
          color: p.color,
          size: p.size,
        })),
        // color: getCartProducts().map((p) => ({ color: p.color })),
        // size: getCartProducts().map((p) => ({ size: p.size })),
        name: defaultAddress?.name || t("Customer"),
        email: defaultAddress?.email || "",
        phoneNumber: defaultAddress?.phoneNumber || "",
        discount: couponDiscount || 0,
        countryCode: defaultAddress?.countryCode || "",
        address: {
          name: defaultAddress?.name || t("Customer"),
          email: defaultAddress?.email || "",
          phoneNumber: defaultAddress?.phoneNumber || "",
          city: defaultAddress?.city || "",
          zipCode: defaultAddress?.zipCode || "",
          countryCode: defaultAddress?.countryCode || "",
          address: `${defaultAddress?.address ?? ""}${defaultAddress?.city ? ", " + defaultAddress.city : ""}${defaultAddress?.zipCode ? ", " + defaultAddress.zipCode : ""}`,
        },
        type: "web",
        appliedCouponId: couponApplication?._id ?? null,
        walletAmount: walletAmountToUse,
        shipmentCost: shippingCost || 0,
        paymentMode: paymentMode,
      };

      const Newpayload = {
        products: getCartProducts(),
        giftCardId: "",
        addressId: addressId,
        address: paymentData.address,
        amount: (Number(paymentAmount) + Number(shippingCost)).toFixed(2),
        paidAmount: paymentAmount.toFixed(2),
        discount: discounts.toFixed(2),
        couponDiscount: couponDiscount,
        walletDiscount: walletDiscount,
        finalAmount: paymentAmount.toFixed(2),
        paymentMethod: selectedPaymentMethod,
        couponId: couponApplication?._id ?? null,
        useWallet: useWallet,
        walletAmount: walletAmountToUse.toFixed(2),
        shipmentCost: shippingCost || 0,
        paymentMode: paymentMode,
      };

      if (paymentAmount > 0) {
        const response = await callMiddleWare({
          method: "POST",
          endpoint: "payment/payment",
          data: paymentData,
        });
        if (!response?.error) {
          // Handle Card payment response
          const cardPaymentLink = response?.results?.checkout?.Data?.InvoiceURL;
          const cardInvoiceId = response?.results?.checkout?.Data?.InvoiceId;

          // Handle Deema payment response
          const deemaPaymentLink =
            response?.results?.checkout?.data?.redirect_link ||
            response?.results?.checkout?.data?.redirect_url;
          const deemaOrderReference =
            response?.results?.checkout?.data?.order_reference;

          // Use appropriate values based on payment mode
          const paymentLink =
            paymentMode === "Deema" ? deemaPaymentLink : cardPaymentLink;
          const invoiceId =
            paymentMode === "Deema" ? deemaOrderReference : cardInvoiceId;

          const payload = {
            products: getCartProducts(),
            giftCardId: "",
            addressId: addressId,
            address: paymentData.address,
            amount: (Number(paymentAmount) + Number(shippingCost)).toFixed(2),
            paidAmount: paymentAmount.toFixed(2),
            discount: discounts.toFixed(2),
            couponDiscount: couponDiscount,
            walletDiscount: walletDiscount,
            finalAmount: paymentAmount.toFixed(2),
            paymentMethod: selectedPaymentMethod,
            couponId: couponApplication?._id ?? null,
            invoiceId,
            useWallet: useWallet,
            walletAmount: walletAmountToUse,
            shipmentCost: shippingCost || 0,
            paymentMode: paymentMode,
          };

          localStorage.setItem("paymentData", JSON.stringify(payload));
          localStorage.setItem("checkoutId", response?.results?.checkoutId);

          if (paymentLink) {
            window.open(paymentLink, "_self");
            return;
          } else {
            toast.success(t("Payment initiated. Redirecting..."));
          }
        }
      } else {
        try {
          setIsProcessing(true);
          localStorage.setItem("paymentData", JSON.stringify(Newpayload));
          router.push(
            `/Payment/Success?lang=${isRTL === true ? "Arabic" : "English"}&type=web`,
          );
        } catch (error) {
          console.error(t("Order creation failed:"), error);
        } finally {
          setIsProcessing(false);
          setProcessingMode(null);
        }
      }
    } catch (err) {
      console.error(t("Payment failed:"), err);
      setError(
        err?.message || t("Payment processing failed. Please try again."),
      );
    } finally {
      setIsProcessing(false);
      setProcessingMode(null);
    }
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
  const renderError = () =>
    error ? (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    ) : null;

  const handleCODSubmit = async () => {
    try {
      setError("");
      setIsProcessing(true);
      setProcessingMode("COD");

      const validationError = validateOrder();
      if (validationError) {
        setError(validationError);
        setIsProcessing(false);
        setProcessingMode(null);
        return;
      }

      const paymentAmount = Number(grandTotal >= 0 ? grandTotal : 0);

      const codPayload = {
        products: getCartProducts(),
        giftCardId: "",
        addressId: addressId,
        address: {
          name: defaultAddress?.name || t("Customer"),
          email: defaultAddress?.email || "",
          phoneNumber: defaultAddress?.phoneNumber || "",
          city: defaultAddress?.city || "",
          zipCode: defaultAddress?.zipCode || "",
          countryCode: defaultAddress?.countryCode || "",
          address: `${defaultAddress?.address ?? ""}${defaultAddress?.city ? ", " + defaultAddress.city : ""}${defaultAddress?.zipCode ? ", " + defaultAddress.zipCode : ""}`,
        },
        amount: paymentAmount.toFixed(2),
        paidAmount: (Number(paymentAmount) + Number(shippingCost)).toFixed(2),
        discount: discounts.toFixed(2),
        couponDiscount: couponDiscount,
        walletDiscount: walletDiscount,
        finalAmount: paymentAmount.toFixed(2),
        // paymentMethod: "COD",
        paymentMode: "COD",
        couponId: couponApplication?._id ?? null,
        useWallet: useWallet,
        walletAmount: walletAmountToUse.toFixed(2),
        shipmentCost: shippingCost || 0,
        // paymentMode: "COD",
      };

      const data = localStorage.setItem(
        "paymentData",
        JSON.stringify(codPayload),
      );
      // if (data) {
      setTimeout(() => {
        router.push(
          `/Payment/Success?lang=${isRTL === true ? "Arabic" : "English"}&type=web`,
        );
      }, 1000);
      // }
    } catch (err) {
      console.error(t("Payment failed:"), err);
      setError(
        err?.message || t("Payment processing failed. Please try again."),
      );
    } finally {
      setIsProcessing(false);
      setProcessingMode(null);
    }
  };

  return (
    <div className="cartpage py-md-5 py-4">
      <div className="cart-container">
        <div className="row">
          <div className="col-md-7">
            <div className="samedesignborder mb-3 adreestselected">
              {defaultAddress ? (
                <div className="row align-items-center">
                  <div className="col">
                    <div className="deliverto">
                      {t("Deliver to")}: <span>{defaultAddress?.name}</span>
                    </div>
                    <div className="delivertoaddress">
                      {defaultAddress?.address}, {defaultAddress?.city}{" "}
                      {defaultAddress?.zipCode}
                    </div>
                  </div>
                  <div className="col-md-auto mt-md-0 mt-3">
                    <button
                      className="authbtns2"
                      onClick={() => dispatch(setScreenState("Address"))}
                      disabled={isProcessing}
                    >
                      {t("Change Address")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center">
                  <p>{t("No delivery address selected")}</p>
                  <button
                    className="authbtns2"
                    onClick={() => dispatch(setScreenState("Address"))}
                  >
                    {t("Add Address")}
                  </button>
                </div>
              )}
            </div>

            {renderError()}

            <div className="samedesignborder mb-3">
              <div className="loginform p-0">
                <h2>{t("Make Payment")}</h2>
                <div className="payemntstabs">
                  <div className="tab-content mt-3" id="nav-tabContent">
                    <div>
                      <>
                        <form
                          className="authform row w-100"
                          onSubmit={(e) => handlePaymentSubmit(e, "Card")}
                        >
                          <div className="col-12 mb-3">
                            <div className="order-summary">
                              <h6>{t("Order Summary")}</h6>
                              <div className="d-flex justify-content-between">
                                <span>{t("Sub Total")} :</span>
                                <span>
                                  {getCurrencySymbol(userCountry)}{" "}
                                  {formatPrice(subtotal)}
                                </span>
                              </div>

                              {discounts > 0 && (
                                <div className="d-flex justify-content-between">
                                  <span>{t("Discount")} :</span>
                                  <span className="text-success">
                                    -{getCurrencySymbol(userCountry)}{" "}
                                    {formatPrice(discounts)}
                                  </span>
                                </div>
                              )}

                              {couponDiscount > 0 && (
                                <div className="d-flex justify-content-between">
                                  <span>{t("Coupon Discount")} :</span>
                                  <span className="text-success">
                                    -{getCurrencySymbol(userCountry)}{" "}
                                    {formatPrice(couponDiscount)}
                                  </span>
                                </div>
                              )}

                              {walletDiscount > 0 && (
                                <div className="d-flex justify-content-between text-success">
                                  <span>{t("Wallet Balance Used")} :</span>
                                  <span>
                                    -{getCurrencySymbol(userCountry)}{" "}
                                    {formatPrice(walletDiscount)}
                                  </span>
                                </div>
                              )}

                              <div className="d-flex justify-content-between">
                                <span>{t("Tax")} :</span>
                                <span>
                                  {getCurrencySymbol(userCountry)}{" "}
                                  {formatPrice(tax)}
                                </span>
                              </div>

                              {shippingCost > 0 && (
                                <div className="d-flex justify-content-between">
                                  <span>{t("orders.shippingCost")} :</span>
                                  <span>
                                    {getCurrencySymbol(userCountry)}{" "}
                                    {formatPrice(shippingCost)}
                                  </span>
                                </div>
                              )}

                              <hr />
                              <div className="d-flex justify-content-between fw-bold">
                                <span>{t("Total Amount")}:</span>
                                <span>
                                  {getCurrencySymbol(userCountry)}{" "}
                                  {formatPrice(
                                    grandTotal >= 0
                                      ? grandTotal + shippingCost
                                      : 0,
                                  )}
                                </span>
                              </div>

                              {walletDiscount > 0 && (
                                <div className="ordersummrytxt text-success small mt-2">
                                  <strong>
                                    {t("Remaining Wallet Balance:")}{" "}
                                  </strong>
                                  <span>
                                    {getCurrencySymbol(userCountry)}{" "}
                                    {formatPrice(
                                      (wallet?.amount || 0) - walletDiscount,
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="col-md-12 form-group mb-3">
                            <button
                              type="submit"
                              className="authbtns2 w-100"
                              disabled={
                                isProcessing ||
                                !defaultAddress ||
                                !cartProducts.length
                              }
                            >
                              {processingMode === "Card" ? (
                                <>
                                  <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                  {t("Processing...")}
                                </>
                              ) : (
                                `${t("Proceed To Pay")} ${getCurrencySymbol(userCountry)} ${formatPrice(
                                  grandTotal >= 0
                                    ? grandTotal + shippingCost
                                    : 0,
                                )}`
                              )}
                            </button>
                          </div>

                          {/* Pay with Demma button - only for Kuwait and when amount is in range */}
                          {localStorage.getItem("userCountry") === "Kuwait" &&
                            (() => {
                              const rate = cartState?.rate || 1;
                              const range = cartState?.range || [0, 0];
                              const dividedAmount = grandTotal / rate;
                              const isInRange =
                                dividedAmount >= range[0] &&
                                dividedAmount <= range[1];

                              if (isInRange) {
                                return (
                                  <div className="col-md-12 form-group mb-3">
                                    <button
                                      type="button"
                                      className="authbtns2 w-100"
                                      style={{
                                        backgroundColor: "#6c5ce7",
                                        borderColor: "#6c5ce7",
                                      }}
                                      disabled={
                                        isProcessing ||
                                        !defaultAddress ||
                                        !cartProducts.length
                                      }
                                      onClick={() => {
                                        // Handle Demma payment logic here
                                        handlePaymentSubmit(null, "Deema");
                                      }}
                                    >
                                      {processingMode === "Deema" ? (
                                        <>
                                          <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                            aria-hidden="true"
                                          ></span>
                                          {t("Processing...")}
                                        </>
                                      ) : (
                                        t("Pay with Demma")
                                      )}
                                    </button>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                          {/* Cash on Delivery button - only for Kuwait */}
                          {(localStorage.getItem("userCountry") === "Kuwait" ||
                            localStorage.getItem("userCountry") ===
                              "Qatar") && (
                            <div className="col-md-12 form-group mb-3">
                              <button
                                type="button"
                                className="authbtns2 w-100"
                                disabled={
                                  isProcessing ||
                                  !defaultAddress ||
                                  !cartProducts.length
                                }
                                onClick={handleCODSubmit}
                              >
                                {processingMode === "COD" ? (
                                  <>
                                    <span
                                      className="spinner-border spinner-border-sm me-2"
                                      role="status"
                                      aria-hidden="true"
                                    ></span>
                                    {t("Processing...")}
                                  </>
                                ) : (
                                  t("Cash on Delivery")
                                )}
                              </button>
                            </div>
                          )}

                          {(!defaultAddress || !cartProducts.length) && (
                            <div className="col-12">
                              <small className="text-muted">
                                {!defaultAddress &&
                                  `${t("Please select a delivery address.")} `}
                                {!cartProducts.length &&
                                  t("Your cart is empty.")}
                              </small>
                            </div>
                          )}
                        </form>
                      </>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Coupons categoryId={cartState?.carts?.products} />
        </div>
      </div>

      <style>
        {`
          .wallet-box .form-control {
            max-width: 120px;
          }
          .wallet-balance {
            border: 1px solid #dee2e6;
          }
        `}
      </style>
    </div>
  );
};

export default Payment;
