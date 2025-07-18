// components/Loading/Loading.tsx
import React from 'react';

const Loading: React.FC = () => (
  <div className="loading-container">
    <div className="loader" />
    <style jsx>{`
      .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }

      .loader {
        position: relative;
        width: 60px;
        height: 60px;
      }

      .loader::before,
      .loader::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        transform-origin: -22px 0;
      }

      .loader::before {
        background-color: #FFA600;
        animation: spin-forward 1s linear infinite;
      }

      .loader::after {
        background-color: #FF4C00;
        animation: spin-backward 1s linear infinite;
      }

      @keyframes spin-forward {
        0% { transform: rotate(0deg) translateY(-50%); }
        100% { transform: rotate(360deg) translateY(-50%); }
      }

      @keyframes spin-backward {
        0% { transform: rotate(360deg) translateY(-50%); }
        100% { transform: rotate(0deg) translateY(-50%); }
      }
    `}</style>
  </div>
);

export default Loading;
