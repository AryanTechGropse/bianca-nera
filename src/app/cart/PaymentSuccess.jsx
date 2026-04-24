import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { t } from "i18next";
import { persistor } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import {
  getCounts,
  getProfile,
  setAppliedCoupon,
} from "@/store/serviceSlices/commonSlice";

const PaymentSuccess = ({ payment }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isUserLoggedIn } = useSelector((state) => ({
    isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
  }));

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  const type = searchParams.get("type");
  const paymentId = searchParams.get("paymentId");
  const lang = searchParams.get("lang");
  const Id = searchParams.get("Id");

  console.log(searchParams);
  console.log(type);
  console.log(paymentId);
  console.log(lang);
  console.log(Id);

  const handleViewOrders = () => {
    // Clear coupon regardless of login status
    dispatch(setAppliedCoupon(null));

    if (!isUserLoggedIn) {
      // Clear all storage
      persistor.purge();
      localStorage.clear();
      sessionStorage.clear();

      // Force hard reload to payment page
      window.location.href = "/MyOrders";
    } else {
      // Navigate and then reload
      router.push("/MyOrders");

      // Small delay to ensure navigation completes
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  // const handleProceed = () => {

  // };
  if (type === "web") {
    return (
      <div className="paymentstatus padding">
        {console.log("PAYMENT SUCCESS IF CONDITION")}
        <div className="container py-md-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="paymentstatusmain text-center">
                {!payment?.order?.orderId ? (
                  <div className="text-muted mt-5 pt-5">
                    <div className="spinner-border me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <h3 className="mt-3">
                      {lang === "English" ? "Loading..." : "جارٍ التحميل..."}
                    </h3>
                  </div>
                ) : (
                  <>
                    <img
                      src="/assets/img/paymentdone.png"
                      alt={t("Order Confirmed")}
                    />
                    <h2>{t("Order Confirmed")}</h2>
                    <p>
                      {t(
                        "Your order has been successfully confirmed! Our team is preparing it for dispatch. You can track your order anytime from your dashboard.",
                      )}
                    </p>

                    {payment?.order?.orderId && (
                      <div className="text-muted small mt-2">
                        <strong>{t("Order ID")}:</strong>{" "}
                        {payment?.order?.orderId}
                      </div>
                    )}

                    {payment?.order?.orderId && (
                      <div className="row mt-4 justify-content-center">
                        <div className="col-md-auto">
                          <Link
                            href="/MyOrders"
                            onClick={() => {
                              if (!isUserLoggedIn) {
                                persistor.purge();
                                localStorage.clear();
                                sessionStorage.clear();
                                dispatch(setAppliedCoupon(null));
                                window.location.href = `/MyOrders`;
                              } else {
                                dispatch(setAppliedCoupon(null));
                                window.location.href = `/MyOrders`;
                              }
                            }}
                            className="authbtns1 px-5 w-auto successButton"
                          >
                            {t("View Orders")}
                          </Link>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (type === "") {
    return (
      <div className="paymentstatus padding">
        {console.log("PAYMENT SUCCESS ELSE IS CONDITION")}

        <div className="container py-md-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="paymentstatusmain text-center">
                <img
                  src="/assets/img/paymentdone.png"
                  alt={lang !== "Arabic" ? "Payment Success" : "نجاح الدفع"}
                />
                <h2>{lang !== "Arabic" ? "Payment Success" : "نجاح الدفع"}</h2>
                <p>
                  {lang !== "Arabic"
                    ? "Your payment has been successfully confirmed, and our team is now preparing it for timely processing and delivery."
                    : "تم تأكيد دفعتك بنجاح، وفريقنا الآن يقوم بإعدادها للمعالجة والتسليم في الوقت المناسب."}
                </p>

                {paymentId && (
                  <div className="text-muted small mt-2">
                    <strong>
                      {lang !== "Arabic" ? "Payment ID" : "رقم الدفع"}:
                    </strong>{" "}
                    {paymentId}
                  </div>
                )}

                <div className="d-flex justify-content-center mt-4">
                  <button className="authbtns1 px-5 successButton">
                    {lang !== "Arabic" ? "Proceed Now" : "المتابعة الآن"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="paymentstatus padding">
        {console.log("PAYMENT SUCCESS ELSE CONDITION")}
        <div className="container py-md-5">
          <div className="row justify-content-center">
            <div className="col-md-12">
              <div className="d-flex justify-content-center flex-column align-items-center">
                <div className="paymentstatusmain text-center"></div>
                <div className="text-muted text-center mt-5 pt-5">
                  <div className="spinner-border me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h3 className="mt-3">
                    {lang !== "Arabic" ? "Loading..." : "جارٍ التحميل..."}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default PaymentSuccess;
