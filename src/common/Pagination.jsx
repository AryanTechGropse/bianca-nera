"use client";
import React from "react";
import { t } from "i18next";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  maxPageButtons = 5,
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const halfWay = Math.ceil(maxPageButtons / 2);
    let startPage = Math.max(1, currentPage - halfWay + 1);
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    if (page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div className="pagination-container d-flex justify-content-center align-items-center mt-4 mb-3">
      <nav aria-label="Page navigation">
        <ul className="pagination mb-0">
          {/* Previous Button */}
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={handlePrevious}
              disabled={currentPage === 1}
              aria-label={t("Previous")}
            >
              <span aria-hidden="true">&laquo;</span>
            </button>
          </li>

          {/* First Page */}
          {showPageNumbers && getPageNumbers()[0] > 1 && (
            <>
              <li className="page-item">
                <button
                  className="page-link"
                  onClick={() => handlePageClick(1)}
                >
                  1
                </button>
              </li>
              {getPageNumbers()[0] > 2 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}
            </>
          )}

          {/* Page Numbers */}
          {showPageNumbers &&
            getPageNumbers().map((page) => (
              <li
                key={page}
                className={`page-item ${currentPage === page ? "active" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageClick(page)}
                >
                  {page}
                </button>
              </li>
            ))}

          {/* Last Page */}
          {showPageNumbers &&
            getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
              <>
                {getPageNumbers()[getPageNumbers().length - 1] <
                  totalPages - 1 && (
                  <li className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                )}
                <li className="page-item">
                  <button
                    className="page-link"
                    onClick={() => handlePageClick(totalPages)}
                  >
                    {totalPages}
                  </button>
                </li>
              </>
            )}

          {/* Next Button */}
          <li
            className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
          >
            <button
              className="page-link"
              onClick={handleNext}
              disabled={currentPage === totalPages}
              aria-label={t("Next")}
            >
              <span aria-hidden="true">&raquo;</span>
            </button>
          </li>
        </ul>
      </nav>

      <style jsx>{`
        .pagination-container {
          user-select: none;
        }

        .pagination .page-link {
          color: #333;
          background-color: #fff;
          border: 1px solid #dee2e6;
          padding: 0.5rem 0.75rem;
          margin: 0 2px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .pagination .page-link:hover:not(.disabled) {
          background-color: #e9ecef;
          border-color: #dee2e6;
          color: #333;
        }

        .pagination .page-item.active .page-link {
          background-color: #000000 !important;
          border-color: #000000 !important;
          color: #ffffff !important;
        }

        .pagination .page-item.active .page-link:hover {
          background-color: #333333 !important;
          border-color: #333333 !important;
        }

        .pagination .page-item.disabled .page-link {
          color: #6c757d;
          pointer-events: none;
          cursor: default;
          background-color: #fff;
          border-color: #dee2e6;
        }

        .pagination .page-link:focus {
          box-shadow: 0 0 0 0.2rem rgba(0, 0, 0, 0.15);
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default Pagination;
