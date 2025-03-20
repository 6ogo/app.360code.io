'use client';

import React from 'react';
import { ToastContainer as ReactToastifyContainer, toast as reactToastify } from 'react-toastify';
// Import the CSS through a more controlled way in your globals.css instead

export const ToastContainer = (props) => {
  return <ReactToastifyContainer {...props} />;
};

export const toast = {
  success: (message, options) => reactToastify.success(message, options),
  error: (message, options) => reactToastify.error(message, options),
  info: (message, options) => reactToastify.info(message, options),
  warning: (message, options) => reactToastify.warning(message, options),
  dismiss: () => reactToastify.dismiss()
};