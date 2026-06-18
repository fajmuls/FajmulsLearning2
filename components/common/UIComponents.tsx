import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { UserProfile } from "../../types";
import { CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";

export const UserAvatar: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [user?.photoURL]);
  if (user?.photoURL && !imgError) {
    return (
      <img
        src={user.photoURL}
        alt="Profile"
        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm">
      {" "}
      {user?.username?.[0]?.toUpperCase() || "T"}{" "}
    </div>
  );
};

export const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.*?)\*/g, "<i>$1</i>")
    .replace(/\n- (.*?)/g, "<br/>• $1")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
  formatted = `<p>${formatted}</p>`;
  return (
    <div
      dangerouslySetInnerHTML={{ __html: formatted }}
      className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm font-sans text-justify markdown-content"
      style={{ textAlign: "justify", textJustify: "inter-word" }}
    />
  );
};

export const NotificationToast: React.FC<{
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  const borderAndIconColor =
    type === "success"
      ? "border-emerald-500/25 text-emerald-400 bg-emerald-500/10"
      : type === "error"
        ? "border-rose-500/25 text-rose-400 bg-rose-500/10"
        : "border-indigo-500/25 text-indigo-400 bg-indigo-500/10";

  const icon =
    type === "success" ? (
      <CheckCircle size={16} className="shrink-0 text-emerald-400" />
    ) : type === "error" ? (
      <AlertTriangle size={16} className="shrink-0 text-rose-400" />
    ) : (
      <Info size={16} className="shrink-0 text-indigo-400" />
    );

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95, x: "-50%" }}
      animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
      exit={{ opacity: 0, y: -15, scale: 0.95, x: "-50%" }}
      transition={{ type: "spring", duration: 0.35, bounce: 0.25 }}
      style={{ left: "50%" }}
      className={`fixed top-4 z-[100] flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md border ${borderAndIconColor} bg-slate-900/95 dark:bg-slate-950/95 text-slate-100 min-w-[280px] w-auto max-w-[92%] sm:max-w-md transition-all`}
    >
      {icon}
      <p className="flex-grow text-[11px] sm:text-xs font-semibold leading-relaxed text-slate-100 text-left select-none pr-1">
        {message}
      </p>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 p-1 rounded-lg transition-colors shrink-0"
        aria-label="Tutup"
      >
        <XCircle size={14} />
      </button>
    </motion.div>
  );
};

export const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="24px"
    height="24px"
  >
    {" "}
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />{" "}
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />{" "}
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />{" "}
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />{" "}
  </svg>
);
