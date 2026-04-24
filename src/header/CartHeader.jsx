import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setScreenState } from "@/store/serviceSlices/commonSlice";
import { Toaster } from "react-hot-toast";
import { t } from "i18next";
import Link from "next/link";

const CartHeader = () => {
  const dispatch = useDispatch();
  const screenState = useSelector(
    (state) => state.commonSlice?.screenState || "Cart",
  );
  const { cartState } = useSelector((state) => ({
    cartState: state?.commonSlice?.cartState,
  }));

  const cartLength = cartState?.carts?.products?.length || 0;

  const steps = ["Cart", "Address", "Payment"];
  const currentIndex = steps.indexOf(screenState);

  const handleStepClick = (step) => {
    const targetIndex = steps.indexOf(step);

    // ✅ Allow backward only
    if (targetIndex < currentIndex) {
      dispatch(setScreenState(step));
    }
  };

  return (
    <>
      <header className="headermain border-bottom">
        <div className="container">
          <div className="row align-items-center">
            {/* Logo */}
            <div className="col-md-auto text-md-start text-center mb-md-0 mb-3">
              <Link
                className="logohead"
                href="/"
                onClick={() => dispatch(setScreenState(""))}
              >
                <img src="assets/img/logo.png" alt="logo" />
              </Link>
            </div>

            {/* Progress Steps */}
            <div className="col" dir="ltr">
              <div className="cartprocess">
                <div className="row align-items-center flex-nowrap">
                  {/* Step 1: Cart */}
                  <div className="col">
                    <div
                      className={`row align-items-center justify-content-end ${
                        screenState === "Cart" ? "activeprogress" : ""
                      }`}
                      onClick={() => handleStepClick("Cart")}
                      style={{
                        cursor:
                          steps.indexOf("Cart") < currentIndex
                            ? "pointer"
                            : "not-allowed",
                      }}
                    >
                      <div className="col-md-6 d-md-flex align-items-center">
                        <span className="cartprocesscount">1</span>
                        <div className="cartprocessttitle">{t("Cart")}</div>
                      </div>
                      <div
                        className="col-md-6 ps-0"
                        style={{ marginLeft: "-25px" }}
                      >
                        <div className="cartprocessline" />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Address */}
                  <div className="col">
                    <div
                      className={`row align-items-center ${
                        screenState === "Address" ? "activeprogress" : ""
                      }`}
                      onClick={() => handleStepClick("Address")}
                      style={{
                        cursor:
                          steps.indexOf("Address") < currentIndex
                            ? "pointer"
                            : "not-allowed",
                      }}
                    >
                      <div className="col-md-6 d-md-flex align-items-center">
                        <span className="cartprocesscount">2</span>
                        <div className="cartprocessttitle">{t("Address")}</div>
                      </div>
                      <div className="col-md-6 ps-0">
                        <div className="cartprocessline" />
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Payment */}
                  <div className="col-auto">
                    <div
                      className={`row align-items-center ${
                        screenState === "Payment" ? "activeprogress" : ""
                      }`}
                      onClick={() => handleStepClick("Payment")}
                      style={{
                        cursor:
                          steps.indexOf("Payment") < currentIndex
                            ? "pointer"
                            : "not-allowed",
                      }}
                    >
                      <div className="col-md-auto d-md-flex align-items-center">
                        <span className="cartprocesscount">3</span>
                        <div className="cartprocessttitle">{t("Payment")}</div>
                      </div>
                      <div className="col-md-6 d-md-none d-block">
                        <div className="cartprocessline" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <Toaster position="bottom-center" reverseOrder={false} />
    </>
  );
};

export default CartHeader;
