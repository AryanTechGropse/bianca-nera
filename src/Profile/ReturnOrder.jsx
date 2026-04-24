import React, { useState } from "react";

import Header from "@/header/Header";
import Footer from "@/footer/Footer";
import ProfileSidebar from "@/app/HomeComponents/ProfileSidebar";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";

const ReturnOrder = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const productId = searchParams.get("productId");
  // order data should ideally be fetched or passed via a different mechanism if it was in location.state
  const [order, setOrder] = useState(null);

  const [selectedReason, setSelectedReason] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const reasons = [
    t("return.poor_quality"),
    t("return.wrong_color"),
    t("return.mismatch_description"),
    t("return.duplicate_item"),
    t("return.changed_mind"),
    t("return.wrong_size"),
  ];

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      toast.error(t("return.max_images_error"));
      return;
    }
    setImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedReason) {
      toast.error(t("return.select_reason_error"));
      return;
    }

    if (!comment.trim()) {
      toast.error(t("return.comments_error"));
      return;
    }

    if (images.length === 0) {
      toast.error(t("return.images_error"));
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("productId", productId);
      formData.append("reason", selectedReason);
      formData.append("comment", comment);

      images.forEach((image, index) => {
        formData.append("images", image);
      });

      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: `/products/returnOrder`,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response?.error_code === 200) {
        toast.success(t("return.success_message"));
        router.push("/MyOrders");
      } else {
        toast.error(t("return.failed_message"));
      }
    } catch (error) {
      console.error("Return order error:", error);
      toast.error(t("return.error_message"));
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get currency symbol
  const getCurrencySymbol = (country) => {
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
  };

  const userCountry = localStorage.getItem("country") || "United States";

  if (!order) {
    return (
      <>
        <Header />
        <div className="myprofilepage py-lg-5 py-md-4 py-4">
          <div className="container">
            <div className="text-center">
              <h3>{t("return.order_not_found")}</h3>
              <p>{t("return.go_back_orders")}</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const { products } = order;

  const language = localStorage.getItem("i18nextLng") || "en";

  const seoTitle =
    language === "ar"
      ? `إرجاع الطلب | عملية بسيطة من 3 خطوات – بيانكا نيرا`
      : `Return Order | Simple 3-Step Process – Bianca Nera`;

  const seoDescription =
    language === "ar"
      ? `ابدئي عملية إرجاع سهلة في 3 خطوات فقط مع بيانكا نيرا. عملية إرجاع سلسة تضمن تجربة أزياء فاخرة إيجابية في كل مرة.`
      : `Initiate a hassle-free return in just 3 easy steps with Bianca Nera. Our smooth returns process ensures a positive luxury fashion experience every time.`;

  return (
    <>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <Header />

      <div className="myprofilepage py-lg-5 py-md-4 py-4">
        <div className="container">
          <div className="row">
            <ProfileSidebar />
            <div className="col-auto profilerightcol">
              <div className="profilerightpart ordersbg">
                <div className="row mb-4 align-items-center">
                  <div className="col">
                    <div className="profileheadings">
                      <h2>{t("return.return_order")}</h2>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <div className="orderboxmain">
                      <div className="orderboxbotom mb-3">
                        <div className="orderdetailsmain">
                          <div className="orderimgg">
                            <img
                              src={
                                products?.variantId?.images?.[0]?.url ||
                                "assets/img/product1.jpg"
                              }
                              alt={products?.productId?.name_en}
                            />
                          </div>
                          <div className="orderdetailsright ms-3">
                            <span>{products?.productId?.brandId?.name_en}</span>
                            <div className="productnaam">
                              {products?.productId?.name_en}
                            </div>
                            <div className="pricecart">
                              {getCurrencySymbol(userCountry)}{" "}
                              {products?.variantId?.totalPrice}
                            </div>
                            <div className="d-flex align-items-center">
                              {products?.variantId?.combination?.map(
                                (comb, idx) => (
                                  <div key={idx} className="btmdetails me-2">
                                    {comb.attributeId?.name_en}:{" "}
                                    {comb.valueId?.name_en}
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
                        <div className="cancilationhead">
                          <h3>{t("return.reason_for_return")}</h3>
                          <p>{t("return.reason_description")}</p>
                        </div>
                        <form className="authform row" onSubmit={handleSubmit}>
                          <div className="col-md-12 form-group mb-3">
                            <label className="labelinput mb-3">
                              {t("return.select_reason")}
                            </label>
                            {reasons.map((reason, index) => (
                              <div
                                key={index}
                                className="radiobtns payementradio mb-3"
                              >
                                <input
                                  type="radio"
                                  className="d-none"
                                  id={`reason${index + 1}`}
                                  name="cancel_reason"
                                  value={reason}
                                  checked={selectedReason === reason}
                                  onChange={(e) =>
                                    setSelectedReason(e.target.value)
                                  }
                                />
                                <label htmlFor={`reason${index + 1}`}>
                                  {reason}
                                </label>
                              </div>
                            ))}
                            <textarea
                              name="comments"
                              className="form-control px-3 py-3"
                              style={{ height: 150 }}
                              placeholder={t("return.additional_comments")}
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                            />
                          </div>
                          <div className="col-md-12 form-group mb-4">
                            <label className="labelinput">
                              {t("return.upload_image")}
                            </label>
                            <div className="uploadboxmain">
                              <input
                                type="file"
                                className="d-none"
                                id="uploadfile"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                              />
                              <label htmlFor="uploadfile">
                                <div className="text-center">
                                  <img
                                    src="assets/img/upload1.png"
                                    alt={t("return.upload")}
                                  />
                                  <span>{t("return.upload_your_image")}</span>
                                </div>
                              </label>
                            </div>
                            {images.length > 0 && (
                              <div className="mt-3">
                                <p>
                                  {t("return.selected_images", {
                                    count: images.length,
                                    max: 5,
                                  })}
                                </p>
                                <div className="d-flex flex-wrap">
                                  {images.map((image, index) => (
                                    <div
                                      key={index}
                                      className="position-relative me-2 mb-2"
                                    >
                                      <img
                                        src={URL.createObjectURL(image)}
                                        alt={t("return.uploaded_image", {
                                          number: index + 1,
                                        })}
                                        style={{
                                          width: "80px",
                                          height: "80px",
                                          objectFit: "cover",
                                        }}
                                      />
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-danger position-absolute"
                                        style={{ top: 0, right: 0 }}
                                        onClick={() => removeImage(index)}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="col-md-12 form-group">
                            <button
                              type="submit"
                              className="authbtns2"
                              disabled={loading}
                            >
                              {loading ? t("common.submitting") : t("Continue")}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ReturnOrder;
