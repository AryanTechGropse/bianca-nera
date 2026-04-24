"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Footer from "@/footer/Footer";
import CartHeader from "@/header/CartHeader";
import CartProfile from "./CartProfile";
import Address from "./Address";
import Payment from "./Payment";
import OrderConfirm from "./OrderConfirm";
import { t } from "i18next";
import { getProfile } from "@/store/serviceSlices/commonSlice";

export default function CartPage() {
  const dispatch = useDispatch();
  // FIX: read screenState from commonSlice (was returning the entire store)
  const { cartState, profile, isLoading, screenState } = useSelector(
    (state) => ({
      cartState: state?.commonSlice?.cartState,
      profile: state?.commonSlice?.profile,
      isLoading: state?.commonSlice?.isLoading,
      screenState: state.commonSlice?.screenState || "Cart", // <-- corrected
    }),
  );

  // Normalize: handle either a string ('Cart') or an array like ['Cart', ...]
  const [couponApplicable, setCoupleApplicable] = useState(null);
  console.log("screenState (raw):", screenState);

  useEffect(() => {
    dispatch(getProfile());
  }, []);
  return (
    <>
      <CartHeader />
      {screenState === "Cart" && (
        <CartProfile
          setCoupleApplicable={setCoupleApplicable}
          couponApplicable={couponApplicable}
        />
      )}
      {screenState === "Address" && (
        <Address
          setCoupleApplicable={setCoupleApplicable}
          couponApplicable={couponApplicable}
        />
      )}
      {screenState === "Payment" && (
        <Payment
          setCoupleApplicable={setCoupleApplicable}
          couponApplicable={couponApplicable}
        />
      )}
      {screenState === "Confirmation" && (
        <OrderConfirm
          setCoupleApplicable={setCoupleApplicable}
          couponApplicable={couponApplicable}
        />
      )}
      {screenState === "Failed" && (
        <OrderConfirm
          setCoupleApplicable={setCoupleApplicable}
          couponApplicable={couponApplicable}
        />
      )}
      <Footer />
    </>
  );
}
