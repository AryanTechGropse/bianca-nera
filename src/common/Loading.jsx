import React from "react";

const Loading = () => (
  <>
    <div className="cart-loading-backdrop">
      <div className="cart-loader">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>

    <style>{`
      .cart-loading-backdrop {
        position: fixed;
        top: 0;
        right: 0;
        left: 0;
        width: 100%;
        height: 100%;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #00000078;
        z-index: 99999;
      }

      .cart-loader {
        display: flex;
        gap: 10px;
      }

      .cart-loader span {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        animation: cartWave 1.2s infinite ease-in-out;
      }

      .cart-loader span:nth-child(1) {
        background: #ffffff;
        animation-delay: 0s;
      }

      .cart-loader span:nth-child(2) {
        background: #000000;
        animation-delay: 0.15s;
      }

      .cart-loader span:nth-child(3) {
        background: #ffffff;
        animation-delay: 0.3s;
      }

      .cart-loader span:nth-child(4) {
        background: #000000;
        animation-delay: 0.45s;
      }

      @keyframes cartWave {
        0%, 100% {
          transform: translateY(0) scale(1);
          opacity: 0.6;
        }
        50% {
          transform: translateY(-18px) scale(1.3);
          opacity: 1;
        }
      }
    `}</style>
  </>
);

export default Loading;
