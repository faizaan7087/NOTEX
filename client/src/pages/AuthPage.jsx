import React, { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';

export const AuthPage = () => {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#f4f4f5]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-black/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-black/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {isRegister ? (
          <RegisterForm onSwitchToLogin={() => setIsRegister(false)} />
        ) : (
          <LoginForm onSwitchToRegister={() => setIsRegister(true)} />
        )}
      </div>
    </div>
  );
};
