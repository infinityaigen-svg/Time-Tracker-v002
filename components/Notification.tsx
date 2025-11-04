
import React from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
}

const NotificationComponent: React.FC<NotificationProps> = ({ message, type }) => {
  const baseClasses = "fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-2xl text-white font-semibold transform transition-all duration-300 ease-in-out animate-fade-in-up";
  const typeClasses = type === 'success' ? 'bg-green-600/90 backdrop-blur-sm' : 'bg-red-600/90 backdrop-blur-sm';

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      {message}
    </div>
  );
};

export default NotificationComponent;
