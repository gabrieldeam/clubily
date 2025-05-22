// app.config.js
require('dotenv').config();

module.exports = ({ config }) => ({
  ...config,
  extra: {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    imagePublicBaseUrl: process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL,
  },
});
