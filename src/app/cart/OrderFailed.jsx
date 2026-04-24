import React from "react";
import { useRouter } from "next/navigation";
import { t } from "i18next";
import { Helmet } from "react-helmet";

const OrderFailed = () => {
  const router = useRouter();

  const handleGoToCart = () => {
    router.push("/Cart");
  };

  const language = localStorage.getItem("i18nextLng") || "en";

  const seoTitle =
    language === "ar"
      ? `فشل الدفع | أصلحيه فوراً – بيانكا نيرا`
      : `Payment Failed | Fix It Instantly – Bianca Nera`;

  const seoDescription =
    language === "ar"
      ? `لا تقلقي – طلبك من بيانكا نيرا لا يزال محفوظاً. حاولي مرة أخرى أو اختاري من بين 5+ طرق دفع آمنة لإتمام عملية الشراء اليوم.`
      : `Don't worry – your Bianca Nera order is still saved. Try again or choose from 5+ secure payment methods to complete your luxury fashion purchase today.`;

  return (
    <>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <div className="payemntstatus padding">
        <div className="container py-md-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="payemntstatusmain text-center">
                <img
                  src="/assets/img/paymentfailed.png"
                  alt={t("Payment Failed")}
                />
                <h2 className="mt-3">{t("Payment Failed")}</h2>
                <p className="mt-2">
                  {t(
                    "Payment failed! Unfortunately, we were unable to process your transaction. Please check your payment details or try another payment method.",
                  )}
                </p>

                <div className="row mt-4 justify-content-center">
                  <div className="col-auto mb-md-0 mb-2">
                    <button
                      className="authbtns2 px-5 w-auto failureButton"
                      onClick={handleGoToCart}
                    >
                      {t("RETRY PAYMENT")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderFailed;
