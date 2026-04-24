"use client";
import React, { useCallback, useEffect, useState } from "react";
import Header from "@/header/Header";
import ProfileSidebar from "@/app/HomeComponents/ProfileSidebar";
import { useDispatch, useSelector } from "react-redux";
import { getAddress } from "@/store/serviceSlices/commonSlice";
import toast from "react-hot-toast";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import { useForm, Controller } from "react-hook-form";
import { parsePhoneNumber } from "libphonenumber-js";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { t } from "i18next";
import Footer from "@/footer/Footer";

const SavedAddress = () => {
  const dispatch = useDispatch();
  const [crud, setCrud] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressId, setAddressId] = useState(null);

  const { address, isLoading } = useSelector((state) => ({
    address: state?.commonSlice?.address,
    isLoading: state?.commonSlice?.isLoading,
  }));

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
      city: "",
      zipCode: "",
      addressType: "Home",
      latitude: null,
      longitude: null,
      country: "",
    },
  });

  useEffect(() => {
    dispatch(getAddress());
  }, [dispatch]);

  const onSubmit = useCallback(
    async (data) => {
      try {
        const phoneStr = data.phone.startsWith("+")
          ? data.phone
          : `+${data.phone}`;
        const parsedNumber = parsePhoneNumber(phoneStr);

        if (!parsedNumber || !parsedNumber.isValid()) {
          throw new Error(t("Invalid phone number format."));
        }

        const addressData = {
          name: data.fullName.trim(),
          phoneNumber: parsedNumber.nationalNumber,
          countryCode: `+${parsedNumber.countryCallingCode}`,
          address: data.address.trim(),
          city: data.city.trim(),
          zipCode: data.zipCode.trim(),
          type: data.addressType,
          latitude: data.latitude,
          longitude: data.longitude,
          isDefault: false,
          country: data.country.trim(),
          addressId: addressId || "",
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
              t("Failed to save address"),
          );
        }

        toast.success(response?.message || t("Address saved successfully"));
        reset();
        dispatch(getAddress());
        setCrud(false);
        setEditingAddress(null);
        setAddressId("");

        // Close modal using bootstrap data API
        if (typeof window !== "undefined") {
          const modalId = crud ? "editaddress" : "addaddress";
          const modalElement = document.getElementById(modalId);
          if (modalElement && window.bootstrap) {
            const modal = window.bootstrap.Modal.getInstance(modalElement);
            modal?.hide();
          }
        }
      } catch (error) {
        console.error("Save address error:", error);
        toast.error(error?.message || t("Failed to save address"));
      }
    },
    [crud, reset, dispatch, addressId],
  );

  const removeAddress = async (id) => {
    if (window.confirm(t("Are you sure you want to delete this address?"))) {
      try {
        const response = await callMiddleWare({
          method: "delete",
          endpoint: "user/deleteAddress",
          id,
        });
        if (!response?.error) {
          dispatch(getAddress());
          toast.success(response?.message || t("Address deleted successfully"));
        }
      } catch (error) {
        toast.error(t("Failed to delete address"));
      }
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
      }
    } catch (error) {
      toast.error(t("Failed to set default address"));
    }
  };

  const handleEditAddress = (item) => {
    setCrud(true);
    setEditingAddress(item);
    setValue("fullName", item.name || "");
    setValue("phone", `${item.countryCode}${item.phoneNumber}` || "");
    setValue("address", item.address || "");
    setValue("city", item.city || "");
    setValue("zipCode", item.zipCode || "");
    setValue("addressType", item.type || "Home");
    setValue("latitude", item.latitude || null);
    setValue("longitude", item.longitude || null);
    setValue("country", item.country || "");
    setAddressId(item._id);
  };

  const handleAddNewAddress = () => {
    setCrud(false);
    setEditingAddress(null);
    reset({
      fullName: "",
      phone: "",
      address: "",
      city: "",
      zipCode: "",
      addressType: "Home",
      latitude: null,
      longitude: null,
      country: "",
    });
  };

  const language =
    typeof window !== "undefined"
      ? localStorage.getItem("i18nextLng") || "en"
      : "en";

  useEffect(() => {
    const seoTitle =
      language === "ar"
        ? `العناوين المحفوظة | الدفع بنقرة واحدة – بيانكا نيرا`
        : `Saved Addresses | Checkout in 1 Click – Bianca Nera`;
    document.title = seoTitle;
  }, [language]);

  return (
    <>
      <Header />
      <div className="myprofilepage py-lg-5 py-md-4 py-4">
        <div className="container">
          <div className="row">
            <ProfileSidebar />
            <div className="col-auto profilerightcol" dir="ltr">
              <div className="profilerightpart" dir="ltr">
                <div className="row mb-4 align-items-center">
                  <div className="col">
                    <div className="profileheadings">
                      <h2>{t("My Saved Address")}</h2>
                      <p>
                        {t(
                          "Access and manage all your saved addresses easily in one place for quick and hassle-free use.",
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-auto mt-md-0 mt-2 proflebtns">
                    <button
                      className="authbtns1"
                      data-bs-toggle="modal"
                      data-bs-target="#addaddress"
                      onClick={handleAddNewAddress}
                    >
                      {t("ADD NEW")}
                    </button>
                  </div>
                </div>

                <div className="row">
                  {isLoading ? (
                    [...Array(3)].map((_, index) => (
                      <div className="col-md-12 mb-4" key={index}>
                        <div
                          className="skeleton-loader p-4 w-100 h-100 border rounded bg-light"
                          style={{ height: "150px" }}
                        ></div>
                      </div>
                    ))
                  ) : address?.addresses?.length > 0 ? (
                    address.addresses.map((item) => (
                      <div className="col-md-12 mb-4" key={item._id}>
                        <div
                          className={`deliveryaddressbox ${item.isDefault ? "active" : ""}`}
                        >
                          <div className="radiobtns mb-2">
                            <input
                              type="radio"
                              className="d-none"
                              id={item._id}
                              name="address"
                              checked={item.isDefault}
                              onChange={() => makeDefaultAddress(item._id)}
                            />
                            <label htmlFor={item._id}>{t(item.name)}</label>
                          </div>
                          <div className="deliveryaddressinner mb-3">
                            <div className="addreestext">
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
                          </div>
                          <div className="deliveractions">
                            <div className="row">
                              <div className="col-6">
                                <a
                                  className="d-flex me-0"
                                  href="javascript:;"
                                  data-bs-toggle="modal"
                                  data-bs-target="#editaddress"
                                  onClick={() => handleEditAddress(item)}
                                >
                                  {t("Edit")}
                                </a>
                              </div>
                              <div className="col-6">
                                <a
                                  className="d-flex me-0"
                                  onClick={() => removeAddress(item._id)}
                                >
                                  {t("Delete")}
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-md-12">
                      <div className="text-center py-5">
                        <h5>{t("No Saved Addresses")}</h5>
                        <p className="text-muted">
                          {t(
                            "You haven't saved any addresses yet. Add your first address to get started.",
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Add Address Modal */}
      <div
        className="modal fade addtocartmodal needhelpmodal"
        id="addaddress"
        tabIndex={-1}
        aria-labelledby="addAddressLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body position-relative">
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label={t("Close")}
              />
              <div className="row">
                <div className="col-md-12 mb-4">
                  <div className="modalhead text-center">
                    <h2>{t("Add New Address")}</h2>
                    <p>
                      {t("Submit your address details to save for future use.")}
                    </p>
                  </div>
                </div>
                <div className="col-md-12 mb-3" dir="ltr">
                  <form
                    className="authform row mx-0"
                    onSubmit={handleSubmit(onSubmit)}
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
                      <label className="labelinput">{t("Phone Number*")}</label>
                      <div className="position-relative">
                        <Controller
                          name="phone"
                          control={control}
                          rules={{ required: t("Phone number is required") }}
                          render={({ field: { onChange, value } }) => (
                            <PhoneInput
                              country={"sa"}
                              value={value}
                              onChange={(phone) => onChange(phone)}
                              inputStyle={{
                                width: "100%",
                                height: "50px",
                                fontSize: "16px",
                                paddingLeft: "60px",
                                border: errors.phone
                                  ? "1px solid #dc3545"
                                  : "1px solid #ced4da",
                                borderRadius: "0.375rem",
                              }}
                              buttonStyle={{
                                border: errors.phone
                                  ? "1px solid #dc3545"
                                  : "1px solid #ced4da",
                                borderRadius: "0.375rem 0 0 0.375rem",
                              }}
                              dropdownStyle={{ maxHeight: "150px" }}
                              placeholder={t("Enter phone number")}
                            />
                          )}
                        />
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
                              value: 5,
                              message: t("Address must be at least 5 characters"),
                            },
                          }}
                          render={({ field }) => (
                            <textarea
                              {...field}
                              className={`form-control px-3 ${errors.address ? "is-invalid" : ""}`}
                              placeholder={t("House no. Building, Street, Area")}
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
                          rules={{ required: t("City is required") }}
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
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className={`form-control px-3 ${errors.zipCode ? "is-invalid" : ""}`}
                              placeholder={t("Zip code")}
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className="col-md-4 form-group mb-3">
                      <label className="labelinput">{t("Country*")}</label>
                      <div className="position-relative">
                        <Controller
                          name="country"
                          control={control}
                          rules={{ required: t("Country is required") }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className={`form-control px-3 ${errors.country ? "is-invalid" : ""}`}
                              placeholder={t("Country")}
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

                    <div className="col-md-12 mb-0 mt-3">
                      <div className="row justify-content-end">
                        <div className="col-md-4 mb-2">
                          <button
                            type="button"
                            className="authbtns1 w-100"
                            data-bs-dismiss="modal"
                          >
                            {t("CANCEL")}
                          </button>
                        </div>
                        <div className="col-md-4">
                          <button type="submit" className="authbtns2 w-100">
                            {t("SAVE")}
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

      {/* Edit Address Modal */}
      <div
        className="modal fade addtocartmodal needhelpmodal"
        id="editaddress"
        tabIndex={-1}
        aria-labelledby="editAddressLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body position-relative">
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label={t("Close")}
              />
              <div className="row">
                <div className="col-md-12 mb-4">
                  <div className="modalhead text-center">
                    <h2>{t("Edit Address")}</h2>
                    <p>{t("Update your address details.")}</p>
                  </div>
                </div>
                <div className="col-md-12 mb-3" dir="ltr">
                  <form
                    className="authform row mx-0"
                    onSubmit={handleSubmit(onSubmit)}
                  >
                    <div className="col-md-12 form-group mb-3">
                      <label className="labelinput">{t("Full Name*")}</label>
                      <div className="position-relative">
                        <Controller
                          name="fullName"
                          control={control}
                          rules={{ required: t("Full name is required") }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className={`form-control px-3 ${errors.fullName ? "is-invalid" : ""}`}
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className="col-md-12 form-group mb-3">
                      <label className="labelinput">{t("Phone Number*")}</label>
                      <div className="position-relative">
                        <Controller
                          name="phone"
                          control={control}
                          rules={{ required: t("Phone number is required") }}
                          render={({ field: { onChange, value } }) => (
                            <PhoneInput
                              country={"sa"}
                              value={value}
                              onChange={(phone) => onChange(phone)}
                              inputStyle={{
                                width: "100%",
                                height: "50px",
                                paddingLeft: "60px",
                              }}
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className="col-md-12 form-group mb-3">
                      <label className="labelinput">{t("Address*")}</label>
                      <div className="position-relative">
                        <Controller
                          name="address"
                          control={control}
                          rules={{ required: t("Address is required") }}
                          render={({ field }) => (
                            <textarea
                              {...field}
                              className="form-control px-3"
                              rows="3"
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className="col-md-4 form-group mb-3">
                      <label className="labelinput">{t("City*")}</label>
                      <Controller
                        name="city"
                        control={control}
                        render={({ field }) => (
                          <input {...field} type="text" className="form-control" />
                        )}
                      />
                    </div>
                    <div className="col-md-4 form-group mb-3">
                      <label className="labelinput">{t("Zip Code")}</label>
                      <Controller
                        name="zipCode"
                        control={control}
                        render={({ field }) => (
                          <input {...field} type="text" className="form-control" />
                        )}
                      />
                    </div>
                    <div className="col-md-4 form-group mb-3">
                      <label className="labelinput">{t("Country*")}</label>
                      <Controller
                        name="country"
                        control={control}
                        render={({ field }) => (
                          <input {...field} type="text" className="form-control" />
                        )}
                      />
                    </div>

                    <div className="col-md-12 mb-0 mt-3">
                      <div className="row justify-content-end">
                        <div className="col-md-4 mb-2">
                          <button
                            type="button"
                            className="authbtns1 w-100"
                            data-bs-dismiss="modal"
                          >
                            {t("CANCEL")}
                          </button>
                        </div>
                        <div className="col-md-4">
                          <button type="submit" className="authbtns2 w-100">
                            {t("SAVE")}
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

export default SavedAddress;
