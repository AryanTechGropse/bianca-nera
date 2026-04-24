import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getCart,
  getCounts,
  getProfile,
  setScreenState,
} from "@/store/serviceSlices/commonSlice";
import { useDispatch, useSelector } from "react-redux";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import PaymentSuccess from "./PaymentSuccess";
import toast from "react-hot-toast";
import { persistor } from "@/store/store";
import { t } from "i18next";

const OrderConfirm = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [payment, setPayment] = useState([]);
  const [orderAttempted, setOrderAttempted] = useState(false);
  const shippingCost = useSelector(
    (state) => state?.commonSlice?.shippingCost ?? 0,
  );

  const addressList = useSelector(
    (state) => state?.commonSlice?.address?.addresses ?? [],
  );
  const cartState = useSelector(
    (state) => state?.commonSlice?.cartState?.carts ?? {},
  );
  const isLoading = useSelector((state) => state?.commonSlice?.isLoading);
  const giftCards = useSelector(
    (state) => state?.commonSlice?.giftCards?.gifts,
  );

  const defaultAddress = Array.isArray(addressList)
    ? addressList.find((addr) => addr.isDefault)
    : null;

  const addressId = defaultAddress?._id;

  const [orderDetails, setOrderDetails] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [error, setError] = useState("");

  const getCartProducts = useCallback(() => {
    if (!cartState?.products) return [];

    return cartState.products.map((item) => ({
      productId: item?.productId?._id,
      variantId: item?.variantId?._id,
      vendorId: item?.productId?.userId?._id,
      quantity: item?.quantity ?? 1,
      price: item?.variantId?.price ?? 0,
      discountPrice: item?.variantId?.discountPrice ?? 0,
      discountPercentage: item?.variantId?.discountPercentage ?? 0,
      tax: item?.variantId?.tax ?? 0,
      taxPrice: cartState?.taxPrice ?? 0,
      totalPrice: item?.variantId?.totalPrice ?? 0,
    }));
  }, [cartState]);

  const validateOrder = useCallback(() => {
    if (!addressId) {
      return t("Please select a delivery address");
    }

    if (!cartState?.products?.length) {
      return t("Your cart is empty");
    }

    if (cartState?.discountPrice <= 0) {
      return t("Invalid order amount");
    }

    return null;
  }, [addressId, cartState]);

  const paymentDataString = localStorage.getItem("paymentData");

  const createOrder = async () => {
    // Check if order was already created in this session
    const orderCreated = sessionStorage.getItem("orderCreated");
    const isPaymentData = localStorage.getItem("paymentData");

    console.log(isPaymentData, "---isPaymentData--");
    if (!isPaymentData) {
      console.log("Order already created in this session, skipping...");
      router.push("/");
      return;
    }

    try {
      setIsProcessing(true);
      let paymentData = {};
      try {
        const parsedData = paymentDataString
          ? JSON.parse(paymentDataString)
          : {};
        const safeParse = (data) => {
          try {
            return data ? JSON.parse(data) : null;
          } catch {
            return null;
          }
        };
        const checkoutId = safeParse(localStorage.getItem("checkoutId"));
        paymentData = {
          ...parsedData,
          checkoutId: checkoutId || null,
        };
      } catch (error) {
        console.error(t("Error parsing paymentData from localStorage:"), error);
        paymentData = {};
      }

      const response = await callMiddleWare({
        method: "post",
        endpoint: "products/createOrder",
        data: paymentData,
      });

      if (!response?.error) {
        toast.success(t("Order placed successfully"));
        setPayment(response?.results);

        // Mark order as created in this session
        sessionStorage.setItem("orderCreated", "true");
        sessionStorage.setItem("orderId", response?.results?.order?._id);
        sessionStorage.setItem("orderData", JSON.stringify(response?.results));
        localStorage.removeItem("paymentData");
        localStorage.removeItem("home-cache");
        localStorage.removeItem("home-storage");

        console.log(response?.results, "orderData");

        dispatch(getProfile());
        dispatch(getCart());
        dispatch(getCounts());
      } else {
        throw new Error(response?.message || t("Order creation failed"));
      }
    } catch (error) {
      console.error(t("Order creation failed:"), error);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    createOrder();
  }, []);

  const language = localStorage.getItem("i18nextLng") || "en";

  const seoTitle =
    language === "ar"
      ? `تم تأكيد الطلب! فخامتك بانتظارك – بيانكا نيرا`
      : `Order Confirmed! Your Luxury Awaits – Bianca Nera`;

  const seoDescription =
    language === "ar"
      ? `أخبار رائعة! تم تأكيد طلبك من بيانكا نيرا. يتم تجهيز قطعك الفاخرة للتوصيل السريع والمجاني إلى بابك.`
      : `Exciting news! Your Bianca Nera order is confirmed. Your stunning luxury fashion pieces are being prepared for fast, free delivery right to your door.`;

  return (
    <>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <PaymentSuccess payment={payment} />
    </>
  );
};

export default OrderConfirm;
