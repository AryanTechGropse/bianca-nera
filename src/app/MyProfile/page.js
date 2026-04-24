"use client";
import React, { useState, useEffect } from "react";
import Header from "@/header/Header";
import Footer from "@/footer/Footer";
import ProfileSidebar from "@/app/HomeComponents/ProfileSidebar";
import { useSelector, useDispatch } from "react-redux";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import { getProfile } from "@/store/serviceSlices/commonSlice";
import i18next, { t } from "i18next";
import i18n from "@/i18n/i18n";

const MyProfile = () => {
  const isRTL = i18n.dir() === "rtl";
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => ({
    profile: state?.commonSlice?.profile,
  }));

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    countryCode: "+971",
    email: "",
    dob: "",
    profileImage: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        phoneNumber: profile.phoneNumber || "",
        countryCode: profile.countryCode || "+971",
        email: profile.email || "",
        dob: profile.dob
          ? new Date(profile.dob).toISOString().split("T")[0]
          : "",
        profileImage: profile.profileImage || "",
      });
      setImagePreview(profile.profileImage || "");
      setImageFile(null);
    }
  }, [profile]);

  // Validation patterns
  const validationPatterns = {
    fullName: /^[a-zA-Z\s]{2,50}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phoneNumber: /^[0-9]{7,15}$/,
    dob: /^\d{4}-\d{2}-\d{2}$/,
  };

  // Validate individual field
  const validateField = (name, value) => {
    if (!value.trim() && (name === "fullName" || name === "email")) {
      return name === "fullName"
        ? t("Full name is required")
        : t("Email is required");
    }

    if (
      value.trim() &&
      validationPatterns[name] &&
      !validationPatterns[name].test(value)
    ) {
      if (name === "fullName")
        return t(
          "Full name must contain only letters and spaces (2-50 characters)",
        );
      if (name === "email") return t("Please enter a valid email address");
      if (name === "phoneNumber")
        return t("Phone number must contain 7-15 digits only");
      if (name === "dob") return t("Please enter a valid date of birth");
    }

    // Age validation for DOB
    if (name === "dob" && value) {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      if (age < 13) {
        return t("You must be at least 13 years old");
      }

      if (birthDate > today) {
        return t("Date of birth cannot be in the future");
      }
    }

    return "";
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle blur event for validation
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};

    // Only validate required fields and fields with values
    const fieldsToValidate = ["fullName", "email"];

    fieldsToValidate.forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    // Validate optional fields only if they have values
    ["phoneNumber", "dob"].forEach((key) => {
      if (formData[key] && formData[key].trim()) {
        const error = validateField(key, formData[key]);
        if (error) {
          newErrors[key] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          profileImage: t("Please select a valid image file (JPEG, PNG, WebP)"),
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          profileImage: t("Image size should be less than 5MB"),
        }));
        return;
      }

      // Store file and create preview URL for display
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.profileImage;
          return newErrors;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle edit mode
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form data
      if (profile) {
        setFormData({
          fullName: profile.fullName || "",
          phoneNumber: profile.phoneNumber || "",
          countryCode: profile.countryCode || "+971",
          email: profile.email || "",
          dob: profile.dob
            ? new Date(profile.dob).toISOString().split("T")[0]
            : "",
          profileImage: profile.profileImage || "",
        });
        setImagePreview(profile.profileImage || "");
      }
      setImageFile(null);
      setErrors({});
    }
    setIsEditing(!isEditing);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API using FormData for binary image upload
      const formDataObj = new FormData();
      formDataObj.append("fullName", formData.fullName.trim());
      formDataObj.append("phoneNumber", formData.phoneNumber.trim());
      formDataObj.append("countryCode", formData.countryCode);
      formDataObj.append("email", formData.email.trim());
      formDataObj.append(
        "dob",
        formData.dob ? new Date(formData.dob).toISOString() : "",
      );

      // Append image file as binary if a new image was selected
      if (imageFile) {
        formDataObj.append("profile_image", imageFile);
      }

      const response = await callMiddleWare({
        method: "PUT",
        endpoint: "user/updateProfile",
        data: formDataObj,
      });

      if (!response?.error) {
        setIsEditing(false);
        setImageFile(null);
        setErrors({});
        dispatch(getProfile());
        // Show success message
        alert(t("Profile updated successfully!"));
      } else {
        setErrors({
          submit:
            response.message || t("Failed to update profile. Please try again."),
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrors({
        submit:
          error.message || t("Failed to update profile. Please try again."),
      });
    } finally {
      setLoading(false);
    }
  };

  // Country codes with flags
  const countryCodes = [
    { code: "+91", flag: "IN", country: "India" },
    { code: "+966", flag: "SA", country: "Saudi Arabia" },
    { code: "+971", flag: "AE", country: "UAE" },
    { code: "+1", flag: "US", country: "USA" },
    { code: "+44", flag: "GB", country: "UK" },
    { code: "+61", flag: "AU", country: "Australia" },
    { code: "+81", flag: "JP", country: "Japan" },
    { code: "+49", flag: "DE", country: "Germany" },
    { code: "+33", flag: "FR", country: "France" },
    { code: "+39", flag: "IT", country: "Italy" },
  ];

  const language =
    typeof window !== "undefined"
      ? localStorage.getItem("i18nextLng") || "en"
      : "en";

  useEffect(() => {
    const seoTitle =
      language === "ar"
        ? `ملفي الشخصي | خصصي حسابك – بيانكا نيرا`
        : `My Profile | Personalize Your – Bianca Nera Account`;
    document.title = seoTitle;
  }, [language]);

  return (
    <>
      <Header />
      <div className="myprofilepage py-lg-5 py-md-4 py-4">
        <div className="container">
          <div className="row">
            <ProfileSidebar />
            <div className="col-auto profilerightcol">
              <div className="profilerightpart">
                <div className="row mb-4 align-items-center">
                  <div className="col">
                    <div className="profileheadings">
                      <h2>{t("myProfile.title")}</h2>
                      <p>{t("myProfile.profileDes")}</p>
                    </div>
                  </div>
                  <div className="col-md-auto mt-md-0 mt-2 proflebtns">
                    <button
                      className="authbtns1"
                      type="button"
                      onClick={handleEditToggle}
                      disabled={loading}
                    >
                      {isEditing
                        ? t("myProfile.cancel")
                        : t("myProfile.editProfile")}
                    </button>
                  </div>
                </div>

                {/* Error message for form submission */}
                {errors.submit && (
                  <div className="alert alert-danger mb-3" role="alert">
                    {errors.submit}
                  </div>
                )}

                <div className="row">
                  <div className="col-md-12">
                    <form className="authform row" onSubmit={handleSubmit}>
                      {/* Profile Picture */}
                      <div className="col-md-12 mb-3">
                        <div className="uploadprofilepic position-relative d-inline-block">
                          <div className="showpic">
                            <img
                              src={
                                imagePreview ||
                                formData.profileImage ||
                                "/assets/img/user.jpg"
                              }
                              alt="Profile"
                              style={{
                                width: "120px",
                                height: "120px",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                          {isEditing && (
                            <>
                              <label
                                className="editbtnprofile"
                                htmlFor="profileImageInput"
                              >
                                <img src="/assets/img/edit.png" alt="Edit" />
                              </label>
                              <input
                                type="file"
                                id="profileImageInput"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleImageUpload}
                                style={{ display: "none" }}
                              />
                            </>
                          )}
                        </div>
                        {errors.profileImage && (
                          <div className="text-danger small mt-1">
                            {errors.profileImage}
                          </div>
                        )}
                      </div>

                      {/* Full Name */}
                      <div className="col-md-6 form-group mb-3">
                        <label className="labelinput" htmlFor="fullName">
                          {t("Full Name*")}
                        </label>
                        <div className="position-relative">
                          <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            className={`form-control px-3 ${errors.fullName ? "is-invalid" : ""}`}
                            placeholder={t("Enter name")}
                            value={formData.fullName}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            disabled={!isEditing}
                            maxLength="50"
                          />
                          {errors.fullName && (
                            <div className="invalid-feedback">
                              {errors.fullName}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mobile Number */}
                      <div className="col-md-6 form-group mb-3">
                        <label className="labelinput" htmlFor="phoneNumber">
                          {t("Mobile Number")}
                        </label>
                        <div className="row">
                          <div className="col-auto pe-0">
                            <div className="countrycode">
                              <select
                                name="countryCode"
                                className={`form-select`}
                                id="countryCode"
                                value={formData.countryCode}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                              >
                                {countryCodes.map((country) => (
                                  <option
                                    className={`${isRTL ? "text-end" : "text-start"}`}
                                    key={country.code}
                                    value={country.code}
                                  >
                                    {country.code}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="col">
                            <div className="position-relative">
                              <input
                                type="tel"
                                id="phoneNumber"
                                name="phoneNumber"
                                className={`form-control ${errors.phoneNumber ? "is-invalid" : ""}`}
                                placeholder={t("Enter phone number")}
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                disabled={!isEditing}
                                maxLength="15"
                              />
                              <img
                                className="inputicon"
                                src="/assets/img/phone.png"
                                alt=""
                              />
                              {errors.phoneNumber && (
                                <div className="invalid-feedback">
                                  {errors.phoneNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="col-md-6 form-group mb-3">
                        <label className="labelinput" htmlFor="email">
                          {t("myProfile.email")}*
                        </label>
                        <div className="position-relative">
                          <input
                            type="email"
                            id="email"
                            name="email"
                            className={`form-control px-3 ${errors.email ? "is-invalid" : ""}`}
                            placeholder={t("Email Id")}
                            value={formData.email}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            disabled={!isEditing}
                            maxLength="100"
                          />
                          {errors.email && (
                            <div className="invalid-feedback">
                              {errors.email}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Date of Birth */}
                      <div className="col-md-6 form-group mb-3">
                        <label className="labelinput" htmlFor="dob">
                          {t("myProfile.dob")}
                        </label>
                        <div className="position-relative">
                          <input
                            type="date"
                            id="dob"
                            name="dob"
                            className={`form-control px-5 ${errors.dob ? "is-invalid" : ""}`}
                            placeholder={t("Date of Birth")}
                            value={formData.dob}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            // disabled={!isEditing}
                            max={new Date().toISOString().split("T")[0]}
                            disabled
                          />
                          {errors.dob && (
                            <div className="invalid-feedback">
                              {errors.dob}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Save Button */}
                      {isEditing && (
                        <div className="col-md-12 form-group mb-3 text-center mt-md-4 mt-2">
                          <button
                            type="submit"
                            className="authbtns2 px-md-5 d-md-inline-flex w-auto"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                                {t("Saving...")}
                              </>
                            ) : (
                              t("Save Changes")
                            )}
                          </button>
                        </div>
                      )}

                      {/* Form validation summary */}
                      {isEditing && Object.keys(errors).length > 0 && (
                        <div className="col-md-12">
                          <div className="alert alert-danger mt-3">
                            <strong>
                              {t("Please fix the following errors:")}
                            </strong>
                            <ul className="mb-0 mt-2">
                              {Object.entries(errors).map(([field, error]) => (
                                <li key={field}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyProfile;
