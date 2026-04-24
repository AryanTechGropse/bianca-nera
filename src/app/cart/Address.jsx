import React, { useCallback, useEffect, useState } from "react";
import CartHeader from "@/header/CartHeader";
import Footer from "@/footer/Footer";
import { useDispatch, useSelector } from "react-redux";
import { getAddress, setScreenState } from "@/store/serviceSlices/commonSlice";
import toast from "react-hot-toast";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import Coupons from "./Coupons";
import { useForm, Controller } from "react-hook-form";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { t } from "i18next";
import i18n from "@/i18n/i18n";

const Address = ({ setCoupleApplicable }) => {
  const dispatch = useDispatch();
  const [crud, setCrud] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [userCountry, setUserCountry] = useState("tr");
  const [detectingCountry, setDetectingCountry] = useState(true);
  const [defaultCountryCode, setDefaultCountryCode] = useState("+90");
  const [isRTL, setIsRTL] = useState(i18n.language === "ar");
  // const [isFirstAddress,setIsFirstAddress] = useState()

  const { cartState, address, isLoading, isUserLoggedIn } = useSelector(
    (state) => ({
      cartState: state?.commonSlice?.cartState,
      address: state?.commonSlice?.address,
      isLoading: state?.commonSlice?.isLoading,
      isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
    }),
  );

  // Update RTL state when language changes
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setIsRTL(lng === "ar");
    };
    i18n.on("languageChanged", handleLanguageChange);
    return () => i18n.off("languageChanged", handleLanguageChange);
  }, []);

  useEffect(() => {
    const detectUserCountry = async () => {
      try {
        setDetectingCountry(true);
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();

        if (data && data.country_code) {
          const countryCode = data.country_code.toLowerCase();
          setUserCountry(countryCode);

          const callingCode = data.country_calling_code || "90";
          const newCountryCode = `+${callingCode}`;
          setDefaultCountryCode(newCountryCode);
        }
      } catch (error) {
        console.error(t("Error detecting country:"), error);
        setUserCountry("tr");
        setDefaultCountryCode("+90");
      } finally {
        setDetectingCountry(false);
      }
    };

    detectUserCountry();
  }, []);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      _id: null,
      fullName: "",
      phone: "",
      address: "",
      email: "",
      city: "",
      zipCode: "",
      addressType: "Home",
      latitude: null,
      longitude: null,
      countryCode: defaultCountryCode,
      country: "",
    },
  });

  useEffect(() => {
    if (!detectingCountry) {
      setValue("countryCode", defaultCountryCode);
      const currentPhone = watch("phone");
      if (!currentPhone) {
        setValue("phone", defaultCountryCode);
      }
    }
  }, [detectingCountry, defaultCountryCode, setValue, watch]);

  const watchedAddressType = watch("addressType");

  useEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  useEffect(() => {
    if (address?.addresses?.length > 0) {
      const defaultAddress = address.addresses.find((addr) => addr.isDefault);
      console.log("--state address--", address);
      setSelectedAddress(defaultAddress || address.addresses[0]);
    } else if (address?.addresses?.length === 0) {
      setSelectedAddress(null);
    }
  }, [address]);

  const onSubmit = useCallback(
    async (data) => {
      try {
        const countryCode = data.countryCode || defaultCountryCode;
        const phoneNumber = data.phone
          .replace(countryCode.replace("+", ""), "")
          .trim();

        if (!phoneNumber || phoneNumber.length < 5) {
          throw new Error(t("Please enter a valid phone number"));
        }

        const addressData = {
          name: data.fullName.trim(),
          email: data.email,
          phoneNumber: phoneNumber,
          countryCode: countryCode,
          address: data.address.trim(),
          city: data.city.trim(),
          zipCode: data.zipCode.trim(),
          // type: data.addressType,
          latitude: data.latitude,
          longitude: data.longitude,
          isDefault: false,
          country: data.country.trim(),
          ...(crud && { addressId: data._id }),
        };

        const response = await callMiddleWare({
          method: crud ? "put" : "post",
          endpoint: crud ? "user/editAddress" : "user/addAddress",
          data: addressData,
        });

        if (response?.error) {
          throw new Error(
            response.error.message ||
              response.error ||
              "Failed to save address",
          );
        }
        const newAddressId = response?.results?.address?._id;

        const isFirstAddress =
          !address?.addresses || address.addresses.length === 0;

        console.log("--selectedAddress--", address.addresses);
        if (address.addresses.length <= 0) {
          // ✅ Always make default immediately
          await makeDefaultAddress(newAddressId);
        }

        toast.success(t("Address saved successfully"));
        reset({
          fullName: "",
          phone: defaultCountryCode,
          address: "",
          city: "",
          email: "",
          zipCode: "",
          addressType: "Home",
          latitude: null,
          longitude: null,
          countryCode: defaultCountryCode,
          country: "",
        });
        dispatch(getAddress());
        setCrud(false);

        const modal = document.getElementById("addaddress");
        const bootstrapModal = window.bootstrap?.Modal?.getInstance(modal);
        bootstrapModal?.hide();
      } catch (error) {
        console.error(t("Save address error:"), error);
        toast.error(error?.message || t("Failed to save address"));
      }
    },
    [crud, reset, dispatch, defaultCountryCode],
  );

  const removeAddress = async (id) => {
    try {
      const response = await callMiddleWare({
        method: "delete",
        endpoint: `user/deleteAddress/${id}`,
      });

      if (!response || response?.error || response?.status >= 400) {
        toast.error(response?.message || t("Failed to delete address"));
        return;
      }

      // ✅ Success
      // console.log("Address deleted successfully", selectedAddress, id);
      dispatch(getAddress());
      toast.success(response?.message || t("Address deleted"));

      if (selectedAddress?._id === id) {
        const remainingAddresses = address?.addresses?.filter(
          (addr) => addr._id !== id,
        );
        setSelectedAddress(remainingAddresses?.[0] || null);
        // window.location.reload();
        // setSelectedAddress(null)
        // console.log("@Address deleted successfully", selectedAddress);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          t("Failed to delete address"),
      );
    }
  };

  const makeDefaultAddress = async (id) => {
    try {
      const response = await callMiddleWare({
        method: "get",
        endpoint: "user/setDefaultAddress",
        id,
      });

      if (!response?.error) {
        toast.success(t("Default address set successfully!"));
        dispatch(getAddress());

        const updatedAddress = address?.addresses?.find(
          (addr) => addr._id === id,
        );
        if (updatedAddress) {
          setSelectedAddress(updatedAddress);
        }
        dispatch(setScreenState("Payment"));
      } else {
        throw new Error(
          response?.error?.message || t("Failed to set default address"),
        );
      }
    } catch (error) {
      console.error(t("Set default address error:"), error);
      toast.error(error?.message || t("Failed to set default address"));
    }
  };

  const handleAddressSelect = (item) => {
    setSelectedAddress(item);
  };

  const handleEditAddress = (item) => {
    setCrud(true);
    const fullPhone = `${item.countryCode}${item.phoneNumber}`;

    setValue("_id", item._id);
    setValue("fullName", item.name || "");
    setValue("phone", fullPhone || defaultCountryCode);
    setValue("countryCode", item.countryCode || defaultCountryCode);
    setValue("address", item.address || "");
    setValue("city", item.city || "");
    setValue("zipCode", item.zipCode || "");
    // setValue("addressType", item.type || "Home");
    setValue("latitude", item.latitude || null);
    setValue("longitude", item.longitude || null);
    setValue("email", item.email || "");
    setValue("country", item.country || "");
  };

  const handleAddNewAddress = () => {
    setCrud(false);
    reset({
      fullName: "",
      phone: defaultCountryCode,
      countryCode: defaultCountryCode,
      address: "",
      city: "",
      email: "",
      zipCode: "",
      // addressType: "Home",
      latitude: null,
      longitude: null,
      country: "",
    });
  };

  return (
    <>
      <div className="cartpage py-md-5 py-4">
        <div className="cart-container">
          <div className="row">
            <div className="col-lg-7">
              <div className="samedesignborder mb-3" dir="ltr">
                <div className="loginform p-0">
                  <h2>{t("Select Delivery Address")}</h2>

                  {isLoading
                    ? [...Array(2)].map((_, index) => (
                        <div className="form-group col-md-6 mb-4" key={index}>
                          <div className="skeleton-loader p-4 w-100 h-100 border rounded bg-light"></div>
                        </div>
                      ))
                    : address?.addresses?.map((item) => (
                        <div
                          className={`deliveryaddressbox mb-3 ${
                            selectedAddress?._id === item._id ? "active" : ""
                          }`}
                          key={item._id}
                        >
                          <div className="radiobtns mb-0">
                            <input
                              type="radio"
                              id={item._id}
                              name="address"
                              className="d-none"
                              checked={selectedAddress?._id === item._id}
                              onChange={() => handleAddressSelect(item)}
                            />
                            <label htmlFor={item._id}>{t(item.name)}</label>
                          </div>
                          <div className="deliveryaddressinner mb-3">
                            <div className="addreesttext">
                              {/* <strong>{item.name}</strong> */}
                              <br />
                              {item.address}, {item.city} - {item.zipCode}
                            </div>
                            <div className="addressphone">
                              {t("Phone")}:{" "}
                              <a
                                href={`tel:${item.countryCode}${item.phoneNumber}`}
                              >
                                {item.countryCode} {item.phoneNumber}
                              </a>
                            </div>
                            {item.email && (
                              <div className="addressemail">
                                {t("Email")}: {item.email}
                              </div>
                            )}
                            {item.isDefault && (
                              <div className="default-badge text-success small mt-1">
                                ✓ {t("Default Address")}
                              </div>
                            )}
                          </div>
                          <div className="deliveractions">
                            <a
                              href="#"
                              data-bs-toggle="modal"
                              data-bs-target="#addaddress"
                              onClick={(e) => {
                                e.preventDefault();
                                handleEditAddress(item);
                              }}
                            >
                              {t("Edit")}
                            </a>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                removeAddress(item._id);
                              }}
                            >
                              {t("Delete")}
                            </a>
                          </div>
                        </div>
                      ))}

                  {!isLoading &&
                    (!address?.addresses || address.addresses.length === 0) && (
                      <div className="row pt-4">
                        <div className="col-md-12 mb-3">
                          <form
                            className="authform row mx-0"
                            onSubmit={handleSubmit(onSubmit)}
                            dir="ltr"
                          >
                            <div className="col-md-12 form-group mb-3">
                              <label className="labelinput">
                                {t("Full Name*")}
                              </label>
                              <div className="position-relative">
                                <Controller
                                  name="fullName"
                                  control={control}
                                  rules={{
                                    required: t("Full name is required"),
                                    minLength: {
                                      value: 2,
                                      message: t(
                                        "Name must be at least 2 characters",
                                      ),
                                    },
                                  }}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      type="text"
                                      className={`form-control px-3 ${errors.fullName ? "is-invalid" : ""}`}
                                      placeholder={t("Enter your full name")}
                                    />
                                  )}
                                />
                                {errors.fullName && (
                                  <div className="invalid-feedback">
                                    {errors.fullName.message}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="col-md-12 form-group mb-3">
                              <label className="labelinput">
                                {t("Email*")}
                              </label>
                              <div className="position-relative">
                                <Controller
                                  name="email"
                                  control={control}
                                  rules={{
                                    required: t("Email is required"),
                                    pattern: {
                                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                      message: t(
                                        "Please enter a valid email address",
                                      ),
                                    },
                                  }}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      type="email"
                                      className={`form-control px-3 ${errors.email ? "is-invalid" : ""}`}
                                      placeholder={t("Enter your email")}
                                    />
                                  )}
                                />
                                {errors.email && (
                                  <div className="invalid-feedback">
                                    {errors.email.message}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="col-md-12 form-group mb-3">
                              <label className="labelinput">
                                {t("Phone Number*")}
                              </label>
                              <div className="position-relative">
                                <Controller
                                  name="phone"
                                  control={control}
                                  rules={{
                                    required: t("Phone number is required"),
                                  }}
                                  render={({ field: { onChange, value } }) => (
                                    <PhoneInput
                                      country={userCountry}
                                      value={value}
                                      onChange={(phone, country) => {
                                        onChange(phone);
                                        setValue(
                                          "countryCode",
                                          "+" + country.dialCode,
                                        );
                                      }}
                                      inputProps={{
                                        name: "phone",
                                        autoFocus: false,
                                        placeholder: t("Enter phone number"),
                                      }}
                                      containerStyle={{
                                        width: "100%",
                                        margin: "0 auto",
                                      }}
                                      inputStyle={{
                                        width: "100%",
                                        height: "50px",
                                        fontSize: "16px",
                                        paddingLeft: "60px",
                                        paddingRight: isRTL ? "60px" : "12px",
                                        textAlign: isRTL ? "right" : "left",
                                        direction: isRTL ? "rtl" : "ltr",
                                        border: errors.phone
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
                                        height: "50px",
                                        border: errors.phone
                                          ? "1px solid #dc3545"
                                          : "none",
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
                                        maxHeight: "150px",
                                        zIndex: 1050,
                                        textAlign: isRTL ? "right" : "left",
                                        direction: isRTL ? "rtl" : "ltr",
                                      }}
                                      countryCodeEditable={false}
                                      enableSearch
                                      preferredCountries={[
                                        "tr",
                                        "sa",
                                        "ae",
                                        "us",
                                        "gb",
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
                                  <div className="text-danger small mt-1">
                                    {errors.phone.message}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="col-md-12 form-group mb-3">
                              <label className="labelinput">
                                {t("Address*")}
                              </label>
                              <div className="position-relative">
                                <Controller
                                  name="address"
                                  control={control}
                                  rules={{
                                    required: t("Address is required"),
                                    minLength: {
                                      value: 10,
                                      message: t(
                                        "Address must be at least 10 characters",
                                      ),
                                    },
                                  }}
                                  render={({ field }) => (
                                    <textarea
                                      {...field}
                                      className={`form-control px-3 ${errors.address ? "is-invalid" : ""}`}
                                      placeholder={t(
                                        "House no. Building, Street, Area",
                                      )}
                                      rows="3"
                                    />
                                  )}
                                />
                                {errors.address && (
                                  <div className="invalid-feedback">
                                    {errors.address.message}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="col-md-4 form-group mb-3">
                              <label className="labelinput">{t("City*")}</label>
                              <div className="position-relative">
                                <Controller
                                  name="city"
                                  control={control}
                                  rules={{
                                    required: t("City is required"),
                                    minLength: {
                                      value: 2,
                                      message: t(
                                        "City must be at least 2 characters",
                                      ),
                                    },
                                  }}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      type="text"
                                      className={`form-control px-3 ${errors.city ? "is-invalid" : ""}`}
                                      placeholder={t("Enter city")}
                                    />
                                  )}
                                />
                                {errors.city && (
                                  <div className="invalid-feedback">
                                    {errors.city.message}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="col-md-4 form-group mb-3">
                              <label className="labelinput">
                                {t("Zip Code")}
                              </label>
                              <div className="position-relative">
                                <Controller
                                  name="zipCode"
                                  control={control}
                                  rules={{
                                    // required: t("Zip code is required"),
                                    pattern: {
                                      value: /^[0-9]{4,10}$/,
                                      message: t(
                                        "Please enter a valid zip code (4-10 digits)",
                                      ),
                                    },
                                  }}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      type="text"
                                      className={`form-control px-3 ${errors.zipCode ? "is-invalid" : ""}`}
                                      placeholder={t("Enter zip code")}
                                    />
                                  )}
                                />
                                {/* {errors.zipCode && (
                          <div className="invalid-feedback">
                            {errors.zipCode.message}
                          </div>
                        )} */}
                              </div>
                            </div>

                            <div className="col-md-4 form-group mb-3">
                              <label className="labelinput">
                                {t("Country*")}
                              </label>
                              <div className="position-relative">
                                <Controller
                                  name="country"
                                  control={control}
                                  rules={{
                                    required: t("Country is required"),
                                    minLength: {
                                      value: 2,
                                      message: t("Enter valid country"),
                                    },
                                  }}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      type="text"
                                      className={`form-control px-3 ${errors.country ? "is-invalid" : ""}`}
                                      placeholder={t("Enter Country code")}
                                    />
                                  )}
                                />
                                {errors.country && (
                                  <div className="invalid-feedback">
                                    {errors.country.message}
                                  </div>
                                )}
                              </div>
                            </div>
                            <>
                              {/* <div className="col-md-12 form-group mb-4">
                              <label className="labelinput">
                                {t("Address Type*")}
                              </label>
                              <Controller
                                name="addressType"
                                control={control}
                                rules={{
                                  required: t("Please select address type"),
                                }}
                                render={({ field: { onChange, value } }) => (
                                  <div className="row">
                                    <div className="col-md-4 position-relative mb-2">
                                      <div className="radiobtns">
                                        <input
                                          type="radio"
                                          id="home"
                                          value="Home"
                                          checked={value === "Home"}
                                          onChange={(e) =>
                                            onChange(e.target.value)
                                          }
                                          className="d-none"
                                        />
                                        <label
                                          htmlFor="home"
                                          style={{
                                            cursor: "pointer",
                                            transition: "all 0.3s ease",
                                            backgroundColor:
                                              value === "Home"
                                                ? "#f8f9fa"
                                                : "transparent",
                                          }}
                                          onMouseEnter={(e) => {
                                            if (value !== "Home") {
                                              e.target.style.backgroundColor =
                                                "#f8f9fa";
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (value !== "Home") {
                                              e.target.style.backgroundColor =
                                                "transparent";
                                            }
                                          }}
                                        >
                                          {t("Home")}
                                        </label>
                                      </div>
                                    </div>
                                    <div className="col-md-4 position-relative mb-2">
                                      <div className="radiobtns">
                                        <input
                                          type="radio"
                                          id="office"
                                          value="Office"
                                          checked={value === "Office"}
                                          onChange={(e) =>
                                            onChange(e.target.value)
                                          }
                                          className="d-none"
                                        />
                                        <label
                                          htmlFor="office"
                                          style={{
                                            cursor: "pointer",
                                            transition: "all 0.3s ease",
                                            backgroundColor:
                                              value === "Office"
                                                ? "#f8f9fa"
                                                : "transparent",
                                          }}
                                          onMouseEnter={(e) => {
                                            if (value !== "Office") {
                                              e.target.style.backgroundColor =
                                                "#f8f9fa";
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (value !== "Office") {
                                              e.target.style.backgroundColor =
                                                "transparent";
                                            }
                                          }}
                                        >
                                          {t("Office")}
                                        </label>
                                      </div>
                                    </div>
                                    <div className="col-md-4 position-relative">
                                      <div className="radiobtns">
                                        <input
                                          type="radio"
                                          id="other"
                                          value="Other"
                                          checked={value === "Other"}
                                          onChange={(e) =>
                                            onChange(e.target.value)
                                          }
                                          className="d-none"
                                        />
                                        <label
                                          htmlFor="other"
                                          style={{
                                            cursor: "pointer",
                                            transition: "all 0.3s ease",
                                            backgroundColor:
                                              value === "Other"
                                                ? "#f8f9fa"
                                                : "transparent",
                                          }}
                                          onMouseEnter={(e) => {
                                            if (value !== "Other") {
                                              e.target.style.backgroundColor =
                                                "#f8f9fa";
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (value !== "Other") {
                                              e.target.style.backgroundColor =
                                                "transparent";
                                            }
                                          }}
                                        >
                                          {t("Other")}
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              />
                              {errors.addressType && (
                                <div className="text-danger small mt-1">
                                  {errors.addressType.message}
                                </div>
                              )}
                            </div> */}
                            </>

                            <div className="col-md-12 mb-0">
                              <div className="row justify-content-end">
                                {/* <div className="col-md-3 mb-md-0 mb-2">
                                  <button
                                    type="button"
                                    className="authbtns1"
                                    data-bs-dismiss="modal"
                                    onClick={() =>
                                      reset({
                                        fullName: "",
                                        phone: defaultCountryCode,
                                        address: "",
                                        city: "",
                                        email: "",
                                        zipCode: "",
                                        addressType: "Home",
                                        latitude: null,
                                        longitude: null,
                                        countryCode: defaultCountryCode,
                                        country: "",
                                      })
                                    }
                                  >
                                    {t("CANCEL")}
                                  </button>
                                </div> */}
                                <div className="col-auto">
                                  <button
                                    type="submit"
                                    className="authbtns2 opacity-0 p-0 h-auto"
                                    disabled={detectingCountry}
                                    // onClick={() => {
                                    //   if (!selectedAddress?._id) return;
                                    //   makeDefaultAddress(selectedAddress?._id);
                                    // }}
                                    id="buttonSaveAddress"
                                  >
                                    {/* {detectingCountry
                                      ? t("DETECTING...")
                                      : crud
                                        ? t("UPDATE")
                                        : // : t("Continue to Checkout")}
                                          t("Continue")} */}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </form>
                        </div>
                        {/* <p>
                          {t("No addresses found. Please add a new address.")}
                        </p> */}
                      </div>
                    )}
                  {/* {!isLoading &&
                    (!address?.addresses || address.addresses.length === 0) && (   */}
                  {address?.addresses.length > 0 && (
                    <a
                      className="addnewaddresss"
                      data-bs-toggle="modal"
                      data-bs-target="#addaddress"
                      href="#"
                      onClick={handleAddNewAddress}
                    >
                      <img className="me-2" src="assets/img/add.png" alt="" />{" "}
                      {t("Add New Address")}
                    </a>
                  )}
                  {/*  )} */}
                </div>
              </div>
            </div>

            {/* {cartState?.carts?.products?.length >= 1 ? (
              <Coupons categoryId={cartState?.carts?.products} />
            ) : null} */}
            {cartState?.carts?.products?.length >= 1 ? (
              <Coupons
                categoryId={cartState?.carts?.products}
                selectedAddress={selectedAddress}
                makeDefaultAddress={makeDefaultAddress}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="modal fade addtocartmodal needhelpmodal"
        id="addaddress"
        tabIndex={-1}
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body position-relative">
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
              <div className="row">
                <div className="col-md-12 mb-4">
                  <div className="modalhead text-center">
                    <h2>{crud ? t("Edit Address") : t("Add New Address")}</h2>
                    <p>
                      {t(
                        "Submit your address details to complete your order quickly and easily.",
                      )}
                    </p>
                  </div>
                </div>

                <div className="col-md-12 mb-3">
                  <form
                    className="authform row mx-0"
                    onSubmit={handleSubmit(onSubmit)}
                    dir="ltr"
                  >
                    <div className="col-md-12 form-group mb-3">
                      <label className="labelinput">{t("Full Name*")}</label>
                      <div className="position-relative">
                        <Controller
                          name="fullName"
                          control={control}
                          rules={{
                            required: t("Full name is required"),
                            minLength: {
                              value: 2,
                              message: t("Name must be at least 2 characters"),
                            },
                          }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className={`form-control px-3 ${errors.fullName ? "is-invalid" : ""}`}
                              placeholder={t("Enter your full name")}
                            />
                          )}
                        />
                        {errors.fullName && (
                          <div className="invalid-feedback">
                            {errors.fullName.message}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-12 form-group mb-3">
                      <label className="labelinput">{t("Email*")}</label>
                      <div className="position-relative">
                        <Controller
                          name="email"
                          control={control}
                          rules={{
                            required: t("Email is required"),
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: t("Please enter a valid email address"),
                            },
                          }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="email"
                              className={`form-control px-3 ${errors.email ? "is-invalid" : ""}`}
                              placeholder={t("Enter your email")}
                            />
                          )}
                        />
                        {errors.email && (
                          <div className="invalid-feedback">
                            {errors.email.message}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-12 form-group mb-3">
                      <label className="labelinput">{t("Phone Number*")}</label>
                      <div className="position-relative">
                        <Controller
                          name="phone"
                          control={control}
                          rules={{
                            required: t("Phone number is required"),
                          }}
                          render={({ field: { onChange, value } }) => (
                            <PhoneInput
                              country={userCountry}
                              value={value}
                              onChange={(phone, country) => {
                                onChange(phone);
                                setValue("countryCode", "+" + country.dialCode);
                              }}
                              inputProps={{
                                name: "phone",
                                autoFocus: false,
                                placeholder: t("Enter phone number"),
                              }}
                              containerStyle={{
                                width: "100%",
                                margin: "0 auto",
                              }}
                              inputStyle={{
                                width: "100%",
                                height: "50px",
                                fontSize: "16px",
                                paddingLeft: "60px",
                                paddingRight: isRTL ? "60px" : "12px",
                                textAlign: isRTL ? "right" : "left",
                                direction: isRTL ? "rtl" : "ltr",
                                border: errors.phone
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
                                height: "50px",
                                border: errors.phone
                                  ? "1px solid #dc3545"
                                  : "none",
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
                                maxHeight: "150px",
                                zIndex: 1050,
                                textAlign: isRTL ? "right" : "left",
                                direction: isRTL ? "rtl" : "ltr",
                              }}
                              countryCodeEditable={false}
                              enableSearch
                              preferredCountries={[
                                "tr",
                                "sa",
                                "ae",
                                "us",
                                "gb",
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
                          <div className="text-danger small mt-1">
                            {errors.phone.message}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-12 form-group mb-3">
                      <label className="labelinput">{t("Address*")}</label>
                      <div className="position-relative">
                        <Controller
                          name="address"
                          control={control}
                          rules={{
                            required: t("Address is required"),
                            minLength: {
                              value: 10,
                              message: t(
                                "Address must be at least 10 characters",
                              ),
                            },
                          }}
                          render={({ field }) => (
                            <textarea
                              {...field}
                              className={`form-control px-3 ${errors.address ? "is-invalid" : ""}`}
                              placeholder={t(
                                "House no. Building, Street, Area",
                              )}
                              rows="3"
                            />
                          )}
                        />
                        {errors.address && (
                          <div className="invalid-feedback">
                            {errors.address.message}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-4 form-group mb-3">
                      <label className="labelinput">{t("City*")}</label>
                      <div className="position-relative">
                        <Controller
                          name="city"
                          control={control}
                          rules={{
                            required: t("City is required"),
                            minLength: {
                              value: 2,
                              message: t("City must be at least 2 characters"),
                            },
                          }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className={`form-control px-3 ${errors.city ? "is-invalid" : ""}`}
                              placeholder={t("Enter city")}
                            />
                          )}
                        />
                        {errors.city && (
                          <div className="invalid-feedback">
                            {errors.city.message}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-4 form-group mb-3">
                      <label className="labelinput">{t("Zip Code")}</label>
                      <div className="position-relative">
                        <Controller
                          name="zipCode"
                          control={control}
                          rules={{
                            // required: t("Zip code is required"),
                            pattern: {
                              value: /^[0-9]{4,10}$/,
                              message: t(
                                "Please enter a valid zip code (4-10 digits)",
                              ),
                            },
                          }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className={`form-control px-3 ${errors.zipCode ? "is-invalid" : ""}`}
                              placeholder={t("Enter zip code")}
                            />
                          )}
                        />
                        {/* {errors.zipCode && (
                          <div className="invalid-feedback">
                            {errors.zipCode.message}
                          </div>
                        )} */}
                      </div>
                    </div>

                    <div className="col-md-4 form-group mb-3">
                      <label className="labelinput">{t("Country*")}</label>
                      <div className="position-relative">
                        <Controller
                          name="country"
                          control={control}
                          rules={{
                            required: t("Country is required"),
                            minLength: {
                              value: 2,
                              message: t("Enter valid country"),
                            },
                          }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className={`form-control px-3 ${errors.country ? "is-invalid" : ""}`}
                              placeholder={t("Enter Country code")}
                            />
                          )}
                        />
                        {errors.country && (
                          <div className="invalid-feedback">
                            {errors.country.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* <div className="col-md-12 form-group mb-4">
                      <label className="labelinput">{t("Address Type*")}</label>
                      <Controller
                        name="addressType"
                        control={control}
                        rules={{ required: t("Please select address type") }}
                        render={({ field: { onChange, value } }) => (
                          <div className="row">
                            <div className="col-md-4 position-relative mb-2">
                              <div className="radiobtns">
                                <input
                                  type="radio"
                                  id="home"
                                  value="Home"
                                  checked={value === "Home"}
                                  onChange={(e) => onChange(e.target.value)}
                                  className="d-none"
                                />
                                <label
                                  htmlFor="home"
                                  style={{
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    backgroundColor:
                                      value === "Home"
                                        ? "#f8f9fa"
                                        : "transparent",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (value !== "Home") {
                                      e.target.style.backgroundColor =
                                        "#f8f9fa";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (value !== "Home") {
                                      e.target.style.backgroundColor =
                                        "transparent";
                                    }
                                  }}
                                >
                                  {t("Home")}
                                </label>
                              </div>
                            </div>
                            <div className="col-md-4 position-relative mb-2">
                              <div className="radiobtns">
                                <input
                                  type="radio"
                                  id="office"
                                  value="Office"
                                  checked={value === "Office"}
                                  onChange={(e) => onChange(e.target.value)}
                                  className="d-none"
                                />
                                <label
                                  htmlFor="office"
                                  style={{
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    backgroundColor:
                                      value === "Office"
                                        ? "#f8f9fa"
                                        : "transparent",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (value !== "Office") {
                                      e.target.style.backgroundColor =
                                        "#f8f9fa";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (value !== "Office") {
                                      e.target.style.backgroundColor =
                                        "transparent";
                                    }
                                  }}
                                >
                                  {t("Office")}
                                </label>
                              </div>
                            </div>
                            <div className="col-md-4 position-relative">
                              <div className="radiobtns">
                                <input
                                  type="radio"
                                  id="other"
                                  value="Other"
                                  checked={value === "Other"}
                                  onChange={(e) => onChange(e.target.value)}
                                  className="d-none"
                                />
                                <label
                                  htmlFor="other"
                                  style={{
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    backgroundColor:
                                      value === "Other"
                                        ? "#f8f9fa"
                                        : "transparent",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (value !== "Other") {
                                      e.target.style.backgroundColor =
                                        "#f8f9fa";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (value !== "Other") {
                                      e.target.style.backgroundColor =
                                        "transparent";
                                    }
                                  }}
                                >
                                  {t("Other")}
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      />
                      {errors.addressType && (
                        <div className="text-danger small mt-1">
                          {errors.addressType.message}
                        </div>
                      )}
                    </div> */}

                    <div className="col-md-12 mb-0">
                      <div className="row justify-content-end">
                        <div className="col-md-3 mb-md-0 mb-2">
                          <button
                            type="button"
                            className="authbtns1"
                            data-bs-dismiss="modal"
                            onClick={() =>
                              reset({
                                fullName: "",
                                phone: defaultCountryCode,
                                address: "",
                                city: "",
                                email: "",
                                zipCode: "",
                                addressType: "Home",
                                latitude: null,
                                longitude: null,
                                countryCode: defaultCountryCode,
                                country: "",
                              })
                            }
                          >
                            {t("CANCEL")}
                          </button>
                        </div>
                        <div className="col-md-3">
                          <button
                            type="submit"
                            className="authbtns2"
                            disabled={detectingCountry}
                          >
                            {detectingCountry
                              ? t("DETECTING...")
                              : crud
                                ? t("UPDATE")
                                : t("SAVE")}
                          </button>
                        </div>
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

export default Address;
