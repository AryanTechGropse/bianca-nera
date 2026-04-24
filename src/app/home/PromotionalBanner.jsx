"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import i18next, { t } from "i18next";

export default function PromotionalBanner({ bannerData, loading }) {
  const router = useRouter();

  // Filter promotional banners
  const promotionalBanners = bannerData?.filter(
    (banner) => banner?.isPromotional === true && banner?.status === true,
  );

  const showPromoModal = () => {
    if (!promotionalBanners || promotionalBanners.length === 0) return;

    // For simplicity, show the first promotional banner
    const banner = promotionalBanners[0];
    const hasProductId = !!banner?.productId;

    Swal.fire({
      html: `
            <div style="text-align: center; padding: 0;">
              <div style=" border-radius: 15px 15px 0 0;">
              
              </div>

              <img src="${banner.image}" 
                   alt="${i18next.language == "en-US" ? banner?.name_en : banner?.name_ar || "Promotional Banner"}" 
                   style="width: 100%; height: auto; border-radius: 12px; margin: 20px auto; box-shadow: 0 8px 20px rgba(0,0,0,0.15); display: block;">
            </div>
            `,
      width: "650px",
      showCancelButton: hasProductId, // Only show cancel button if there's a productId
      showConfirmButton: hasProductId, // Only show confirm button if there's a productId
      confirmButtonText: "🛍️ Shop Now",
      cancelButtonText: "Maybe Later",
      showCloseButton: true,
      allowOutsideClick: true,
      customClass: {
        popup: "promo-popup",
        confirmButton: "swal-confirm-btn",
        cancelButton: "swal-cancel-btn",
      },
      didOpen: () => {
        const style = document.createElement("style");
        style.textContent = `
                    .swal2-popup { border-radius: 20px !important; padding: 0 !important; }
                    .swal2-html-container { margin: 0 !important; padding: 20px !important; }
                    .swal-confirm-btn {
                        background: #000000ff;
                        border-radius: 50px !important; padding: 12px 40px !important;
                        font-size: 16px !important; font-weight: 600 !important;
                        box-shadow: 0 4px 15px rgba(255,107,107,0.4) !important; border: none !important;
                    }
                    .swal-cancel-btn {
                        background: #6c757d !important; border-radius: 50px !important;
                        padding: 12px 30px !important; font-size: 16px !important; font-weight: 600 !important;
                        border: none !important;
                    }
                `;
        document.head.appendChild(style);
      },
    }).then((result) => {
      if (result.isConfirmed && banner?.productId) {
        Swal.fire({
          icon: "success",
          title: "Redirecting to Store...",
          text: "Get ready for amazing deals!",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push(`/Product/${banner.productId}`);      }
    });
  };

  useEffect(() => {
    // Check if this is a new session using sessionStorage
    const isNewSession = sessionStorage.getItem("sessionActive");
    if (!isNewSession) {
      sessionStorage.setItem("sessionActive", "true");
    }

    if (isNewSession && promotionalBanners && promotionalBanners.length > 0) {
      // Mark session as active
      sessionStorage.setItem("sessionActive", "true");

      // Show modal after a short delay
      const timer = setTimeout(() => {
        showPromoModal();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [bannerData]);

  return <></>;
}
