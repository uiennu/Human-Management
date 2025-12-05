'use client'; // Bắt buộc vì có tương tác người dùng
import React, { useState, useRef, useEffect } from 'react';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => void;
  onResend?: () => void;
  message?: string;
}

export default function OtpModal({ isOpen, onClose, onSubmit, onResend, message }: OtpModalProps) {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset OTP khi mở modal
  useEffect(() => {
      if (isOpen) {
          setOtp(new Array(6).fill(""));
          inputRefs.current[0]?.focus();
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Tự động focus ô tiếp theo
    if (element.value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
      onSubmit(otp.join(""));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay làm mờ */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="relative flex w-full max-w-md flex-col items-center gap-4 rounded-xl bg-white dark:bg-[#1a2831] p-8 shadow-2xl z-10">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white text-center">Security Verification</h3>
        <p className="text-base font-normal text-gray-600 dark:text-gray-400 text-center">
          {message || "Please enter the OTP sent to your registered email."}
        </p>

        <div className="w-full flex justify-center pt-4 pb-2">
          <div className="flex gap-2 sm:gap-4">
            {otp.map((data, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }} // Sửa lỗi return void
                className="flex h-12 w-10 sm:h-16 sm:w-14 text-center text-2xl font-semibold rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                type="text"
                maxLength={1}
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            ))}
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-4 pt-4">
          <button 
            onClick={handleSubmit}
            className="flex w-full cursor-pointer items-center justify-center rounded-lg h-12 px-5 bg-[#13a4ec] text-white text-base font-bold hover:bg-[#13a4ec]/90 transition-colors">
            Verify & Submit
          </button>
          <p 
            className="text-sm font-medium text-[#13a4ec] hover:underline cursor-pointer"
            onClick={() => {
              if (typeof onResend === 'function') onResend();
            }}
          >Resend OTP</p>
        </div>
      </div>
    </div>
  );
}