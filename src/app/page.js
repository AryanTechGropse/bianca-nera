"use client";
import useHomeStore from "@/store/homeStore";
import AIRecommendation from "./home/AIRecommendation";
import BannerCategory from "./home/BannerCategory";
import BestSellingProduct from "./home/BestSellingProduct";
import HomeService from "./home/HomeService";
import NewArrivals from "./home/NewArrivals";
import PromotionalBanner from "./home/PromotionalBanner";
import TopBrand from "./home/TopBrand";
import TopDesigner from "./home/TopDesigner";
import TrendingProduct from "./home/TrendingProduct";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Banners from "./home/Banners";
import { t } from "i18next";
// import Head from "next/head";
import ProductDetail from "./home/ProductDetail";
import Footer from "@/footer/Footer";
import Header from "@/header/Header";

/* ── Skeleton building-blocks ── */
const SkeletonCard = () => (
  <div className="col-6 col-sm-4 col-md-3 col-lg-3 px-2 mb-3">
    <div className="product-skeleton">
      <div
        className="skeleton-img"
        style={{ height: "350px", marginBottom: "12px" }}
      />
      <div
        className="skeleton-line"
        style={{ width: "60%", height: "14px", marginBottom: "8px" }}
      />
      <div
        className="skeleton-line"
        style={{ width: "40%", height: "14px", marginBottom: "8px" }}
      />
      <div
        className="skeleton-line"
        style={{ width: "50%", height: "18px", marginBottom: "10px" }}
      />
      <div
        className="skeleton-line"
        style={{ width: "100%", height: "36px" }}
      />
    </div>
  </div>
);

const SectionSkeleton = ({ count = 4, title }) => (
  <div className="padding pt-4">
    <div className="container">
      <div className="row">
        <div className="col-md-12 mb-4">
          <div className="row align-items-center">
            <div className="col">
              {title ? (
                <div className="commanhead">{title}</div>
              ) : (
                <div
                  className="skeleton-line"
                  style={{ width: "180px", height: "24px" }}
                />
              )}
            </div>
            <div className="col-auto">
              <div
                className="skeleton-line"
                style={{ width: "60px", height: "18px" }}
              />
            </div>
          </div>
        </div>
        <div className="col-md-12">
          <div className="row flex-nowrap overflow-hidden">
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const BannerSkeleton = () => (
  <div className="bannersection pt-4">
    <div className="container">
      <div
        className="skeleton-img"
        style={{ height: "450px", borderRadius: "12px" }}
      />
    </div>
  </div>
);

const CategorySkeleton = () => (
  <div className="bannercategory padding">
    <div className="container">
      <div className="row">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="col-lg-4 col-md-6 mb-4">
            <div
              className="skeleton-img"
              style={{ height: "180px", borderRadius: "8px" }}
            />
            <div
              className="skeleton-line mx-auto mt-2"
              style={{ width: "100px", height: "18px" }}
            />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ProductDetailSkeleton = () => (
  <div className="productdetailspage pt-lg-4 pb-lg-5">
    <div className="container">
      <div className="row">
        <div className="col-md-6">
          <div
            className="skeleton-img"
            style={{ height: "500px", borderRadius: "8px" }}
          />
          <div className="d-flex mt-3 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="skeleton-img"
                style={{ width: "80px", height: "80px", borderRadius: "4px" }}
              />
            ))}
          </div>
        </div>
        <div className="col-md-6">
          <div
            className="skeleton-line mb-2"
            style={{ width: "120px", height: "16px" }}
          />
          <div
            className="skeleton-line mb-2"
            style={{ width: "250px", height: "28px" }}
          />
          <div
            className="skeleton-line mb-3"
            style={{ width: "100px", height: "24px" }}
          />
          <div className="d-flex gap-2 mb-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton-img"
                style={{ width: "35px", height: "35px", borderRadius: "50%" }}
              />
            ))}
          </div>
          <div className="d-flex gap-2 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="skeleton-img"
                style={{ width: "50px", height: "36px", borderRadius: "4px" }}
              />
            ))}
          </div>
          <div
            className="skeleton-line mb-3"
            style={{ width: "100%", height: "48px", borderRadius: "4px" }}
          />
          <div className="d-flex gap-3">
            <div
              className="skeleton-line"
              style={{ flex: 1, height: "48px", borderRadius: "4px" }}
            />
            <div
              className="skeleton-line"
              style={{ flex: 1, height: "48px", borderRadius: "4px" }}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Lazy loading fallback
const LazyLoader = () => (
  <div
    className="d-flex justify-content-center align-items-center"
    style={{ minHeight: "200px" }}
  >
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

export default function Home() {
  const {
    category,
    products,
    recommendedData,
    bestSellingData,
    fashionData,
    bannerData,
    brandData,
    trendingProduct,
    loading,
    error,
    criticalDataLoaded,
    secondaryDataLoaded,
    remainingDataLoaded,
    fetchHomeData,
    refreshHomeData,
    isFetching,
  } = useHomeStore();

  /* ── per-section loading flags ── */
  const bannerLoading = !criticalDataLoaded;
  const categoryLoading = !criticalDataLoaded;
  const newArrivalsLoading = !secondaryDataLoaded;
  const bestSellingLoading = !secondaryDataLoaded;
  const trendingLoading = !secondaryDataLoaded;
  const aiRecommendationLoading = !remainingDataLoaded;
  const topDesignerLoading = !remainingDataLoaded;
  const topBrandLoading = !remainingDataLoaded;

  useEffect(() => {
    if (!criticalDataLoaded && !loading && !isFetching) {
      fetchHomeData();
    }
  }, [criticalDataLoaded, loading, isFetching, fetchHomeData]);

  /* ── retry handler ── */
  const handleRetry = useCallback(() => {
    refreshHomeData();
  }, [refreshHomeData]);

  /* ── visibility flags (hide section entirely when loaded but empty) ── */
  const showBanners = useMemo(
    () => bannerLoading || bannerData?.length > 0,
    [bannerLoading, bannerData],
  );
  const showCategory = useMemo(
    () => categoryLoading || category.length > 0,
    [categoryLoading, category],
  );
  const showNewArrivals = useMemo(
    () => newArrivalsLoading || products.length > 0,
    [newArrivalsLoading, products],
  );
  const showBestSelling = useMemo(
    () => bestSellingLoading || bestSellingData.length > 0,
    [bestSellingLoading, bestSellingData],
  );
  const showTrending = useMemo(
    () => trendingLoading || trendingProduct.length > 0,
    [trendingLoading, trendingProduct],
  );
  const showAIRecommendation = useMemo(
    () => aiRecommendationLoading || recommendedData.length > 0,
    [aiRecommendationLoading, recommendedData],
  );
  const showTopDesigner = useMemo(
    () => topDesignerLoading || fashionData.length > 0,
    [topDesignerLoading, fashionData],
  );
  const showTBrand = useMemo(
    () => topDesignerLoading || brandData.length > 0,
    [topDesignerLoading, brandData],
  );

  /* ── fatal error before anything loaded ── */
  if (error && !criticalDataLoaded) {
    return (
      <>
        <Header />
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h2>{t("Something went wrong")} </h2>
          <p>{error}</p>
          <button className="btn btn-dark mt-3" onClick={handleRetry}>
            {t("Try Again")}
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const lang = localStorage.getItem("i18nextLng") || "en";
    setLanguage(lang);
  }, []);

  const title =
    language === "ar"
      ? `بيانكا نيرا | فساتين مصممين فاخرة وفساتين سهرة وكاجوال أونلاين`
      : `Bianca Nera | Luxury Designer Dresses, Evening & Casual Dresses Online`;

  const description =
    language === "ar"
      ? `تقدم بيانكا نيرا فساتين سهرة فاخرة وفساتين كاجوال وملابس جاهزة من مصممين عالميين مع شحن عالمي.`
      : `Bianca Nera offers luxury designer evening dresses, casual dresses and ready-to-wear fashion with worldwide delivery.`;

  return (
    <div className="homepage-container">

      <Header />
      <Banners bannerData={bannerData || []} loading={bannerLoading} />
      {console.log("bannerDatabannerDatabannerDatabannerData", bannerData)}
      <PromotionalBanner
        bannerData={bannerData || []}
        loading={bannerLoading}
      />

      {showCategory &&
        (categoryLoading ? (
          <CategorySkeleton />
        ) : (
          <BannerCategory category={category} />
        ))}

      {showNewArrivals &&
        (newArrivalsLoading ? (
          <SectionSkeleton title={t("New Arrivals")} />
        ) : (
          <NewArrivals products={products} loading={false} />
        ))}

      {showTBrand &&
        (topBrandLoading ? (
          <SectionSkeleton title={t("Top Brand")} count={5} />
        ) : (
          <Suspense
            fallback={<SectionSkeleton title={t("Top Brand")} count={5} />}
          >
            <TopBrand fashionData={brandData} loading={false} />
          </Suspense>
        ))}

      {showBestSelling &&
        (bestSellingLoading ? (
          <SectionSkeleton title={t("Best Selling Products")} />
        ) : (
          <BestSellingProduct products={bestSellingData} loading={false} />
        ))}

      {secondaryDataLoaded ? <ProductDetail /> : <ProductDetailSkeleton />}

      {showTrending &&
        (trendingLoading ? (
          <SectionSkeleton title={t("Trending Products")} />
        ) : (
          <TrendingProduct products={trendingProduct} loading={false} />
        ))}

      {showAIRecommendation &&
        (aiRecommendationLoading ? (
          <SectionSkeleton title={t("AI Recommendation")} />
        ) : (
          <Suspense
            fallback={<SectionSkeleton title={t("AI Recommendation")} />}
          >
            <AIRecommendation products={recommendedData} loading={false} />
          </Suspense>
        ))}

      {/* ── Top Designer ── */}
      {showTopDesigner &&
        (topDesignerLoading ? (
          <SectionSkeleton title={t("Top Designer")} count={5} />
        ) : (
          <Suspense
            fallback={<SectionSkeleton title={t("Top Designer")} count={5} />}
          >
            <TopDesigner fashionData={fashionData} loading={false} />
          </Suspense>
        ))}

      <Suspense fallback={<LazyLoader />}>
        <HomeService />
      </Suspense>

      {/* <Suspense fallback={null}>
        <ChatBot />
      </Suspense> */}

      <Footer />

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
}
