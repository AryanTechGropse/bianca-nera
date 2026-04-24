"use client";
import React, { useEffect, useState } from "react";
import Header from "@/header/Header";
import ProfileSidebar from "@/app/HomeComponents/ProfileSidebar";
import Footer from "@/footer/Footer";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import Link from "next/link";
import { t } from "i18next";
import { useSelector } from "react-redux";
import i18n from "@/i18n/i18n";

const Career = () => {
  const isRTL = i18n.dir() === "rtl";
  const { isUserLoggedIn } = useSelector((state) => ({
    isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
  }));

  const [jobs, setJobs] = useState([]);
  const [jobRequests, setJobRequests] = useState([]);
  const [loading, setLoading] = useState({
    jobs: true,
    requests: true,
  });
  const [error, setError] = useState({
    jobs: null,
    requests: null,
  });
  const [activeTab, setActiveTab] = useState("available-jobs");
  const [emailSearch, setEmailSearch] = useState("");

  // Fetch available jobs
  const getCareerJobs = async () => {
    try {
      setLoading((prev) => ({ ...prev, jobs: true }));
      setError((prev) => ({ ...prev, jobs: null }));

      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "/analytics/getJobs",
        data: {
          search: emailSearch,
          page: 1,
          pageSize: 10,
        },
      });

      if (response && response.results.jobs) {
        setJobs(response.results.jobs);
      }
    } catch (error) {
      console.error("Jobs error:", error);
      setError((prev) => ({
        ...prev,
        jobs: error?.message || t("Failed to fetch jobs"),
      }));
    } finally {
      setLoading((prev) => ({ ...prev, jobs: false }));
    }
  };

  // Fetch job requests
  const getJobRequests = async () => {
    try {
      setLoading((prev) => ({ ...prev, requests: true }));
      setError((prev) => ({ ...prev, requests: null }));

      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "/analytics/getJobRequests",
        data: {
          search: emailSearch,
        },
      });

      if (response.results && response.results.jobs) {
        setJobRequests(response.results.jobs);
      }
    } catch (error) {
      console.error("Job requests error:", error);
      setError((prev) => ({
        ...prev,
        requests: error?.message || t("Failed to fetch job requests"),
      }));
    } finally {
      setLoading((prev) => ({ ...prev, requests: false }));
    }
  };

  useEffect(() => {
    getCareerJobs();
  }, []);

  useEffect(() => {
    if (activeTab === "my-job-requests") {
      getJobRequests();
    }
  }, [activeTab, emailSearch]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleEmailSearch = (e) => {
    setEmailSearch(e.target.value);
  };

  const getJobTypeClass = (mode) => {
    switch (mode) {
      case "remote":
        return t("Remote");
      case "hybrid":
        return t("Hybrid");
      case "onsite":
        return t("On-site");
      default:
        return t("Full time");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Accepted":
        return "requestacceptet";
      case "Interviewing":
        return "requestacceptet interviewing";
      case "Rejected":
        return "requestacceptet rejected";
      default:
        return "requestacceptet";
    }
  };

  const formatDate = (dateString) => {
    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const language =
    typeof window !== "undefined"
      ? localStorage.getItem("i18nextLng") || "en"
      : "en";

  useEffect(() => {
    const seoTitle =
      language === "ar"
        ? `وظائف بيانكا نيرا | أكثر من 25 فرصة مميزة`
        : `Careers at Bianca Nera | 25+ Exciting Opportunities`;
    document.title = seoTitle;
  }, [language]);

  const JobSkeleton = () => (
    <div className="col-md-6 mb-3">
      <div className="careersbox position-relative d-block skeleton-container">
        <div
          className="skeleton-text"
          style={{ width: "70%", height: "24px" }}
        ></div>
        <div
          className="skeleton-text mt-2"
          style={{ width: "50%", height: "18px" }}
        ></div>
        <div className="d-flex mt-3">
          <div
            className="skeleton-pill me-2"
            style={{ width: "80px", height: "28px" }}
          ></div>
          <div
            className="skeleton-pill"
            style={{ width: "80px", height: "28px" }}
          ></div>
        </div>
      </div>
    </div>
  );

  const JobRequestSkeleton = () => (
    <div className="col-md-6 mb-3">
      <div className="careersbox position-relative d-block skeleton-container">
        <div
          className="skeleton-pill mb-2"
          style={{ width: "100px", height: "24px" }}
        ></div>
        <div
          className="skeleton-text"
          style={{ width: "80%", height: "24px" }}
        ></div>
        <div
          className="skeleton-text mt-2"
          style={{ width: "60%", height: "18px" }}
        ></div>
      </div>
    </div>
  );

  const JobItem = ({ job }) => {
    return (
      <div className="col-md-6 mb-3">
        <Link
          href={`/Career/${job._id}`}
          className="careersbox position-relative d-block"
        >
          <div className="carreerpost pt-2">
            {isRTL
              ? job.profile_ar || t("Position")
              : job.profile_en || t("Position")}
          </div>
          <div className="location">
            {t("Location")}: <span>{job.location || t("Not specified")}</span>
          </div>
          <div className="d-flex mt-3">
            <div className="jobtype">{getJobTypeClass(job.mode)}</div>
          </div>
          {job?.isApplied ? (
            <span className="badge bg-success text-dark position-absolute">
              {t("Applied")}
            </span>
          ) : null}
        </Link>
      </div>
    );
  };

  const JobRequestItem = ({ request }) => (
    <div className="col-md-6 mb-3">
      <div className="careersbox position-relative d-block">
        <div className={getStatusBadgeClass(request.status)}>
          {t(request.status)}
        </div>
        <div className="carreerpost">
          {request.jobId?.profile_en || t("Position not specified")}
        </div>
        <div className="location">
          {t("Applied")}: <span>{formatDate(request.updatedAt)}</span>
        </div>
        <div className="mt-2">
          <small className="text-muted">
            {t("Request ID")}: {request._id}
          </small>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Header />
      <div className="myprofilepage py-lg-5 py-md-4 py-4">
        <div className="container">
          <div className="row">
            <ProfileSidebar />
            <div className="col-auto profilerightcol">
              <div className="profilerightpart">
                <div className="row mb-md-4 mb-2 align-items-center">
                  <div className="col">
                    <div className="profileheadings">
                      <h2>{t("Careers")}</h2>
                      <p>
                        {t(
                          "Unlock endless opportunities to learn, grow, and build a successful career.",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="careerstabs">
                    <nav>
                      <div className="nav nav-tabs" id="nav-tab" role="tablist">
                        <button
                          className={`nav-link ${activeTab === "available-jobs" ? "active" : ""}`}
                          onClick={() => handleTabChange("available-jobs")}
                          type="button"
                        >
                          {t("Available Jobs")}
                        </button>
                        <button
                          className={`nav-link ${activeTab === "my-job-requests" ? "active" : ""}`}
                          onClick={() => handleTabChange("my-job-requests")}
                          type="button"
                        >
                          {t("My Job Requests")}
                        </button>
                      </div>
                    </nav>

                    <div className="tab-content mt-4" id="nav-tabContent">
                      {activeTab === "available-jobs" ? (
                        <div className="tab-pane fade show active">
                          {error.jobs ? (
                            <div className="alert alert-danger" role="alert">
                              {error.jobs}
                              <button
                                className="btn btn-sm btn-outline-danger ms-3"
                                onClick={getCareerJobs}
                              >
                                {t("Try Again")}
                              </button>
                            </div>
                          ) : loading.jobs ? (
                            <div className="row">
                              {[...Array(6)].map((_, index) => (
                                <JobSkeleton key={index} />
                              ))}
                            </div>
                          ) : jobs.length > 0 ? (
                            <div className="row">
                              {jobs.map((job) => (
                                <JobItem key={job._id} job={job} />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-5">
                              <h4>{t("No jobs available at the moment")}</h4>
                              <p>
                                {t("Please check back later for new opportunities.")}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="tab-pane fade show active">
                          {!isUserLoggedIn && (
                            <div className="mb-4">
                              <div className="row">
                                <div className="col-md-12">
                                  <label
                                    htmlFor="emailSearch"
                                    className="form-label"
                                  >
                                    {t("Search by Email")}
                                  </label>
                                  <input
                                    type="email"
                                    className="form-control"
                                    id="emailSearch"
                                    placeholder={t(
                                      "Enter email to search job requests",
                                    )}
                                    value={emailSearch}
                                    onChange={handleEmailSearch}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {error.requests ? (
                            <div className="alert alert-danger" role="alert">
                              {error.requests}
                              <button
                                className="btn btn-sm btn-outline-danger ms-3"
                                onClick={getJobRequests}
                              >
                                {t("Try Again")}
                              </button>
                            </div>
                          ) : loading.requests ? (
                            <div className="row">
                              {[...Array(4)].map((_, index) => (
                                <JobRequestSkeleton key={index} />
                              ))}
                            </div>
                          ) : jobRequests.length > 0 ? (
                            <div className="row">
                              {jobRequests.map((request) => (
                                <JobRequestItem
                                  key={request._id}
                                  request={request}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-5">
                              <h4>{t("No job applications yet")}</h4>
                              <p>
                                {t("Apply to jobs to see your applications here.")}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <style jsx>{`
        .skeleton-container {
          padding: 20px;
          border-radius: 8px;
          background-color: #fff;
        }
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
        .skeleton-pill {
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 20px;
        }
        .requestacceptet {
          display: inline-block;
          padding: 4px 12px;
          background-color: #d4edda;
          color: #155724;
          border-radius: 4px;
          font-size: 12px;
          margin-bottom: 10px;
        }
        .requestacceptet.interviewing {
          background-color: #fff3cd;
          color: #856404;
        }
        .requestacceptet.rejected {
          background-color: #f8d7da;
          color: #721c24;
        }
        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        .careersbox {
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          transition: all 0.3s ease;
          color: #333;
          text-decoration: none;
          display: block;
          background-color: #fff;
          height: 100%;
        }
        .careersbox:hover {
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
          color: #333;
          text-decoration: none;
        }
        .carreerpost {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .location {
          color: #666;
          font-size: 14px;
        }
        .jobtype {
          padding: 4px 12px;
          background-color: #f0f0f0;
          border-radius: 20px;
          font-size: 12px;
          margin-right: 8px;
        }
        .nav-tabs {
          border-bottom: 1px solid #dee2e6;
        }
        .nav-tabs .nav-link {
          color: #666;
          font-weight: 500;
          border: none;
          padding: 10px 20px;
        }
        .nav-tabs .nav-link.active {
          color: #0d6efd;
          border-bottom: 3px solid #0d6efd;
          background: transparent;
        }
        .nav-tabs .nav-link:not(.active):hover {
          border-bottom: 3px solid #dee2e6;
        }
      `}</style>
    </>
  );
};

export default Career;
