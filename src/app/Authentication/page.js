"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import ForgetPassword from "./ForgetPassword.jsx";
import Footer from "@/footer/Footer";
import Header from "@/header/Header";
import Login from "./Login";
import Signup from "./Signup";
import OTPVerify from "./OTPVerify";
import ResetPassword from "./ResetPassword";
import { t } from "i18next";
import ScrollToTop from "@/utils/ScrollToTop";

const Authentications = () => {
  const [screen, setScreen] = useState(
    localStorage.getItem("auth_screen") || "Login",
  );
  useEffect(() => {
    localStorage.setItem("auth_screen", screen);
  }, [screen]);

  // Clear the stored screen when component unmounts (optional)

  const [mail, setmail] = useState("");
  const [otpScreen, setOtpScreen] = useState("Signup");
  const [phoneNumber, setphoneNumber] = useState("");
  const [navActive, setNavActive] = useState(false);
  const [history, setHistory] = useState([]); // Track screen history
  const language = localStorage.getItem("bianca_web_language"); // Fix the key if it was a mistake

  const handleLoginFirst = () => {
    Swal.fire({
      theme: "dark",
      toast: true,
      icon: "info",
      position: "top-end",
      text: "Please login first to continue.",
      showConfirmButton: false,
      timerProgressBar: true,
      timer: 3000,
    });
  };
  const navigateTo = (newScreen) => {
    setHistory((prev) => [...prev, screen]); // Add current screen to history
    setScreen(newScreen);
    localStorage.setItem("auth_screen", newScreen);
  };

  // Go back to previous screen
  const goBack = () => {
    if (history.length > 0) {
      const previousScreen = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1)); // Remove last entry
      setScreen(previousScreen);
      localStorage.setItem("auth_screen", previousScreen);
    } else {
      setScreen("Login"); // Default if no history
    }
  };
  return (
    <>
      <Header />
      {screen === "Login" ? (
        <Login navigateTo={navigateTo} screen={screen} /> // ✅ Now using navigateTo
      ) : screen === "Signup" ? (
        <Signup
          navigateTo={navigateTo} // ✅ Now using navigateTo
          setmail={setmail}
          setOtpScreen={setOtpScreen}
          setphoneNumber={setphoneNumber}
        />
      ) : screen === "OTP" ? (
        <OTPVerify
          navigateTo={navigateTo} // ✅ Now using navigateTo
          mail={mail}
          otpScreen={otpScreen}
          goBack={goBack}
          phoneNumber={phoneNumber}
        />
      ) : screen === "ForgotPassword" ? (
        <ForgetPassword
          navigateTo={navigateTo} // ✅ Now using navigateTo
          setmail={setmail}
          setOtpScreen={setOtpScreen}
          setphoneNumber={setphoneNumber}
        />
      ) : screen === "ResetPassword" ? (
        <ResetPassword
          mail={mail}
          phoneNumber={phoneNumber}
          navigateTo={navigateTo} // ✅ Now using navigateTo
        />
      ) : null}
      <Footer />
    </>
  );
};

export default Authentications;
