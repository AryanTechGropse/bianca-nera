"use client";
import React, { useCallback, useEffect, useState } from "react";
import Footer from "@/footer/Footer";
import ProfileSidebar from "@/app/HomeComponents/ProfileSidebar";
import Header from "@/header/Header";
import { t } from "i18next";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import { useSelector } from "react-redux";
import Pagination from "@/Common/Pagination";

const MyLoyaltyPoints = () => {
  const { userId } = useSelector((state) => ({
    userId: state?.commonSlice?.profile?._id,
  }));
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const getWalletTransactions = async () => {
    try {
      setLoading(true);
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "user/getWalletTransactions",
        data: {
          page: currentPage,
          pageSize: pageSize,
          userId,
        },
      });
      setWalletData(response?.results || null);
      if (response?.results?.total) {
        setTotalPages(response?.results?.totalPages);
      }
    } catch (error) {
      console.log(error?.message);
      setWalletData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }) +
      " | " +
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
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

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "userCountry") {
        setUserCountry(e.newValue || "United States");
      }
    };

    const handleCurrencyChange = () => {
      const newCountry = localStorage.getItem("userCountry") || "United States";
      setUserCountry(newCountry);
      if (userId) {
        getWalletTransactions();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("currencyChanged", handleCurrencyChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("currencyChanged", handleCurrencyChange);
    };
  }, [userId, currentPage]);

  useEffect(() => {
    if (userId) {
      getWalletTransactions();
    }
  }, [userId, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const language =
    typeof window !== "undefined"
      ? localStorage.getItem("i18nextLng") || "en"
      : "en";

  useEffect(() => {
    const seoTitle =
      language === "ar"
        ? `نقاط الولاء | اكسبي مكافآت مع كل عملية شراء – BN`
        : `Loyalty Points | Earn Rewards Every Purchase – BN`;
    document.title = seoTitle;
  }, [language]);

  const SkeletonLoader = () => (
    <>
      <div className="profilerightpart mb-3">
        <div className="row mb-md-4 mb-3 align-items-center">
          <div className="col">
            <div className="profileheadings">
              <div
                className="skeleton-text"
                style={{ width: "200px", height: "32px" }}
              ></div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12 mb-4">
            <div className="myloyaltypoints">
              <div className="pointstop mb-3 d-md-flex align-items-center">
                <div className="pointsicons mb-md-0 mb-3">
                  <div
                    className="skeleton-circle"
                    style={{ width: "60px", height: "60px" }}
                  ></div>
                </div>
                <div className="pointsdetails">
                  <div
                    className="skeleton-text mb-2"
                    style={{ width: "150px", height: "20px" }}
                  ></div>
                  <div
                    className="skeleton-text"
                    style={{ width: "100px", height: "28px" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="profilerightpart">
        <div className="row">
          <div className="col-md-12">
            <div className="row">
              <div className="col-md-12 mb-3">
                <div
                  className="skeleton-text"
                  style={{ width: "120px", height: "24px" }}
                ></div>
              </div>
              <div className="col-md-12">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="row pointshistory align-items-center mb-3"
                  >
                    <div className="col">
                      <div className="pointshistoryleft">
                        <div className="historyicon">
                          <div
                            className="skeleton-circle"
                            style={{ width: "40px", height: "40px" }}
                          ></div>
                        </div>
                        <div className="pointshistorycontent ms-2">
                          <div
                            className="skeleton-text mb-1"
                            style={{ width: "100px", height: "20px" }}
                          ></div>
                          <div
                            className="skeleton-text"
                            style={{ width: "180px", height: "16px" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="col-auto text-end">
                      <div
                        className="skeleton-text mb-1"
                        style={{ width: "80px", height: "20px" }}
                      ></div>
                      <div
                        className="skeleton-text"
                        style={{ width: "60px", height: "16px" }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Header />
      <div className="myprofilepage py-lg-5 py-md-4 py-4">
        <div className="container">
          <div className="row">
            <ProfileSidebar />
            <div className="col-auto profilerightcol">
              {loading ? (
                <SkeletonLoader />
              ) : (
                <>
                  <div className="profilerightpart mb-3">
                    <div className="row mb-md-4 mb-3 align-items-center">
                      <div className="col">
                        <div className="profileheadings">
                          <h2>{t("My Wallet")}</h2>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-12 mb-4">
                        <div className="myloyaltypoints">
                          <div className="pointstop mb-3 d-md-flex align-items-center">
                            <div className="pointsicons mb-md-0 mb-3">
                              <img
                                src="/assets/img/coin.png"
                                alt="walleticon"
                                style={{ width: "42px", height: "42px" }}
                              />
                            </div>
                            <div className="pointsdetails px-2">
                              <h2>{t("Available Balance")}</h2>
                              <span className="px-2">
                                {getCurrencySymbol(userCountry)}{" "}
                                {walletData?.wallet?.amount?.toFixed(2) ||
                                  "0.00"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="profilerightpart">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="row">
                          <div className="col-md-12 mb-3">
                            <div className="loyaltyhead">
                              {t("Transaction History")}
                            </div>
                          </div>
                          <div className="col-md-12">
                            {walletData?.transactions?.length > 0 ? (
                              walletData.transactions.map(
                                (transaction, index) => (
                                  <div
                                    key={transaction._id}
                                    className="row pointshistory align-items-center mb-3"
                                  >
                                    <div className="col">
                                      <div className="pointshistoryleft">
                                        <div
                                          className="historyicon"
                                          style={{ marginLeft: "10px" }}
                                        >
                                          <img
                                            src="/assets/img/walletIcon.png"
                                            alt="Transaction"
                                            style={{
                                              width: "24px",
                                              height: "24px",
                                            }}
                                          />
                                        </div>
                                        <div className="pointshistorycontent ms-2">
                                          <h3
                                            className={
                                              transaction.type === "Credited"
                                                ? "text-success"
                                                : "text-danger"
                                            }
                                          >
                                            {transaction.orderId
                                              ? `- #${transaction.orderId.orderId}`
                                              : ""}
                                          </h3>
                                          <div className="text-center">
                                            <p
                                              className="pb-0 mb-0 pointhistorydate"
                                              style={{ color: "black" }}
                                            >
                                              {(() => {
                                                const amount = `${getCurrencySymbol(userCountry)} ${transaction.amount?.toFixed(2)}`;

                                                const messageKey =
                                                  transaction.type ===
                                                  "Credited"
                                                    ? transaction?.sentFrom ===
                                                      "Admin"
                                                      ? "wallet.creditedByAdmin"
                                                      : "wallet.creditedByUser"
                                                    : transaction?.sentFrom ===
                                                        "Admin"
                                                      ? "wallet.debitedByAdmin"
                                                      : "wallet.debitedByUser";

                                                return t(messageKey, {
                                                  amount,
                                                });
                                              })()}
                                            </p>
                                          </div>
                                          <div className="pointhistorydate">
                                            {formatDate(transaction.createdAt)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-auto text-end">
                                      <div
                                        className={`priceee ${transaction.type === "Credited" ? "text-success" : "text-danger"}`}
                                      >
                                        {transaction.type === "Credited"
                                          ? "+"
                                          : "-"}{" "}
                                        {getCurrencySymbol(userCountry)}{" "}
                                        {transaction.amount?.toFixed(2)}
                                      </div>
                                      <div className="totalpointsss">
                                        {t(transaction.type)}
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )
                            ) : (
                              <div className="text-center py-4">
                                <p>{t("No transactions found")}</p>
                              </div>
                            )}
                          </div>

                          {walletData?.transactions?.length > 0 && (
                            <div className="col-md-12">
                              <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                showPageNumbers={true}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <style jsx>{`
        .skeleton-text {
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 4px;
        }

        .skeleton-circle {
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 50%;
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .text-success {
          color: #28a745 !important;
        }

        .text-danger {
          color: #dc3545 !important;
        }
      `}</style>
    </>
  );
};

export default MyLoyaltyPoints;
