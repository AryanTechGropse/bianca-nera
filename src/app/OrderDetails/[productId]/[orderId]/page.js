"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import Footer from "@/footer/Footer";
import ProfileSidebar from "@/app/HomeComponents/ProfileSidebar";
import Header from "@/header/Header";
import OrderCancel from "@/app/MyOrders/OrderCancel";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useDispatch } from "react-redux";
import { setOrderDetails } from "@/store/serviceSlices/commonSlice";
import { t } from "i18next";
import moment from "moment/moment";
import toast from "react-hot-toast";
import i18n from "@/i18n/i18n";
import Link from "next/link";

const OrderDetails = () => {
  const isRTL = i18n.dir() === "rtl";
  const { productId, orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelOrder, setCancelOrder] = useState(false);
  const dispatch = useDispatch();

  const [userCountry, setUserCountry] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userCountry") || "United States";
    }
    return "United States";
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

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "userCountry") {
        setUserCountry(e.newValue || "United States");
      }
    };

    const handleCurrencyChange = () => {
      const newCountry = localStorage.getItem("userCountry") || "United States";
      setUserCountry(newCountry);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("currencyChanged", handleCurrencyChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("currencyChanged", handleCurrencyChange);
    };
  }, []);

  const getOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: `/products/getOrderDetails`,
        data: {
          orderId,
          productId,
        },
      });
      setOrder(response?.results?.order || null);
    } catch (error) {
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReturn = async () => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this return request?",
    );
    if (!confirmCancel) return;

    try {
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: `/products/cancelReturnRequest`,
        data: {
          orderId,
          productId,
        },
      });

      if (response?.error_code === 200) {
        toast.success("Return request cancelled successfully");
        await getOrderDetails();
      } else {
        toast.error("Failed to cancel return request");
      }
    } catch (error) {
      console.error("Cancel return error:", error);
      toast.error("An error occurred while canceling the return request");
    }
  };

  useEffect(() => {
    if (orderId && productId) {
      getOrderDetails();
    }
  }, [orderId, productId]);

  const language =
    typeof window !== "undefined"
      ? localStorage.getItem("i18nextLng") || "en"
      : "en";

  useEffect(() => {
    const seoTitle =
      language === "ar"
        ? `تفاصيل الطلب | ملخص كامل – بيانكا نيرا`
        : `Order Details | Full Summary – Bianca Nera`;
    document.title = seoTitle;
  }, [language]);

  if (loading || !order) {
    return (
      <>
        <Header />
        <div className="container py-5">
          <Skeleton height={40} width={200} className="mb-4" />
          <Skeleton height={200} className="mb-4" />
          <Skeleton count={6} height={30} className="mb-2" />
        </div>
        <Footer />
      </>
    );
  }

  const {
    products,
    tracking,
    address,
    amount,
    discount,
    paidAmount,
    couponDiscount,
    transaction,
  } = order;

  return (
    <>
      <Header />
      <div className="myprofilepage py-lg-5 py-md-4 py-4">
        <div className="container">
          <div className="row">
            <ProfileSidebar />
            {cancelOrder ? (
              <OrderCancel order={order} />
            ) : (
              <div className="col-auto profilerightcol">
                <div className="profilerightpart ordersbg">
                  <div className="row mb-md-4 mb-3 align-items-center">
                    <div className="col">
                      <div className="profileheadings">
                        <h2>{t("order_details.order_details")} </h2>
                      </div>
                    </div>
                  </div>

                  <div className="orderboxmain">
                    <div className="orderboxbotom mb-3">
                      <div className="orderdetailsmain d-flex gap-2">
                        <div
                          className="orderimgg"
                          style={{
                            height: "100px",
                            width: "100px",
                            borderRadius: "10px",
                          }}
                        >
                          <img
                            src={
                              products?.variantId?.images?.[0]?.url ||
                              products?.productId?.images?.[0]?.url ||
                              "/assets/img/product1.jpg"
                            }
                            alt={products?.productId?.name_en}
                          />
                        </div>
                        <div className="orderdetailsright ms-3">
                          <span>
                            {isRTL
                              ? products?.productId?.brandId?.name_ar
                              : products?.productId?.brandId?.name_en}
                          </span>
                          <div className="productnaam">
                            {isRTL
                              ? products?.productId?.name_ar
                              : products?.productId?.name_en}
                          </div>
                          <div className="productnaam">{order?.orderId}</div>

                          <div className="pricecart">
                            {getCurrencySymbol(userCountry)}{" "}
                            {products?.price.toFixed(2)}
                          </div>
                          <div className="d-flex align-items-center">
                            {products?.variantId?.combination?.map(
                              (comb, idx) => (
                                <div key={idx} className="btmdetails me-2">
                                  {isRTL
                                    ? comb.attributeId?.name_ar
                                    : comb.attributeId?.name_en}
                                  :{" "}
                                  {isRTL
                                    ? comb.valueId?.name_ar
                                    : comb.valueId?.name_en}
                                </div>
                              ),
                            )}
                            <div className="btmdetails">|</div>
                            <div className="btmdetails">
                              {t("Quantity")}: {products?.quantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="samedesignborder mb-3">
                      {tracking?.map((step, idx) => {
                        return (
                          <div
                            key={idx}
                            className={`trackorderbox ${step.date ? "active" : ""}`}
                          >
                            <div className="orderstatus">{t(step.message)}</div>
                            <div className="ordertiming">
                              {step.date
                                ? new Date(step.date).toLocaleString()
                                : t("order_details.pending")}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="cancelorderbtns mt-3">
                      {order?.status !== "Delivered" &&
                        order?.status !== "Returned" &&
                        order?.status !== "Return Requested" &&
                        order?.status !== "Return Pickup" &&
                        order?.status !== "Refunded" &&
                        order?.products?.isCancelled == false && (
                          <div className="cancelorderbtns mb-3">
                            <button
                              className="cancelorderbtns mt-3 border-0 bg-transparent"
                              onClick={() => {
                                setCancelOrder(true);
                                dispatch(setOrderDetails(order));
                              }}
                            >
                              <img
                                src="/assets/img/cancelorder.png"
                                alt={t("order_details.cancel_alt")}
                              />{" "}
                              {t("order_details.cancel_order")}
                            </button>
                          </div>
                        )}
                    </div>
                    <div>
                      {order?.status == "Delivered" &&
                        order?.products?.isReturned == false && (
                          <div className="cancelorderbtns mb-3">
                            <Link
                              href={{
                                pathname: "/OrderReturn",
                                query: {
                                  orderId: orderId,
                                  productId: productId,
                                },
                              }}
                            >
                              <img
                                className="me-2"
                                src="/assets/img/return.png"
                                alt=""
                              />{" "}
                              {t("Return Order")}
                            </Link>
                          </div>
                        )}
                      {order?.products?.isReturned == true &&
                        order?.products?.returnStatus == "Pending" && (
                          <div className="cancelorderbtns mb-3">
                            <button
                              className="border-0 bg-transparent"
                              style={{ cursor: "pointer" }}
                              onClick={handleCancelReturn}
                            >
                              <img
                                className="me-2"
                                src="/assets/img/return.png"
                                alt=""
                              />{" "}
                              Cancel Return
                            </button>
                          </div>
                        )}
                    </div>

                    {order?.products?.isCancelled && (
                      <div className="couponhead mb-2">
                        {order?.products?.cancelStatus == "Pending"
                          ? t("order_details.cancellation_request_pending")
                          : order?.products?.cancelStatus == "Rejected"
                            ? t("order_details.cancellation_rejected")
                            : t("order_details.cancellation_approved")}
                      </div>
                    )}

                    {order?.products?.isReturned && (
                      <div
                        style={{
                          marginInline: 15,
                          borderRadius: 12,
                        }}
                      >
                        <p style={{ fontSize: "16px", fontWeight: "500" }}>
                          {order?.products?.returnStatus === "Pending"
                            ? t("order_details.return_request_pending")
                            : order?.products?.returnStatus === "Rejected"
                              ? t("order_details.return_rejected")
                              : t("order_details.return_approved")}
                        </p>

                        {order?.products?.rejectReason && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              marginTop: 6,
                            }}
                          >
                            <p style={{ margin: 0 }}>
                              {order?.products?.rejectReason}
                            </p>
                          </div>
                        )}

                        {order?.products?.returnStatus === "Rejected" && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              marginTop: 10,
                            }}
                          >
                            <p
                              style={{
                                fontFamily: "GothamBook, sans-serif",
                                margin: 0,
                              }}
                            >
                              {t("order_details.contact_support")}
                            </p>
                            <button
                              style={{
                                background: "none",
                                border: "none",
                                color: "green",
                                cursor: "pointer",
                                fontFamily: "GothamBook, sans-serif",
                                marginInline: 4,
                              }}
                            >
                              {t("order_details.whatsapp")}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="samedesignborder mb-3 mt-3">
                      <div className="ordersummary">
                        <div className="couponhead mb-2">
                          {t("order_details.delivery_address")}
                        </div>
                        <div className="deliverto">
                          {address?.name}{" "}
                          <span>
                            {address?.countryCode} {address?.phoneNumber}
                          </span>
                        </div>
                        <div className="delivertoaddress mt-1">
                          {address?.address}, {address?.city},{" "}
                          {address?.zipCode}
                        </div>
                      </div>
                    </div>

                    <div className="samedesignborder mb-3">
                      <div className="ordersummary">
                        <div className="couponhead mb-2">
                          {t("order_details.price_details")}
                        </div>
                        <div className="ordersummryinner">
                          <div className="ordersummrytxt">
                            <strong>{t("order_details.subtotal")}</strong>
                            <span>
                              {" "}
                              {getCurrencySymbol(userCountry)}{" "}
                              {amount.toFixed(2)}
                            </span>
                          </div>
                          <div className="ordersummrytxt">
                            <strong>{t("order_details.discount")}</strong>
                            <span>
                              - {getCurrencySymbol(userCountry)}{" "}
                              {discount.toFixed(2)}
                            </span>
                          </div>
                          {couponDiscount > 0 && (
                            <div className="ordersummrytxt">
                              <strong>
                                {t("order_details.coupon_discount")}
                              </strong>
                              <span>
                                - {getCurrencySymbol(userCountry)}{" "}
                                {couponDiscount.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ordersummrytotal">
                          <strong>{t("order_details.grand_total")}</strong>
                          <strong>
                            {" "}
                            {getCurrencySymbol(userCountry)}{" "}
                            {paidAmount.toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="samedesignborder mb-3">
                      <div className="ordersummary">
                        <div className="couponhead mb-2">
                          {t("order_details.payment")}
                        </div>
                        <div className="paymenthod">
                          {t("order_details.transaction_id")}:{" "}
                          {order?.transactionId}
                        </div>
                        <div className="paymenthod">
                          {t("order_details.paid_amount")}:{" "}
                          {getCurrencySymbol(userCountry)}{" "}
                          {transaction?.amount.toFixed(2)}
                        </div>
                        {order?.chashbackId && (
                          <div className="paymenthod">
                            {t("order_details.cash_back")}:{" "}
                            {getCurrencySymbol(userCountry)}{" "}
                            {order?.chashbackId?.amount.toFixed(2)}
                          </div>
                        )}
                        <div className="paymenthod">
                          {t("Wallet Amount Use")}:{" "}
                          {getCurrencySymbol(userCountry)}{" "}
                          {order?.walletAmount.toFixed(2)}
                        </div>
                        <div className="paymenthod">
                          {t("order_details.date")}:{" "}
                          {moment(transaction?.createdAt).format("MMM Do YYYY")}
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
      <Footer />
    </>
  );
};

export default OrderDetails;
