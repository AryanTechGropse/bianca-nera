"use client";
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import {
  getCart,
  getProfile,
  setUserAuthentication,
  sociaLogin,
  userLogin,
  wishCart,
  wishListCart,
} from "@/store/serviceSlices/commonSlice";
import Swal from "sweetalert2";
import { t } from "i18next";
import { auth, googleProvider } from "@/firebase/firebase.js";

// Import Apple authentication
import { getAuth, signInWithPopup, OAuthProvider } from "firebase/auth";
import { countryCodeMap } from "./countryCodes";
import i18n from "@/i18n/i18n";
import useHomeStore from "@/store/homeStore";

const Login = ({ navigateTo }) => {
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email"); // 'phone' or 'email'
  const [userCountry, setUserCountry] = useState("sa"); // Default to Saudi Arabia
  const [detectingCountry, setDetectingCountry] = useState(true);
  const [defaultCountryCode, setDefaultCountryCode] = useState("+966");

  const router = useRouter();
  const dispatch = useDispatch();
  const pathname = usePathname();

  // Create Apple provider
  const appleProvider = new OAuthProvider("apple.com");

  // Configure Apple provider
  appleProvider.addScope("email");
  appleProvider.addScope("name");

  // Detect user's country based on IP
  useEffect(() => {
    const detectUserCountry = async () => {
      try {
        setDetectingCountry(true);
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("Failed to fetch country data");
        const data = await response.json();

        console.log(data, "IP API RESPONSE");

        if (data && data.country_code) {
          localStorage.setItem("userCountry", data.country_name || "Saudi Arabia");
          const countryCode = data.country_code.toLowerCase();
          setUserCountry(countryCode);

          // Set default country code
          const callingCode = data.country_calling_code || "966";
          const newCountryCode = callingCode.startsWith("+") ? callingCode : `+${callingCode}`;
          setDefaultCountryCode(newCountryCode);
        }
      } catch (error) {
        console.error("Error detecting country:", error);
        // Fallback to Saudi Arabia
        setUserCountry("sa");
        setDefaultCountryCode("+966");
      } finally {
        setDetectingCountry(false);
      }
    };

    detectUserCountry();
  }, []);

  console.log(userCountry, "IP API RESPONSE");

  const getNavigation = localStorage.getItem("redirect");

  // Phone parsing function to properly extract country code and national number
  const parsePhoneFromFormatted = (formattedPhone) => {
    if (!formattedPhone) return { countryCode: "", nationalNumber: "" };

    // react-phone-input-2 returns the phone number in format like "919876543210"
    const digits = formattedPhone.replace(/\D/g, "");

    // Try to find the correct country code length
    for (let length = 1; length <= 4; length++) {
      const potentialCountryCode = digits.substring(0, length);
      if (countryCodeMap[potentialCountryCode] === length) {
        const nationalNumber = digits.substring(length);
        return {
          countryCode: `+${potentialCountryCode}`,
          nationalNumber: nationalNumber,
        };
      }
    }

    // Fallback for unknown country codes - try common lengths
    for (let length of [3, 2, 1]) {
      const potentialCountryCode = digits.substring(0, length);
      const potentialNationalNumber = digits.substring(length);

      if (
        potentialNationalNumber.length >= 7 &&
        potentialNationalNumber.length <= 15
      ) {
        return {
          countryCode: `+${potentialCountryCode}`,
          nationalNumber: potentialNationalNumber,
        };
      }
    }

    // Last resort fallback
    return {
      countryCode: `+${digits.substring(0, 2)}`,
      nationalNumber: digits.substring(2),
    };
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Conditional validation schema
  const schema = yup.object().shape({
    phone: yup.string().when("loginMethod", {
      is: "phone",
      then: (schema) =>
        schema
          .required("Phone number is required")
          .min(10, "Phone number is too short")
          .max(15, "Phone number is too long"),
      otherwise: (schema) => schema.notRequired(),
    }),
    email: yup.string().when("loginMethod", {
      is: "email",
      then: (schema) =>
        schema
          .required("Email is required")
          .email("Please enter a valid email address"),
      otherwise: (schema) => schema.notRequired(),
    }),
    password: yup
      .string()
      .required("Password is required")
      .min(8, "Password must be at least 8 characters"),
    rememberMe: yup.boolean(),
    loginMethod: yup.string(), // Add loginMethod to schema to avoid validation issues
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    resetField,
    setError,
    clearErrors,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      phone: "",
      email: "",
      password: "",
      rememberMe: false,
      loginMethod: "email", // Track login method in form state
    },
  });

  // Watch values
  const currentLoginMethod = watch("loginMethod");

  // Effect to sync login method with state
  useEffect(() => {
    setValue("loginMethod", loginMethod);
  }, [loginMethod, setValue]);

  // Update phone input with detected country code
  useEffect(() => {
    if (!detectingCountry && loginMethod === "phone") {
      const currentPhone = watch("phone");
      if (
        !currentPhone ||
        currentPhone === defaultCountryCode.replace("+", "")
      ) {
        setValue("phone", defaultCountryCode);
      }
    }
  }, [detectingCountry, defaultCountryCode, loginMethod, setValue, watch]);

  const showToast = (type, message) => {
    Swal.fire({
      toast: true,
      icon: type,
      position: "top-end",
      title: message,
      showConfirmButton: false,
      timerProgressBar: true,
      timer: 3000,
    });
  };

  const validatePhoneNumber = (phone) => {
    // More robust phone validation - check if it's at least 7 digits after country code
    if (!phone || phone.length < 7) return false;

    // Remove country code and check if remaining digits are valid
    const phoneDigits = phone.replace(/^\d{1,4}/, ""); // Remove country code (1-4 digits)
    return phoneDigits.length >= 7 && phoneDigits.length <= 15;
  };

  const handleGoogleLogin = async () => {
    // setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Google data (use "" if missing)
      const fullName = user.displayName || "";
      const email = user.email || "";
      const socialId = user.uid || "";
      const photoURL = user.photoURL || "";

      // Create final payload EXACTLY as backend expects
      const payload = {
        fullName: fullName,
        email: email,
        dob: "", // Google does not provide DOB
        userType: "User", // Static
        language: "English", // Static
        deviceId: "", // Web = ""
        deviceOS: "web", // Static
        fcmToken: "", // Web = ""
        buildNumber: "",
        OSVersion: "",
        deviceName: "",
        socialId: socialId,
        googleSignup: true, // Because this is Google login
        appleSignup: false, // Not Apple login
        appleId: "",
        location: "",
        country: "",
        profilePic: photoURL || "",
      };

      // Call your social login API
      const resultAction = await dispatch(sociaLogin({ data: payload }));

      if (sociaLogin.fulfilled.match(resultAction)) {
        const res = resultAction.payload;

        localStorage.setItem("bianca_web_token", res.results?.token || "");

        dispatch(getProfile());
        dispatch(getCart());
        dispatch(wishListCart());
        dispatch(setUserAuthentication(true));

        // Force re-fetch homepage data with current currency
        useHomeStore.getState().refreshHomeData();

        // Redirect logic
        // if (getNavigation === "wishlist") navigate("/MyWishlists");
        // else if (getNavigation === "cartProfile") navigate("/Cart");
        // else
        router.push("/");
      } else {
        console.log(resultAction);
        showToast("error", "Google login failed");
      }
    } catch (error) {
      // Handle specific Google login errors
      if (error.code === "auth/popup-closed-by-user") {
        // User cancelled - no need to show error
        console.log("Google login cancelled by user");
      } else if (error.code === "auth/cancelled-popup-request") {
        // Multiple popup requests - ignore
        console.log("Popup request cancelled");
      } else if (error.code === "auth/unauthorized-domain") {
        showToast("error", "This domain is not authorized for Google login");
      } else if (error.code === "auth/network-request-failed") {
        showToast(
          "error",
          "Network error. Please check your connection and try again.",
        );
      } else {
        showToast("error", "Google login failed. Please try again.");
        console.error("Google login error:", error);
      }
    }
    // finally {
    //   setLoading(false);
    // }
  };

  const handleAppleLogin = async () => {
    setAppleLoading(true);

    try {
      // Sign in with Apple
      const result = await signInWithPopup(auth, appleProvider);
      console.log("result", result);
      const user = result.user;

      // Extract user information from Apple
      const fullName = user.displayName || "";
      const email = user.email || "";
      const socialId = user.uid || "";
      const photoURL = user.photoURL || "";

      // Apple might not provide email in some cases due to privacy
      // You might need to handle this case differently
      if (!email) {
        showToast(
          "warning",
          "Apple didn't provide an email address. Please try another login method.",
        );
        return;
      }

      // Create payload for Apple login - similar to Google but with appleSignup: true
      const payload = {
        fullName: fullName,
        email: email,
        dob: "",
        userType: "User",
        language: "English",
        deviceId: "",
        deviceOS: "web",
        fcmToken: "",
        buildNumber: "",
        OSVersion: "",
        deviceName: "",
        socialId: socialId,
        googleSignup: false, // Not Google login
        appleSignup: true, // This is Apple login
        appleId: socialId, // Use socialId as appleId
        location: "",
        country: "",
        profilePic: photoURL || "",
      };

      // Call your social login API
      const resultAction = await dispatch(sociaLogin({ data: payload }));

      if (sociaLogin.fulfilled.match(resultAction)) {
        const res = resultAction.payload;

        localStorage.setItem("bianca_web_token", res.results?.token || "");

        dispatch(getProfile());
        dispatch(getCart());
        dispatch(wishListCart());
        dispatch(setUserAuthentication(true));

        // Force re-fetch homepage data with current currency
        useHomeStore.getState().refreshHomeData();

        // Redirect logic
        if (getNavigation === "wishlist") router.push("/MyWishlists");
        else if (getNavigation === "cartProfile") router.push("/Cart");
        else router.push("/");

        showToast("success", "Apple login successful!");
      } else {
        console.log(resultAction);
        showToast("error", "Apple login failed");
      }
    } catch (error) {
      console.error("Apple login error:", error);

      // Handle specific Apple login errors
      if (error.code === "auth/popup-closed-by-user") {
        showToast("info", "Apple login was cancelled");
      } else if (error.code === "auth/unauthorized-domain") {
        showToast("error", "This domain is not authorized for Apple login");
      } else {
        showToast("error", error.message || "Apple login failed");
      }
    } finally {
      setAppleLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Prepare the payload according to the API specification
      let payload;

      if (data.loginMethod === "phone") {
        if (!validatePhoneNumber(data.phone)) {
          throw new Error("Please enter a valid phone number");
        }

        const parsedNumber = parsePhoneFromFormatted(data.phone);

        payload = {
          phoneNumber: parsedNumber.nationalNumber,
          password: data.password,
          countryCode: parsedNumber.countryCode,
          deviceOS: "web",
          fcmToken: "",
          deviceId: "",
          userType: "User",
          language: "English",
        };
      } else {
        payload = {
          email: data.email,
          password: data.password,
          deviceOS: "web",
          fcmToken: "",
          deviceId: "",
          userType: "User",
          language: "English",
        };
      }

      const resultAction = await dispatch(userLogin({ data: payload }));

      if (userLogin.fulfilled.match(resultAction)) {
        const res = resultAction.payload;

        if (res.results?.verifyAccount === true) {
          toast.error("your account is not verify please verify first.");
          await navigateTo("OTP");
          return;
        }

        localStorage.setItem("bianca_web_token", res.results?.token || "");
        localStorage.setItem("bianca_web_language", "English");
        // toast.success("Login successful");
        dispatch(getProfile());
        dispatch(getCart());
        dispatch(wishListCart());

        // Force re-fetch homepage data with current currency
        useHomeStore.getState().refreshHomeData();

        if (getNavigation == "wishlist") {
          router.push("/MyWishlists");
        } else if (getNavigation == "cartProfile") {
          router.push("/Cart");
        } else {
          router.push("/");
        }
      } else {
        console.log(resultAction);
        throw new Error(resultAction.payload || "Login failed");
      }
    } catch (error) {
      showToast(
        "error",
        error.response?.message || error.message || "Login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleLoginMethod = (method) => {
    setLoginMethod(method);

    // Clear validation errors
    clearErrors();

    // Reset the other field when switching methods
    if (method === "phone") {
      resetField("email");
      // Set default phone value with detected country code
      if (!detectingCountry) {
        setValue("phone", defaultCountryCode);
      }
    } else {
      resetField("phone");
    }
  };

  const isRTL = i18n.dir() === "rtl";
  console.log(isRTL, "IS TRL");

  return (
    <>
      <div className="authpages padding">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 colwidth">
              <div className="authlogin">
                <div className="authlogintop">
                  <img src="/assets/img/loginbanner.png" alt="Login banner" />
                </div>
                <div className="loginform">
                  <h2>{t("Login")}</h2>

                  {/* Login Method Tabs */}
                  <div className="login-tabs mb-4">
                    <div className="nav nav-tabs" role="tablist">
                      <button
                        className={`nav-link ${
                          loginMethod === "email" ? "active" : ""
                        }`}
                        onClick={() => toggleLoginMethod("email")}
                        type="button"
                        role="tab"
                      >
                        <img
                          src="/assets/img/email.png"
                          alt="Email"
                          className="tab-icon"
                        />
                        {t("Email")}
                      </button>
                      <button
                        className={`nav-link ${
                          loginMethod === "phone" ? "active" : ""
                        }`}
                        onClick={() => toggleLoginMethod("phone")}
                        type="button"
                        role="tab"
                      >
                        <img
                          src="/assets/img/phone.png"
                          alt="Phone"
                          className="tab-icon"
                        />
                        {t("Phone")}
                      </button>
                    </div>
                  </div>

                  <form
                    className="authform row"
                    onSubmit={handleSubmit(onSubmit)}
                  >
                    {/* Conditional rendering based on login method */}
                    {loginMethod === "phone" ? (
                      <div className="col-md-12 form-group mb-4">
                        <label className="labelinput">
                          {t("Mobile Number")}*
                        </label>
                        <div
                          className="position-relative"
                          dir="ltr"
                          style={{ textAlign: "left" }}
                        >
                          <Controller
                            name="phone"
                            control={control}
                            rules={{
                              required: "Phone number is required",
                              validate: {
                                validPhone: (value) =>
                                  validatePhoneNumber(value) ||
                                  "Please enter a valid phone number",
                              },
                            }}
                            render={({ field: { onChange, value } }) => (
                              <PhoneInput
                                country={userCountry}
                                value={value}
                                onChange={onChange}
                                inputProps={{
                                  name: "phone",
                                  required: true,
                                  autoFocus: false,
                                  placeholder: t("Enter phone number"),
                                }}
                                containerStyle={{
                                  width: "100%",
                                  direction: isRTL ? "rtl" : "ltr",
                                  borderRadius: "4px",
                                  margin: "0 auto",
                                }}
                                inputStyle={{
                                  width: "100%",
                                  height: "48px",
                                  fontSize: "16px",
                                  paddingLeft: "48px",
                                  paddingRight: isRTL ? "60px" : "12px", // Adjust padding for RTL
                                  textAlign: isRTL ? "right" : "left",
                                  direction: isRTL ? "rtl" : "ltr",
                                  borderTop: errors.phone ? "1px solid #dc3545" : "1px solid #ced4da",
                                  borderBottom: errors.phone ? "1px solid #dc3545" : "1px solid #ced4da",
                                  borderLeft: isRTL ? "1px solid #ced4da" : "none",
                                  borderRight: "1px solid #ced4da",
                                  borderRadius: "4px",
                                }}
                                buttonStyle={{
                                  position: "absolute",
                                  left: isRTL ? "auto" : "0",
                                  right: isRTL ? "25px" : "auto", // Position button correctly for RTL
                                  top: "0",
                                  height: "48px",
                                  borderTop: errors.phone ? "1px solid #dc3545" : "1px solid #ced4da",
                                  borderBottom: errors.phone ? "1px solid #dc3545" : "1px solid #ced4da",
                                  borderLeft: isRTL ? "none" : "1px solid #ced4da",
                                  borderRight: isRTL ? "1px solid #ced4da" : "none",
                                  borderRadius: isRTL
                                    ? "0 4px 4px 0"
                                    : "4px 0 0 4px",
                                  backgroundColor: "#fff",
                                  zIndex: 1,
                                }}
                                dropdownStyle={{
                                  zIndex: 1050,
                                  textAlign: isRTL ? "right" : "left",
                                  direction: isRTL ? "rtl" : "ltr",
                                }}
                                countryCodeEditable={false}
                                enableSearch={true}
                                searchPlaceholder={t("Search countries")}
                                preferredCountries={[
                                  "sa",
                                  "ae",
                                  "tr",
                                  "us",
                                  "gb",
                                  "in",
                                ]}
                                disabled={detectingCountry}
                              />
                            )}
                          />
                          {detectingCountry && (
                            <div className="text-muted small mt-1">
                              {t("Detecting your country...")}
                            </div>
                          )}
                          {errors.phone && (
                            <div className="invalid-feedback d-block">
                              {errors.phone.message}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="col-md-12 form-group mb-4">
                        <label className="labelinput">
                          {t("Email Address")}*
                        </label>
                        <div className="position-relative">
                          <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="email"
                                className={`form-control ${
                                  errors.email ? "is-invalid" : ""
                                }`}
                                placeholder={t("Enter your email")}
                                autoComplete="off"
                              />
                            )}
                          />
                          <img
                            className="inputicon"
                            src="/assets/img/email.png"
                            style={{ top: "13px" }}
                            alt="email"
                          />
                          {errors.email && (
                            <div className="invalid-feedback d-block">
                              {errors.email.message}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Password Field */}
                    <div className="col-md-12 form-group mb-3">
                      <label className="labelinput">{t("Password")}*</label>
                      <div
                        className={`position-relative ${isRTL ? "rtl-input-group" : "ltr-input-group"}`}
                      >
                        <Controller
                          name="password"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              className={`form-control password-input ${errors.password ? "is-invalid" : ""}`}
                              placeholder={t("Enter your password")}
                            />
                          )}
                        />

                        {/* Lock icon */}
                        <img
                          className={`inputicon lock-icon ${isRTL ? "rtl-lock" : "ltr-lock"}`}
                          src="/assets/img/lock.png"
                          alt="Lock"
                        />

                        {/* Eye toggle button */}
                        <button
                          type="button"
                          className={`eyebtn toggle-password ${isRTL ? "rtl-eye" : "ltr-eye"}`}
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword
                              ? t("Hide password")
                              : t("Show password")
                          }
                        >
                          <img
                            src={`/assets/img/${showPassword ? "eye-slash.svg" : "eye.png"}`}
                            alt={
                              showPassword
                                ? t("Hide password")
                                : t("Show password")
                            }
                          />
                        </button>

                        {errors.password && (
                          <div className="invalid-feedback d-block">
                            {errors.password.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="col-md-12 form-group mb-3">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="customcheckbox mb-md-0 mb-3">
                            <Controller
                              name="rememberMe"
                              control={control}
                              render={({ field }) => (
                                <label className="custom-checkbox">
                                  <input
                                    {...field}
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={(e) =>
                                      field.onChange(e.target.checked)
                                    }
                                  />
                                  <span className="checkmark" />
                                  {t("Remember me")}
                                </label>
                              )}
                            />
                          </div>
                        </div>
                        <div className="col-md-6 text-md-end">
                          <a
                            className="forgotpassword"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              navigateTo("ForgotPassword");
                            }}
                          >
                            {t("Forgot password?")}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="col-md-12 form-group mb-3">
                      <button
                        type="submit"
                        className="authbtns2 w-100"
                        disabled={
                          loading ||
                          (loginMethod === "phone" && detectingCountry)
                        }
                      >
                        {loading
                          ? t("LOGGING IN")
                          : loginMethod === "phone" && detectingCountry
                            ? t("DETECTING COUNTRY...")
                            : t("LOGIN")}
                      </button>
                    </div>

                    {/* Social Login Separator */}
                    <div className="col-md-12 form-group mb-3">
                      <div className="loginwith">
                        <span>{t("Or Login with")}</span>
                      </div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="col-md-12 form-group mb-3" dir="ltr">
                      <div className="row">
                        <div className="col-6">
                          <a
                            className="otherbtns"
                            onClick={handleGoogleLogin}
                            disabled={loading || appleLoading}
                            style={{
                              cursor:
                                loading || appleLoading
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: loading || appleLoading ? 0.6 : 1,
                            }}
                          >
                            <img src="/assets/img/google.png" alt="Google" />{" "}
                            {t("Google")}
                          </a>
                        </div>
                        <div className="col-6">
                          <a
                            className="otherbtns"
                            onClick={handleAppleLogin}
                            disabled={loading || appleLoading}
                            style={{
                              cursor:
                                loading || appleLoading
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: loading || appleLoading ? 0.6 : 1,
                            }}
                          >
                            <img src="/assets/img/apple.png" alt="Apple" />{" "}
                            {appleLoading ? "Loading..." : t("Apple")}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Signup Redirect */}
                    <div className="col-md-12 form-group mb-3 text-center">
                      <div className="donthave">
                        {t("Dont have an account?")}{" "}
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            navigateTo("Signup");
                          }}
                        >
                          {t("Register Now")}
                        </a>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-tabs .nav-tabs {
          display: flex;
          border: none;
          background: #f8f9fa;
          border-radius: 50px;
          padding: 4px;
        }
        .login-tabs .nav-link {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: #6c757d;
          font-weight: 500;
          border-radius: 50px;
          transition: all 0.3s ease;
        }
        .login-tabs .nav-link:hover {
          color: #495057;
          background: rgba(255, 255, 255, 0.7);
        }
        .login-tabs .nav-link.active {
          background: #fff;
          color: #000000ff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .tab-icon {
          width: 18px;
          height: 18px;
          object-fit: contain;
        }
      `}</style>
    </>
  );
};

export default Login;
