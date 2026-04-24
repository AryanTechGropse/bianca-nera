"use client";
import React, { useEffect, useState } from "react";
import Products from "../Products/Products";
import { callMiddleWare } from "../../httpServices/webHttpServices";
import Link from "next/link";
import { t } from "i18next";

const NewArrivals = ({ products, loading, path }) => {
  const [showAll, setShowAll] = useState(false);
  const isMobile = window.innerWidth <= 768;

  // Show first 6 products initially, all if expanded
  const displayedProducts = showAll ? products : products?.slice(0, 4) || [];

  return (
    <>
      <div className="newrrivals padding pt-0">
        <div className="container">
          <div className="row">
            <div className="col-md-12 mb-4">
              <div className="row">
                <div className="col">
                  <div className="commanhead">{t("New Arrivals")}</div>
                </div>
                <div className="col-auto" dir="ltr">
                  <Link
                    href="/Product/All/New-Arrival"
                    className="seeallbtn"
                  >
                    {t("See all")} <img src="assets/img/seeall.png" alt="See all" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-12">
              <div className="row productrow flex-nowrap overflow-auto">
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
                          style={{ height: "350px", marginBottom: "15px" }}
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
                    className={`col-12 py-3 ${isMobile ? "w-100 overflow-hidden" : "horizontal-scroll-card"} `}
                  >
                    <Products
                      products={displayedProducts}
                      loading={loading}
                      isMobile={isMobile}
                      classType={"col-medium"}
                    />
                  </div>
                )}
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
      </div>
      <style>
        {`
        .newarrivals-slider .slick-slide > div {
            display: contents;
          }
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
    </>
  );
};

export default NewArrivals;
