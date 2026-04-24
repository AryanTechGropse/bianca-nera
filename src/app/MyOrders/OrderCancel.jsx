"use client";
import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import toast from "react-hot-toast";
import { t } from "i18next";

const OrderCancel = ({ order, onCancelSuccess, onBack }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [selectedReason, setSelectedReason] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);

    if (files.length + uploadedFiles.length > 5) {
      toast.error(t("You can only upload up to 5 images"));
      return;
    }

    const newFiles = [];
    const newPreviews = [];

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(t("File size should be less than 5MB"));
          return;
        }

        newFiles.push(file);

        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push({
            url: e.target.result,
            name: file.name,
            size: file.size,
          });
          if (newPreviews.length === files.length) {
            setImagePreviews((prev) => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        toast.error(t("Please select only image files"));
      }
    });

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    event.target.value = "";
  };

  // Remove image
  const removeImage = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Convert to base64
  const convertFilesToBase64 = async (files) => {
    const base64Promises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            base64: e.target.result,
            name: file.name,
            type: file.type,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    return await Promise.all(base64Promises);
  };

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

  const removeOrder = async (e) => {
    e.preventDefault();

    if (!selectedReason) {
      toast.error(t("Please select a cancellation reason."));
      return;
    }

    try {
      setLoading(true);

      let base64Images = [];
      if (uploadedFiles.length > 0) {
        base64Images = await convertFilesToBase64(uploadedFiles);
      }

      const requestData = {
        orderId: order?._id,
        productId: order?.products?._id,
        reason: selectedReason,
        comment: comment,
      };

      if (base64Images.length > 0) {
        requestData.images = base64Images;
      }

      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "products/cancelOrder",
        data: requestData,
      });

      if (!response?.error) {
        toast.success(t("Order cancelled successfully!"));

        // Show modal using bootstrap data API
        if (typeof window !== "undefined") {
          const modalElement = document.getElementById("RequestSent");
          if (modalElement && window.bootstrap) {
            const modal = new window.bootstrap.Modal(modalElement);
            modal.show();
          }
        }
      } else {
        toast.error(response?.message || t("Failed to cancel order"));
      }
    } catch (error) {
      console.error("Cancel order error:", error);
      toast.error(t("Error cancelling order. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return <p>{t("Loading order details...")}</p>;
  }

  const product = order?.products;
  const variant = product?.variantId;
  const productImage = variant?.images?.[0]?.url || "/assets/img/no-image.png";
  const productName = product?.productId?.name_en || t("Unknown Product");
  const brandName = product?.productId?.brandId?.name_en || "";
  const price = product?.price || 0;
  const qty = product?.quantity || 1;

  const sizeAttr = variant?.combination?.find(
    (c) => c.attributeId?.name_en === "Size",
  );
  const colorAttr = variant?.combination?.find(
    (c) => c.attributeId?.name_en === "Colour",
  );

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      <div className="col-auto profilerightcol">
        <div className="profilerightpart ordersbg">
          <div className="row mb-md-4 mb-3 align-items-center">
            <div className="col">
              <div className="profileheadings">
                <h2>{t("Cancel Order")}</h2>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12 mb-3">
              <div className="orderboxmain">
                <div className="orderboxbotom mb-3">
                  <div className="orderdetailsmain d-flex">
                    <div className="orderimgg">
                      <img src={productImage} alt={t(productName)} />
                    </div>
                    <div className="orderdetailsright">
                      <span>{t(brandName)}</span>
                      <div className="productnaam">{t(productName)}</div>
                      <div className="pricecart">
                        {getCurrencySymbol(userCountry)} {price.toFixed(2)}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {sizeAttr && (
                          <div className="btmdetails">
                            {t("Size")}: {t(sizeAttr?.valueId?.name_en)}
                          </div>
                        )}
                        {colorAttr && (
                          <div className="btmdetails">
                            | {t("Colour")}: {t(colorAttr?.valueId?.name_en)}
                          </div>
                        )}
                        <div className="btmdetails">| {t("Qty")}: {qty}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="samedesignborder mb-3">
                  <div className="cancilationhead">
                    <h3>{t("Reason for cancellation")}</h3>
                    <p>
                      {t(
                        "Please select the correct reason for cancellation. Your feedback helps us improve our service.",
                      )}
                    </p>
                  </div>
                  <form className="authform row" onSubmit={removeOrder}>
                    <div className="col-md-12 form-group mb-3">
                      <label className="labelinput mb-3">
                        {t("Select Reason")}
                      </label>

                      {[
                        t("Found a better price elsewhere"),
                        t("Delivery is taking too long"),
                        t("Placed a duplicate order"),
                        t("Changed my mind about the purchase"),
                        t("Incorrect item ordered"),
                        t("Product not needed anymore"),
                      ].map((reason, idx) => (
                        <div className="radiobtns payementradio mb-3" key={idx}>
                          <input
                            type="radio"
                            className="d-none"
                            id={`reason${idx + 1}`}
                            name="cancel_reason"
                            value={reason}
                            checked={selectedReason === reason}
                            onChange={(e) => setSelectedReason(e.target.value)}
                          />
                          <label htmlFor={`reason${idx + 1}`}>{reason}</label>
                        </div>
                      ))}

                      <textarea
                        name="comments"
                        className="form-control px-3 py-3"
                        style={{ height: 150 }}
                        placeholder={t("Additional Comments")}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />

                      {order?.products?.isCancelled ? (
                        <div className="col-md-12 form-group mb-4 mt-4">
                          <label
                            className="labelinput mb-3"
                            htmlFor="uploadfile"
                          >
                            {t("Upload Images")} ({t("Optional")})
                          </label>
                          <p className="text-muted small mb-3">
                            {t(
                              "You can upload up to 5 images. Maximum file size: 5MB each",
                            )}
                          </p>

                          <div className="uploadboxmain mb-3">
                            <input
                              type="file"
                              className="d-none"
                              id="uploadfile"
                              multiple
                              accept="image/*"
                              onChange={handleFileSelect}
                              disabled={uploadedFiles.length >= 5}
                            />
                            <label
                              htmlFor="uploadfile"
                              style={{
                                cursor:
                                  uploadedFiles.length >= 5
                                    ? "not-allowed"
                                    : "pointer",
                              }}
                            >
                              <div className="text-center">
                                <img
                                  src="/assets/img/upload1.png"
                                  alt={t("Upload")}
                                />
                                <span>{t("Upload Your Images")}</span>
                                <small className="d-block text-muted">
                                  ({uploadedFiles.length}/5 {t("images")})
                                </small>
                              </div>
                            </label>
                          </div>

                          {imagePreviews.length > 0 && (
                            <div className="image-previews-container">
                              <h6 className="mb-3">
                                {t("Selected Images")} ({imagePreviews.length})
                              </h6>
                              <div className="row">
                                {imagePreviews.map((preview, index) => (
                                  <div
                                    key={index}
                                    className="col-6 col-md-4 col-lg-3 mb-3"
                                  >
                                    <div className="image-preview-card position-relative">
                                      <img
                                        src={preview.url}
                                        alt={`Preview ${index + 1}`}
                                        className="img-fluid rounded border"
                                        style={{
                                          height: "120px",
                                          width: "100%",
                                          objectFit: "cover",
                                        }}
                                      />
                                      <button
                                        type="button"
                                        className="btn btn-danger btn-sm position-absolute top-0 end-0"
                                        onClick={() => removeImage(index)}
                                        style={{
                                          transform: "translate(30%, -30%)",
                                          borderRadius: "50%",
                                          width: "24px",
                                          height: "24px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          padding: 0,
                                        }}
                                      >
                                        ×
                                      </button>
                                      <div className="image-info small text-muted mt-1">
                                        <div
                                          className="text-truncate"
                                          title={preview.name}
                                        >
                                          {preview.name}
                                        </div>
                                        <div>{formatFileSize(preview.size)}</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div className="col-md-12 form-group">
                      <button
                        type="submit"
                        className="authbtns2"
                        disabled={loading || !selectedReason}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            {t("Processing...")}
                          </>
                        ) : (
                          t("REQUEST CANCELLATION")
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade commanmodal"
        id="RequestSent"
        tabIndex={-1}
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body position-relative">
              <div className="row">
                <div className="col-md-12">
                  <div className="commanmodaltop">
                    <img
                      src="/assets/img/RequestSent.png"
                      alt={t("Request Sent")}
                    />
                    <h2>{t("Request Sent!")}</h2>
                    <p>
                      {t(
                        "We've received your cancellation request. You'll be notified once the process is completed.",
                      )}
                    </p>
                  </div>
                </div>
                <div className="col-md-12 mt-4">
                  <div className="row">
                    <div className="col-md-12">
                      <button
                        type="button"
                        className="authbtns1"
                        data-bs-dismiss="modal"
                        onClick={() => {
                          if (onCancelSuccess) {
                            onCancelSuccess();
                          } else {
                            router.back();
                          }
                        }}
                      >
                        {t("OKAY")}
                      </button>
                    </div>
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

export default OrderCancel;
