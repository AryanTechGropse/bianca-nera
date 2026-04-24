"use client";
import React from "react";
import Link from "next/link";
import Products from "../Products/Products";
import { t } from "i18next";

const TrendingProduct = ({ products, loading }) => {
  const isMobile = window.innerWidth <= 768;
  const productList = products?.products || products || [];
  const displayedProducts = productList.slice(0, 4);

  const getColorValue = (colorName) => {
    if (!colorName) return "#ccc";

    const colorMap = {
      black: "#000000",
      red: "#ff0000",
      blue: "#0000ff",
      green: "#008000",
      white: "#ffffff",
      yellow: "#ffff00",
      purple: "#800080",
      pink: "#ffc0cb",
      orange: "#ffa500",
      gray: "#808080",
      brown: "#a52a2a",
    };

    return colorMap[colorName.toLowerCase()] || "#ccc";
  };

  return (
    <div className="bestsellingproduct padding pt-4">
      <div className="container">
        <div className="row">
          <div className="col-md-12 mb-4">
            <div className="row align-items-center">
              <div className="col">
                <div className="commanhead">{t("Trending Products")}</div>
              </div>
              <div className="col-auto" dir="ltr">
                <Link
                  href="/Product/All/Trending-Products"
                  className="seeallbtn"
                >
                  {t("See all")}{" "}
                  <img src="assets/img/seeall.png" alt="See all products" />
                </Link>
              </div>
            </div>
          </div>
          <div className="col-md-12">
            <div className="row">
              <div className="col-lg-12">
                <div className="row flex-nowrap overflow-auto">
                  {loading ? (
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
                    <div
                      className={`col-12 py-3 ${isMobile ? "slider-card" : "horizontal-scroll-card"}`}
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

export default TrendingProduct;
