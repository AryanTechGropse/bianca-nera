"use client";
import React, { useState } from "react";
import useHomeStore from "@/store/homeStore";
import { t } from "i18next";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { formatDescription } from "@/common/commonUtils";
import Header from "@/header/Header";
import Chatbot from "@/app/HomeComponents/ChatBot";
import Footer from "@/footer/Footer";
// import Head from "next/head";

const CategorysPage = () => {
  const { t, i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(i18n.language === "ar");
  const category = useHomeStore((state) => state.category);
  const [currentLanguage, setCurrentLanguage] = useState(
    i18n.language || "en-US",
  );

  if (!category || !Array.isArray(category)) {
    return <p>{t("products.noCategories")}</p>;
  }

  const language = localStorage.getItem("i18nextLng") || "en";

  const title =
    language === "ar"
      ? `جميع فئات الأزياء | 5 علامات تجارية – بيانكا نيرا`
      : `All Fashion Categories | 5 Brands – Bianca Nera`;

  const description =
    language === "ar"
      ? `استكشفي جميع فئات الأزياء الفاخرة في بيانكا نيرا – فساتين سهرة وفساتين زفاف وفساتين كاجوال وإكسسوارات. وجهتك المثالية لأزياء المصممين.`
      : `Explore all luxury categories at Bianca Nera – evening gowns, bridal wear, casual dresses & accessories. Your ultimate designer fashion destination.`;

  return (
    <>
      <style>
        {styles}
        {i18n.language === "ar" ? getRTLStyles() : ""}
      </style>
      <Header />
      <div className="comman-height mt-5">
        <div className="container">
          <div
            className={`row menuproductflex justify-content-lg-center ${isRTL ? "rtl-grid" : ""}`}
          >
            {category.map((cat) => (
              <div key={cat.id} className="col-12 col-md-3 mb-4">
                <Link
                  href={`/category/${cat._id}`}
                  className="searchproduct"
                  //   onClick={() => setShowMenu(false)}
                >
                  <div className="searchproductimgg">
                    <img
                      src={cat.image || "/assets/img/placeholder.jpg"}
                      alt={currentLanguage === "ar" ? cat.name_ar : cat.name_en}
                    />
                  </div>
                  <div className="searchproductname text-center">
                    {formatDescription(
                      currentLanguage === "ar" ? cat.name_ar : cat.name_en,
                      3,
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Chatbot />
      <Footer />
    </>
  );
};

// Extract styles to avoid recreation on every render
const styles = `
  /* Skeleton loader */
  .skeleton-loader {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Mobile filter overlay */
  .mobile-filter-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: flex-end;
  }
  
  .mobile-filter-content {
    background: #fff;
    width: 100%;
    max-height: 85%;
    overflow-y: auto;
    border-radius: 20px 20px 0 0;
    padding: 20px;
    animation: slideUp 0.3s ease-out;
  }
  
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
`;

// RTL styles added dynamically if needed
const getRTLStyles = () => `
  .text-end {
    text-align: left !important;
  }
  
  .sortby {
    direction: ltr;
  }
  
  .filter-toggle-icon {
    margin-left: 0;
    margin-right: auto;
  }
  
  .custom-checkbox input {
    margin-right: 0;
    margin-left: 8px;
  }
`;

export default CategorysPage;
