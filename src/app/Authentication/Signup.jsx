"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import Swal from "sweetalert2";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "i18next";
import i18n from "@/i18n/i18n";
import axios from "axios";

const Signup = ({ setmail, setphoneNumber, navigateTo, setOtpScreen }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userCountry, setUserCountry] = useState("sa");
  const [detectingCountry, setDetectingCountry] = useState(true);
  const [defaultCountryCode, setDefaultCountryCode] = useState("+966");
  const [isRTL, setIsRTL] = useState(i18n.language === "ar");

  // Update RTL state when language changes
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setIsRTL(lng === "ar");
    };
    i18n.on("languageChanged", handleLanguageChange);
    return () => i18n.off("languageChanged", handleLanguageChange);
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Validation schema with translated error messages
  const schema = yup.object().shape({
    fullName: yup
      .string()
      .required(t("signup.full_name_required"))
      .min(2, t("signup.full_name_min"))
      .max(50, t("signup.full_name_max"))
      .matches(/^[a-zA-Z\s]+$/, t("signup.full_name_pattern")),
    phone: yup
      .string()
      .required(t("signup.mobile_required"))
      .min(8, t("signup.mobile_valid")), // optional basic validation
    countryCode: yup.string().required(t("signup.country_code_required")),
    email: yup
      .string()
      .required(t("signup.email_required"))
      .email(t("signup.email_valid")),
    password: yup
      .string()
      .required(t("signup.password_required"))
      .min(8, t("signup.password_min"))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        t("signup.password_pattern"),
      ),
    confirmPassword: yup
      .string()
      .required(t("signup.confirm_password_required"))
      .oneOf([yup.ref("password"), null], t("signup.password_match")),
    dob: yup
      .date()
      // .nullable()
      .transform((value, originalValue) =>
        originalValue === "" ? null : value,
      )
      .max(new Date(Date.now() - 568025136000), t("signup.dob_age")),
    terms: yup
      .boolean()
      .oneOf([true], t("signup.terms_required"))
      .required(t("signup.terms_required")),
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: JSON.parse(localStorage.getItem("signupFormData")) || {
      fullName: "",
      phone: "",
      countryCode: "",
      email: "",
      password: "",
      confirmPassword: "",
      dob: "",
      terms: false,
    },
  });

  // Detect user's country
  useEffect(() => {
    const detectUserCountry = async () => {
      try {
        setDetectingCountry(true);
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();

        if (data && data.country_code) {
          const countryCode = data.country_code.toLowerCase();
          setUserCountry(countryCode);

          const callingCode = data.country_calling_code || "966";
          const newCountryCode = `+${callingCode}`;
          setDefaultCountryCode(newCountryCode);

          const savedData = JSON.parse(localStorage.getItem("signupFormData"));
          if (!savedData?.countryCode) {
            setValue("countryCode", newCountryCode);
          }
        }
      } catch (error) {
        console.error(t("signup.country_detect_error"), error);
        setUserCountry("sa");
        setDefaultCountryCode("+966");

        const savedData = JSON.parse(localStorage.getItem("signupFormData"));
        if (!savedData?.countryCode) {
          setValue("countryCode", "+966");
        }
      } finally {
        setDetectingCountry(false);
      }
    };

    detectUserCountry();
  }, [setValue]);

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

  // Save form data to localStorage on change
  React.useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem("signupFormData", JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const clearSavedData = () => {
    localStorage.removeItem("signupFormData");
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const location = {
        latitude: 0,
        longitude: 0,
        address_en: "",
        city_en: "",
        country_en: "",
        address_ar: "",
        city_ar: "",
        country_ar: "",
      };

      let phonePayload = {};
      if (data.phone && data.countryCode) {
        const phoneNumber = data.phone
          .replace(data.countryCode.replace("+", ""), "")
          .trim();
        phonePayload = {
          phoneNumber: phoneNumber,
          countryCode: data.countryCode,
        };
      }

      // Format DOB properly to avoid timezone issues
      let formattedDob = null;
      if (data.dob) {
        // If dob is a Date object, format it to YYYY-MM-DD string
        if (data.dob instanceof Date) {
          const year = data.dob.getFullYear();
          const month = String(data.dob.getMonth() + 1).padStart(2, "0");
          const day = String(data.dob.getDate()).padStart(2, "0");
          formattedDob = `${year}-${month}-${day}`;
        } else {
          // If it's already a string, use it directly
          formattedDob = data.dob;
        }
      }

      const payload = {
        fullName: data.fullName,
        email: data.email,
        dob: formattedDob,
        fcmToken: "",
        password: data.password,
        deviceId: "",
        language: "English",
        appleId: "",
        googleSignup: false,
        appleSignup: false,
        deviceOS: "web",
        location: JSON.stringify(location),
        ...phonePayload,
      };
      console.log(payload, "Payload");
      // const response = ""

      // const response = await callMiddleWare({
      //   method: 'post',
      //   endpoint: 'user/signup',
      //   data: payload,
      // });

      const response = await axios.post(
        `https://bianca-nera.com:2053/user/signup`,
        payload,
      );
      // const response = await axios.post(
      //   `http://100.52.8.9:2053/user/signup`,
      //   payload,
      // );

      setmail(payload.email);

      if (payload.phoneNumber && payload.countryCode) {
        setphoneNumber([payload.countryCode, payload.phoneNumber]);
      }

      if (response?.data?.error) {
        throw new Error(response?.data?.message || t("signup.signup_failed"));
        return;
      }

      if (response && !response.error) {
        setOtpScreen("Signup");
        showToast(
          "success",
          response?.otp + " " + response?.message || t("signup.signup_success"),
        );
        navigateTo("OTP");
      } else {
        throw new Error(response?.message || t("signup.signup_failed"));
      }
    } catch (error) {
      showToast(
        "error",
        error.response?.message || error.message || t("signup.signup_failed"),
      );
    } finally {
      setLoading(false);
    }
  };

  // Clear form fields on component mount
  useEffect(() => {
    localStorage.removeItem("signupFormData");
    reset({
      fullName: "",
      phone: "",
      countryCode: "",
      email: "",
      password: "",
      confirmPassword: "",
      dob: "",
      terms: false,
    });
  }, [reset]);

  return (
    <>
      <div className="authpages padding">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 colwidth">
              <div className="authlogin">
                <div className="authlogintop">
                  <img
                    src="assets/img/loginbanner.png"
                    alt={t("signup.login_banner_alt")}
                  />
                </div>
                <div className="loginform">
                  <h2 className={isRTL ? "text-right" : ""}>
                    {t("signup.create_account")}
                  </h2>
                  <form
                    className="authform row"
                    onSubmit={handleSubmit(onSubmit)}
                  >
                    {/* Full Name */}
                    <div className="col-md-12 form-group mb-3">
                      <label className="labelinput">
                        {t("signup.full_name_label")}
                      </label>
                      <Controller
                        name="fullName"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            className={`form-control px-3 ${
                              errors.fullName ? "is-invalid" : ""
                            }`}
                            placeholder={t("signup.full_name_placeholder")}
                          />
                        )}
                      />
                      {errors.fullName && (
                        <div className="invalid-feedback d-block">
                          {errors.fullName.message}
                        </div>
                      )}
                    </div>

                    {/* Phone - Optional */}
                    <div className="col-md-12 form-group mb-3">
                      <label className="labelinput">
                        {t("signup.mobile_number_label")}
                      </label>
                      <div>
                        <Controller
                          name="phone"
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <PhoneInput
                              country={userCountry}
                              value={value}
                              onChange={(val, country) => {
                                onChange(val);
                                setValue("countryCode", "+" + country.dialCode);
                              }}
                              inputProps={{
                                name: "phone",
                                autoFocus: false,
                                placeholder: t(
                                  "signup.mobile_number_placeholder",
                                ),
                              }}
                              containerStyle={{
                                width: "100%",
                                margin: "0 auto",
                              }}
                              inputStyle={{
                                width: "100%",
                                height: "48px",
                                fontSize: "16px",
                                paddingLeft: "48px",
                                paddingRight: isRTL ? "60px" : "12px",
                                textAlign: isRTL ? "right" : "left",
                                direction: isRTL ? "rtl" : "ltr",
                                borderTop: errors.phone
                                  ? "1px solid #dc3545"
                                  : "1px solid #ced4da",
                                borderBottom: errors.phone
                                  ? "1px solid #dc3545"
                                  : "1px solid #ced4da",
                                borderLeft: isRTL
                                  ? "1px solid #ced4da"
                                  : "none",
                                borderRight: isRTL
                                  ? "1px solid #ced4da"
                                  : "1px solid #ced4da",
                                borderRadius: "4px",
                              }}
                              buttonStyle={{
                                position: "absolute",
                                left: isRTL ? "auto" : "0",
                                right: isRTL ? "25px" : "auto",
                                top: "0",
                                height: "48px",
                                borderTop: errors.phone
                                  ? "1px solid #dc3545"
                                  : "1px solid #ced4da",
                                borderBottom: errors.phone
                                  ? "1px solid #dc3545"
                                  : "1px solid #ced4da",
                                borderRight: isRTL ? "none" : "none",
                                borderLeft: isRTL
                                  ? "none"
                                  : "1px solid #ced4da",
                                borderTop: isRTL
                                  ? "1px solid #ced4da"
                                  : "1px solid #ced4da",
                                borderBottom: isRTL
                                  ? "1px solid #ced4da"
                                  : "1px solid #ced4da",
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
                              enableSearch
                              searchPlaceholder={t("signup.search_countries")}
                              preferredCountries={[
                                "sa",
                                "ae",
                                "in",
                                "us",
                                "gb",
                              ]}
                              disabled={detectingCountry}
                            />
                          )}
                        />
                      </div>
                      {detectingCountry && (
                        <div className="text-muted small mt-1">
                          {t("signup.detecting_country")}
                        </div>
                      )}
                      {errors.phone && (
                        <div className="invalid-feedback d-block">
                          {errors.phone.message}
                        </div>
                      )}
                    </div>

                    {/* Password */}
                    <div className="col-md-12 form-group mb-3">
                      <label className="labelinput">
                        {t("signup.password_label")}
                      </label>
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
                              className={`form-control password-input ${
                                errors.password ? "is-invalid" : ""
                              }`}
                              placeholder={t("signup.password_placeholder")}
                            />
                          )}
                        />
                        <img
                          className={`inputicon lock-icon ${isRTL ? "rtl-lock" : "ltr-lock"}`}
                          src="assets/img/lock.png"
                          alt={t("signup.lock_alt")}
                        />
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
                            src={`assets/img/${showPassword ? "eye-slash.svg" : "eye.png"}`}
                            alt={
                              showPassword
                                ? t("Hide password")
                                : t("Show password")
                            }
                          />
                        </button>
                      </div>
                      {errors.password && (
                        <div className="invalid-feedback d-block">
                          {errors.password.message}
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="col-md-12 form-group mb-3">
                      <label className="labelinput">
                        {t("signup.confirm_password_label")}
                      </label>
                      <div
                        className={`position-relative ${isRTL ? "rtl-input-group" : "ltr-input-group"}`}
                      >
                        <Controller
                          name="confirmPassword"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type={showConfirmPassword ? "text" : "password"}
                              className={`form-control password-input ${
                                errors.confirmPassword ? "is-invalid" : ""
                              }`}
                              placeholder={t(
                                "signup.confirm_password_placeholder",
                              )}
                            />
                          )}
                        />
                        <img
                          className={`inputicon lock-icon ${isRTL ? "rtl-lock" : "ltr-lock"}`}
                          src="assets/img/lock.png"
                          alt={t("signup.lock_alt")}
                        />
                        <button
                          type="button"
                          className={`eyebtn toggle-password ${isRTL ? "rtl-eye" : "ltr-eye"}`}
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          aria-label={
                            showConfirmPassword
                              ? t("Hide password")
                              : t("Show password")
                          }
                        >
                          <img
                            src={`assets/img/${showConfirmPassword ? "eye-slash.svg" : "eye.png"}`}
                            alt={
                              showConfirmPassword
                                ? t("Hide password")
                                : t("Show password")
                            }
                          />
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <div className="invalid-feedback d-block">
                          {errors.confirmPassword.message}
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="col-md-6 form-group mb-3">
                      <label className="labelinput">
                        {t("signup.email_label")}
                      </label>
                      <div className="position-relative">
                        <Controller
                          name="email"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className={`form-control ${errors.email ? "is-invalid" : ""}`}
                              placeholder={t("signup.email_placeholder")}
                            />
                          )}
                        />
                        <img
                          className="inputicon"
                          src="/assets/img/mail.png"
                          style={{ top: "13px" }}
                          alt={t("signup.mail_alt")}
                        />
                        {errors.email && (
                          <div className="invalid-feedback d-block">
                            {errors.email.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DOB */}
                    <div className="col-md-6 form-group mb-3">
                      <label className="labelinput">
                        {t("signup.dob_label")}
                      </label>
                      <Controller
                        name="dob"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="date"
                            className={`form-control pe-5 ps-5 ${
                              errors.dob ? "is-invalid" : ""
                            }`}
                            max={new Date().toISOString().split("T")[0]}
                            required
                          />
                        )}
                      />
                      {errors.dob && (
                        <div className="invalid-feedback d-block">
                          {errors.dob.message}
                        </div>
                      )}
                    </div>

                    {/* Terms */}
                    <div className="col-md-12 form-group mb-4">
                      <div className="customcheckbox mb-md-0">
                        <Controller
                          name="terms"
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
                              {t("signup.terms_text")}{" "}
                              <Link href={`/Content/TermsAndConditions`}>
                                {t("signup.terms_link")}
                              </Link>{" "}
                              &{" "}
                              <Link href={`/Content/PrivacyPolicy`}>
                                {t("signup.privacy_link")}
                              </Link>
                            </label>
                          )}
                        />
                        {errors.terms && (
                          <div className="invalid-feedback d-block">
                            {errors.terms.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="col-md-12 form-group mb-3">
                      <button
                        type="submit"
                        className="authbtns2 w-100"
                        disabled={loading || detectingCountry}
                      >
                        {loading
                          ? t("signup.loading")
                          : detectingCountry
                            ? t("signup.detecting_country")
                            : t("signup.continue_button")}
                      </button>
                    </div>

                    {/* Login Redirect */}
                    <div className="col-md-12 form-group mb-3 text-center">
                      <div className="donthave">
                        {t("signup.already_have_account")}{" "}
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            navigateTo("Login");
                            clearSavedData();
                          }}
                        >
                          {t("signup.login_now")}
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
    </>
  );
};

export default Signup;
