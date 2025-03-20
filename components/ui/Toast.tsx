import React from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="fas fa-check-circle"></i>
      case 'error':
        return <i className="fas fa-exclamation-circle"></i>
      case 'info':
      default:
        return <i className="fas fa-info-circle"></i>
    }
  }

  return (
    <div className={`toast toast-${type}`}>
      <div className="flex items-center gap-2">
        {getIcon()}
        <div>{message}</div>
      </div>
      <button 
        onClick={onClose}
        className="ml-2 text-white/80 hover:text-white"
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  )
}

export default Toast