"use client";
import React, { useState, useEffect, useCallback } from "react";
import ProfileSidebar from "@/app/HomeComponents/ProfileSidebar";
import Header from "@/header/Header";
import Footer from "@/footer/Footer";
import { useDispatch, useSelector } from "react-redux";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import Link from "next/link";
import OrderCancel from "./OrderCancel";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import { getCounts, getProfile } from "@/store/serviceSlices/commonSlice";
import Pagination from "@/Common/Pagination";

const MyOrders = () => {
  const isRTL = i18n.dir() === "rtl";
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [appState, setAppState] = useState({
    orders: [],
    loading: true,
    error: null,
    cancelOrder: false,
    selectedOrderForCancel: null,
    searchItem: "",
    searchEmail: "",
    searchOrderId: "",
    isSearching: false,
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    itemsPerPage: 5,
    hasSearched: false,
  });

  const { isUserLoggedIn } = useSelector((state) => ({
    isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
  }));

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
    dispatch(getProfile());
    dispatch(getCounts());
  }, [dispatch]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "userCountry") {
        setUserCountry(e.newValue || "United States");
      }
    };

    const handleCurrencyChange = () => {
      const newCountry = localStorage.getItem("userCountry") || "United States";
      setUserCountry(newCountry);
      getOrders(1);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("currencyChanged", handleCurrencyChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("currencyChanged", handleCurrencyChange);
    };
  }, []);

  const updateState = (updates) => {
    setAppState((prev) => ({ ...prev, ...updates }));
  };

  const normalizeProducts = (order) => {
    if (!order.products) return [];
    if (Array.isArray(order.products)) return order.products;
    if (typeof order.products === "object" && order.products !== null) {
      if (order.products.productId && order.products.variantId) {
        return [order.products];
      }
      return Object.values(order.products).filter(
        (item) => item && item.productId && item.variantId,
      );
    }
    return [];
  };

  const formatDate = (dateString) => {
    if (!dateString) return t("common.n_a");
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getOrderStatusInfo = (order) => {
    const products = normalizeProducts(order);

    const hasCancelledProduct = products.some(
      (product) => product?.isCancelled && product?.cancelStatus === "Approved",
    );

    const hasReturnedProduct = products.some(
      (product) => product?.isReturned && product?.returnStatus === "Approved",
    );

    const hasPendingCancellation = products.some(
      (product) => product?.isCancelled && product?.cancelStatus === "Pending",
    );

    const isDelivered =
      order?.status === "Delivered" || order?.status === "Completed";
    const isProcessing =
      order?.status === "Active" || order?.status === "Processing";

    if (hasCancelledProduct) {
      return {
        status: order?.statusMessage,
        class: "order_2",
        icon: "cancelled.png",
        text: `${t("orders.on")} ${formatDate(order.updatedAt)}`,
      };
    } else if (hasReturnedProduct) {
      return {
        status: order?.statusMessage,
        class: "order_2",
        icon: "outoudelivery.png",
        text: `${t("orders.on")} ${formatDate(order.updatedAt)}`,
      };
    } else if (hasPendingCancellation) {
      return {
        status: order?.statusMessage,
        class: "order_3",
        icon: "outoudelivery.png",
        text: t("orders.waitingForApproval"),
      };
    } else if (isDelivered) {
      return {
        status: order?.statusMessage,
        class: "order_1",
        icon: "outoudelivery.png",
        text: `${t("orders.on")} ${formatDate(order.updatedAt)}`,
      };
    } else if (isProcessing) {
      const tracking = order.tracking || [];
      const currentStatus = tracking.find((t) => t.date) || tracking[0];

      if (currentStatus?.status === "Picked") {
        return {
          status: order?.statusMessage,
          class: "order_1",
          icon: "outoudelivery.png",
          text: t("orders.assignedToDelivery"),
        };
      } else {
        return {
          status: order?.statusMessage || t("orders.processing"),
          class: "order_1",
          icon: "outoudelivery.png",
          text: `${t("orders.orderPlacedOn")} ${formatDate(order.createdAt)}`,
        };
      }
    } else {
      return {
        status: order?.statusMessage || order?.status || t("orders.processing"),
        class: "order_1",
        icon: "outoudelivery.png",
        text: `${t("orders.orderPlacedOn")} ${formatDate(order.createdAt)}`,
      };
    }
  };

  const getProductImage = (product) => {
    const variantImages = product?.variantId?.images;
    if (Array.isArray(variantImages) && variantImages.length > 0) {
      return variantImages[0]?.url || "/assets/img/product1.jpg";
    }
    const productImages = product?.productId?.images;
    if (Array.isArray(productImages) && productImages.length > 0) {
      return productImages[0]?.url || "/assets/img/product1.jpg";
    }
    return "/assets/img/product1.jpg";
  };

  const getProductAttributes = (product) => {
    const combination = product?.variantId?.combination;
    if (!Array.isArray(combination)) return {};

    const attributes = {};
    combination.forEach((comb) => {
      const attributeName =
        comb.attributeId?.name_en?.toLowerCase() || "attribute";
      attributes[attributeName] = comb.valueId?.name_en || t("common.n_a");
    });

    return attributes;
  };

  const getTotalQuantity = (order) => {
    const products = normalizeProducts(order);
    return products.reduce(
      (total, product) => total + (product.quantity || 0),
      0,
    );
  };

  const getOrders = async (page = 1) => {
    try {
      updateState({ loading: true, error: null });

      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "products/getOrderHistory",
        data: {
          page,
          pageSize: appState.itemsPerPage,
          ...(appState.searchItem && { serch: appState.searchItem }),
          ...(appState.searchEmail && { email: appState.searchEmail }),
          ...(appState.searchOrderId && { orderId: appState.searchOrderId }),
        },
      });

      if (response?.results?.orders) {
        const totalOrders =
          response.results.total || response.results.orders.length;
        const totalPages =
          response.results.totalPages ||
          Math.ceil(totalOrders / appState.itemsPerPage);

        updateState({
          orders: response.results.orders,
          totalOrders,
          totalPages,
          currentPage: page,
        });
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      updateState({ error: t("orders.errors.failedToLoad") });
    } finally {
      updateState({ loading: false });
    }
  };

  const handleCancelOrder = (order) => {
    updateState({ selectedOrderForCancel: order, cancelOrder: true });
  };

  const handleBackToOrders = () => {
    updateState({ cancelOrder: false, selectedOrderForCancel: null });
  };

  const handleOrderCancelled = () => {
    getOrders(appState.currentPage);
    updateState({ cancelOrder: false, selectedOrderForCancel: null });
  };

  const searchOrders = async () => {
    if (!appState.searchEmail || !appState.searchOrderId) {
      updateState({ error: t("orders.errors.searchRequired") });
      return;
    }

    try {
      updateState({
        isSearching: true,
        error: null,
        currentPage: 1,
        hasSearched: true,
      });
      await getOrders(1);
    } catch (error) {
      updateState({ error: t("orders.errors.searchFailed") });
    } finally {
      updateState({ isSearching: false });
    }
  };

  const resetSearch = () => {
    updateState({
      searchEmail: "",
      searchOrderId: "",
      searchItem: "",
      error: null,
      currentPage: 1,
      hasSearched: false,
      orders: [],
      totalOrders: 0,
      totalPages: 1,
    });
    if (isUserLoggedIn) {
      getOrders(1);
    }
  };

  const handlePageChange = (page) => {
    if (
      page >= 1 &&
      page <= appState.totalPages &&
      page !== appState.currentPage
    ) {
      updateState({ currentPage: page });
      getOrders(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (isUserLoggedIn) {
      getOrders(1);
    }
  }, [isUserLoggedIn]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (appState.searchItem) {
        searchOrders();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [appState.searchItem]);

  useEffect(() => {
    if (
      appState.hasSearched &&
      appState.searchEmail === "" &&
      appState.searchOrderId === ""
    ) {
      resetSearch();
    }
  }, [appState.searchEmail, appState.searchOrderId, appState.hasSearched]);

  const OrderItem = ({ order }) => {
    const statusInfo = getOrderStatusInfo(order);
    const products = normalizeProducts(order);
    const firstProduct = products[0];
    const productAttributes = getProductAttributes(firstProduct);
    const totalItems = getTotalQuantity(order);
    const orderId = order?._id;

    const canCancelOrder =
      ![
        "Cancelled",
        "Return Requested",
        "Returned",
        "Refunded",
        "Delivered",
      ].includes(statusInfo.status) &&
      !products.some((p) => p?.isCancelled && p?.cancelStatus === "Approved") &&
      !products.some((p) => p?.isCancelled && p?.cancelStatus === "Pending") &&
      !(order?.status === "Delivered" || order?.status === "Completed");

    return (
      <div className="col-md-12 mb-4">
        <div className="orderboxmain">
          <div className="orderboxtop mb-3 px-2">
            <div className="ordetboxtopimg">
              <img
                src={`/assets/img/${statusInfo.icon}`}
                alt={statusInfo.statusMessage}
                loading="lazy"
              />
            </div>
            <div
              className={`orderupdate  ${statusInfo.class}`}
              style={{ marginRight: "10px" }}
            >
              <h2>{t(statusInfo.status)}</h2>
              <span>{statusInfo.text}</span>
              <div className="order-id mt-1">
                <small className="text-muted">
                  {t("orders.orderId")}: {order.orderId}
                </small>
              </div>
              {!isUserLoggedIn && order.email && (
                <div className="customer-email mt-1">
                  <small className="text-muted">
                    {t("orders.customer")}: {order.email}
                  </small>
                </div>
              )}
            </div>
          </div>

          <div className="orderboxbotom">
            {firstProduct && (
              <Link
                href={`/OrderDetails/${firstProduct._id}/${orderId}`}
                className="orderdetailsmain text-decoration-none"
              >
                <div className="orderimgg">
                  <img
                    src={getProductImage(firstProduct)}
                    alt={firstProduct?.productId?.name_en}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "/assets/img/product1.jpg";
                    }}
                  />
                </div>
                <div className="orderdetailsright" style={{ margin: "10px" }}>
                  <span className="brand-name">
                    {isRTL
                      ? firstProduct?.productId?.brandId?.name_ar
                      : firstProduct?.productId?.brandId?.name_en ||
                        t("orders.brand")}
                  </span>
                  <div className="productnaam">
                    {isRTL
                      ? firstProduct?.productId?.name_ar
                      : firstProduct?.productId?.name_en ||
                        t("orders.productName")}
                  </div>
                  <div className="pricecart">
                    {getCurrencySymbol(userCountry)}{" "}
                    {order.products.totalPrice.toFixed(2)}
                  </div>
                  <div className="d-flex align-items-center">
                    {productAttributes.size && (
                      <>
                        <div className="btmdetails">
                          {t("orders.size")}: {productAttributes.size}
                        </div>
                        <div className="btmdetails mx-2">|</div>
                      </>
                    )}
                    {productAttributes.colour && (
                      <>
                        <div className="btmdetails">
                          {t("orders.color")}: {productAttributes.colour}
                        </div>
                        <div className="btmdetails mx-2">|</div>
                      </>
                    )}
                    <div className="btmdetails">
                      {t("orders.quantity")}: {totalItems}
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {canCancelOrder && (
              <div className="mt-3">
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleCancelOrder(order)}
                >
                  {t("orders.cancelOrder")}
                </button>
              </div>
            )}

            {products.some(
              (product) =>
                product?.isCancelled && product?.cancelStatus === "Pending",
            ) && (
              <div className="cancellation-status mt-2">
                <small className="text-warning">
                  {t("orders.cancellationPending")}
                </small>
              </div>
            )}

            {products.some(
              (product) =>
                product?.isCancelled && product?.cancelStatus === "Approved",
            ) && (
              <div className="cancellation-status mt-2">
                <small className="text-success">
                  {t("orders.orderCancelled")}
                </small>
              </div>
            )}
          </div>

          {products.length > 1 && (
            <div className="additional-products mt-3 p-3 bg-light rounded">
              <p className="mb-2 fw-bold">
                + {products.length - 1} {t("orders.moreItems")}
              </p>
              {products.slice(1).map((product, index) => (
                <div key={index} className="d-flex align-items-center mb-2">
                  <div
                    className="me-3"
                    style={{ width: "50px", height: "50px" }}
                  >
                    <img
                      src={getProductImage(product)}
                      alt={product?.productId?.name_en}
                      className="img-fluid rounded"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <div className="small fw-medium">
                      {product?.productId?.name_en}
                    </div>
                    <div className="small text-muted">
                      {t("orders.quantity")}: {product?.quantity || 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const OrderSkeleton = () => (
    <div className="col-md-12 mb-4">
      <div className="orderboxmain">
        <div
          className="skeleton"
          style={{ height: "150px", borderRadius: "8px" }}
        ></div>
      </div>
    </div>
  );

  const language =
    typeof window !== "undefined"
      ? localStorage.getItem("i18nextLng") || "en"
      : "en";

  useEffect(() => {
    const seoTitle =
      language === "ar"
        ? `طلباتي | تتبعي كل عملية شراء – بيانكا نيرا`
        : `My Orders | Track Every Purchase – Bianca Nera`;
    document.title = seoTitle;
  }, [language]);

  if (appState.cancelOrder && appState.selectedOrderForCancel) {
    return (
      <>
        <Header />
        <div className="myprofilepage py-lg-5 py-md-4 py-4">
          <div className="container">
            <div className="row">
              <ProfileSidebar />
              <div className="col-auto profilerightcol">
                <div className="mb-3">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleBackToOrders}
                  >
                    {t("orders.backToOrders")}
                  </button>
                </div>
                <OrderCancel
                  order={appState.selectedOrderForCancel}
                  onCancelSuccess={handleOrderCancelled}
                  onBack={handleBackToOrders}
                />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="myprofilepage py-lg-5 py-md-4 py-4">
        <div className="container">
          <div className="row">
            <ProfileSidebar />
            <div className="col-auto profilerightcol">
              {!isUserLoggedIn && (
                <div className="search-section mb-4 p-4 bg-light rounded">
                  <h4 className="mb-3">{t("orders.searchOrders")}</h4>
                  <div className="row g-3 align-items-end">
                    <div className="col-md-4">
                      <input
                        type="email"
                        className="form-control"
                        placeholder={t("orders.placeholders.email")}
                        value={appState.searchEmail}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateState({ searchEmail: val });
                          if (val === "" && appState.searchOrderId === "") {
                            resetSearch();
                          }
                        }}
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={t("orders.placeholders.orderId")}
                        value={appState.searchOrderId}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateState({ searchOrderId: val });
                          if (val === "" && appState.searchEmail === "") {
                            resetSearch();
                          }
                        }}
                      />
                    </div>
                    <div className="col-md-4">
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-dark flex-fill"
                          onClick={searchOrders}
                        >
                          {t("orders.search")}
                        </button>
                        <button
                          className="btn btn-outline-secondary flex-fill"
                          onClick={resetSearch}
                        >
                          {t("orders.reset")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="profilerightpart ordersbg">
                <div className="row mb-4 align-items-center">
                  <div className="col">
                    <h2>
                      {isUserLoggedIn
                        ? t("orders.allOrders")
                        : t("orders.myOrders")}
                    </h2>
                    <p className="text-muted">
                      {t("orders.total")}: {appState.totalOrders}{" "}
                      {t("orders.orders")}
                    </p>
                  </div>
                  <div className="col-md-auto">
                    <input
                      type="search"
                      className="form-control"
                      value={appState.searchItem}
                      onChange={(e) =>
                        updateState({ searchItem: e.target.value })
                      }
                      placeholder={t("orders.placeholders.searchOrders")}
                    />
                  </div>
                </div>

                {appState.error && (
                  <div className="alert alert-danger" role="alert">
                    {appState.error}
                  </div>
                )}

                {(isUserLoggedIn || appState.hasSearched) && (
                  <>
                    <div className="row">
                      {appState.orders.map((order) => (
                        <OrderItem key={order._id} order={order} />
                      ))}
                    </div>

                    {!appState.loading && appState.orders.length > 0 && (
                      <Pagination
                        currentPage={appState.currentPage}
                        totalPages={appState.totalPages}
                        onPageChange={handlePageChange}
                        showPageNumbers={true}
                      />
                    )}

                    {(appState.loading || appState.isSearching) && (
                      <div className="row">
                        {[...Array(3)].map((_, index) => (
                          <OrderSkeleton key={index} />
                        ))}
                      </div>
                    )}

                    {!appState.loading && appState.orders.length === 0 && (
                      <div className="text-center py-5">
                        <h4 className="text-muted">
                          {t("orders.noOrdersFound")}
                        </h4>
                        {!isUserLoggedIn && (
                          <Link href="/" className="btn btn-dark mt-3">
                            {t("orders.startShopping")}
                          </Link>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyOrders;
