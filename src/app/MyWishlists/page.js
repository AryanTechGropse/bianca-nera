"use client";
import React, { useCallback, useEffect, useState } from "react";
import Header from "@/header/Header";
import Footer from "@/footer/Footer";
import { useDispatch, useSelector } from "react-redux";
import { wishListCart } from "@/store/serviceSlices/commonSlice";
import { useInView } from "react-intersection-observer";
import Products from "@/app/Products/Products";
import Link from "next/link";
import { t } from "i18next";
import Chatbot from "@/app/HomeComponents/ChatBot";
// import Head from "next/head";
const MyWishlist = () => {
  const [page, setPage] = useState(1);

  const dispatch = useDispatch();
  const [totalPages, setTotalPages] = useState(null);
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 50;
  const { ref, inView } = useInView({ threshold: 0.2 });
  const { wishState, isLoading, isUserLoggedIn } = useSelector((state) => ({
    wishState: state?.commonSlice?.wishState,
    isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
  }));

  console.log(isUserLoggedIn);
  console.log(wishState?.wishList?.length);
  const getRecommendedProducts = useCallback(async () => {
    if (loading || (totalPages !== null && page > totalPages)) return;

    setLoading(true);
    try {
      const payload = { page, pageSize: PAGE_SIZE };
      dispatch(
        wishListCart({
          payload,
        }),
      );
    } catch (error) {
      console.error("Error fetching recommended products:", error.message);
    } finally {
      setLoading(false);
    }
  }, [loading, page, totalPages]);

  // Initial fetch
  useEffect(() => {
    getRecommendedProducts();
  }, []);

  // Fetch next page on scroll
  useEffect(() => {
    if (inView && !loading && (totalPages === null || page < totalPages)) {
      setPage((prev) => prev + 1);
    }
  }, [inView]);

  // Fetch whenever page changes (except initial load)
  useEffect(() => {
    if (page > 1) {
      getRecommendedProducts();
    }
  }, [page]);

  const language = localStorage.getItem("i18nextLng") || "en";

  const seoTitle =
    language === "ar"
      ? `قائمة أمنياتي | احفظي أزياءك المفضلة – بيانكا نيرا`
      : `My Wishlist | Save Dream Styles – Bianca Nera`;

  const seoDescription =
    language === "ar"
      ? `احفظي قطعك الفاخرة المفضلة في قائمة أمنياتك في بيانكا نيرا. لا تفوتي فستان مصمم مذهل – عودي في أي وقت وتسوقي إطلالاتك المثالية.`
      : `Save your favourite luxury pieces to your Bianca Nera wishlist. Never miss a stunning designer dress – come back anytime and shop your dream looks.`;

  return (
    <>
      <Header />

      {wishState?.wishList?.length > 0 ? (
        <div className="mywishlist padding pt-md-4 pt-0">
          <div className="container">
            <div className="row">
              <div className="col-md-12 mb-4">
                <div className="row align-items-center productpagetop">
                  <div className="col-md-12">
                    <div className="productpagehead d-flex align-items-center">
                      <h2>{t("My Wishlist")}</h2>{" "}
                      <span>
                        {wishState?.wishList?.length} {t("items")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-12 px-md-0 mb-4">
                <div className="row productrow">
                  <Products
                    products={wishState?.wishList}
                    loading={loading}
                    classType={"col-medium"}
                    cardDetails={true}
                    isWishList={true}
                  />
                </div>
              </div>
              {/* <div className="col-md-12 text-center">
          <a className="authbtns2 px-5 w-auto d-inline-flex" href="#">EXPLORE MORE</a>
        </div> */}
            </div>
          </div>
        </div>
      ) : (
        <div className="authpages padding">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-4 px-5">
                <div className="loginbox">
                  <img src="assets/img/login.png" alt="login" />
                  <h2>{t("No Wishlist Yet")}</h2>
                  <p>{t("wishlist.startAdding")}</p>
                  <Link className="authbtns1" href="/">
                    {t("SHOP NOW")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Chatbot />
      <Footer />
    </>
  );
};

export default MyWishlist;
