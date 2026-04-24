"use client";
import React, { useState } from "react";
import Link from "next/link";
import Products from "../Products/Products";
import { t } from "i18next";

const BestSellingProduct = ({ products, loading }) => {
  const [showAll, setShowAll] = useState(false);
  const isMobile = window.innerWidth <= 768;

  // Show first 6 products initially, all if expanded
  const displayedProducts = showAll
    ? products || []
    : products?.slice(0, 4) || [];

  return (
    <div className="bestsellingproduct padding pt-4">
      <div className="container">
        <div className="row">
          <div className="col-md-12 mb-4">
            <div className="row align-items-center">
              <div className="col">
                <div className="commanhead">{t("Best Selling Products")}</div>
              </div>
              <div className="col-auto" dir="ltr">
                <Link
                  href="/Product/All/Best-Selling-Products"
                  className="seeallbtn"
                >
                  {t("See all")}{" "}
                  <img
                    src="assets/img/seeall.png"
                    style={{ direction: "ltr" }}
                    alt="See all"
                  />
                </Link>
              </div>
            </div>
          </div>
          <div className="col-md-12">
            <div className="row">
              <div className="col-lg-12">
                <div className="row flex-nowrap overflow-auto">
                  {loading ? (
                    // Skeleton loader for 4 products
                    [...Array(4)].map((_, index) => (
                      <div
                        key={index}
                        className="col-lg-3 col-md-4 col-sm-6 mb-4"
                      >
                        <div className="product-skeleton">
                          <div
                            className="skeleton-img"
                            style={{ height: "400px", marginBottom: "15px" }}
                          ></div>
                          <div
                            className="skeleton-line"
                            style={{
                              width: "70%",
                              height: "16px",
                              marginBottom: "10px",
                            }}
                          ></div>
                          <div
                            className="skeleton-line"
                            style={{
                              width: "50%",
                              height: "20px",
                              marginBottom: "10px",
                            }}
                          ></div>
                          <div
                            className="skeleton-line"
                            style={{ width: "40%", height: "16px" }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // <Products products={displayedProducts} loading={loading} classType={"col-large"}/>
                    <div
                      className={`col-12 py-3 slider-card ${isMobile ? "w-100 overflow-hidden" : "horizontal-scroll-card"} `}
                    >
                      <Products
                        isMobile={isMobile}
                        products={displayedProducts}
                        loading={loading}
                        classType={"col-medium"}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Show More Button */}
          {products && products.length > 6 && (
            <div className="col-md-12 text-center mt-4">
              <button
                className="btn btn-outline-primary"
                onClick={() => setShowAll(!showAll)}
                style={{
                  padding: "10px 30px",
                  borderRadius: "25px",
                  fontWeight: "500",
                }}
              >
                {showAll
                  ? t("Show Less")
                  : `${t("Show More")} (${products.length - 6} ${t("more items")})`}
              </button>
            </div>
          )}
        </div>
      </div>
      <style>
        {`
          .product-skeleton {
            background: #fff;
            border-radius: 8px;
            padding: 10px;
          }
          .skeleton-img,
          .skeleton-line {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
          }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </div>
  );
};

export default BestSellingProduct;
