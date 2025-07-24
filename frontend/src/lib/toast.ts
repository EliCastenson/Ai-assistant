import toast, { ToastOptions } from 'react-hot-toast'

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#363636',
    color: '#fff',
    borderRadius: '8px',
    padding: '12px 16px',
  },
}

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...defaultOptions,
      icon: '✅',
      ...options,
    })
  },

  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...defaultOptions,
      icon: '❌',
      ...options,
    })
  },

  warning: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...defaultOptions,
      icon: '⚠️',
      style: {
        ...defaultOptions.style,
        background: '#f59e0b',
      },
      ...options,
    })
  },

  info: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...defaultOptions,
      icon: 'ℹ️',
      style: {
        ...defaultOptions.style,
        background: '#3b82f6',
      },
      ...options,
    })
  },

  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...defaultOptions,
      ...options,
    })
  },

  dismiss: (toastId: string) => {
    toast.dismiss(toastId)
  },
}

export default showToast 