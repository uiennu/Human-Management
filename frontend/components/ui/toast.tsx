import React, { useEffect } from "react";

export interface ToastProps {
  open: boolean;
  type?: "success" | "error" | "info";
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ open, type = "info", message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  if (!open) return null;

  let bg = "bg-slate-800";
  let border = "border-slate-700";
  let text = "text-white";
  if (type === "success") {
    bg = "bg-green-600";
    border = "border-green-700";
  } else if (type === "error") {
    bg = "bg-red-600";
    border = "border-red-700";
  } else if (type === "info") {
    bg = "bg-blue-600";
    border = "border-blue-700";
  }

  return (
    <div
      className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg border ${bg} ${border} ${text} animate-fade-in`}
      role="alert"
      onClick={onClose}
      style={{ cursor: "pointer" }}
    >
      {message}
    </div>
  );
}

// Add simple fade-in animation
// In your global CSS, add:
// @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
// .animate-fade-in { animation: fade-in 0.3s ease; }
