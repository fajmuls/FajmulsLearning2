import React, { useState } from "react";
import { Loader2, ChevronRight, CheckCircle } from "lucide-react";
import { APP_LOGO_URL } from "../../constants";
import { GoogleIcon } from "../common/UIComponents";

export const LoginScreen: React.FC<{
  onGoogleLogin: (rememberMe: boolean) => void;
  onGuestLogin: () => void;
  isLoading: boolean;
}> = ({ onGoogleLogin, onGuestLogin, isLoading }) => {
  const [rememberMe, setRememberMe] = useState(true);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 text-center relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-20 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 w-10 h-10 mb-4" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              Menghubungkan...
            </p>
          </div>
        )}
        <div className="mb-8 flex justify-center">
          <img
            src={APP_LOGO_URL}
            alt="Logo"
            className="w-24 h-24 object-contain animate-bounce-slow"
          />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Fajmuls Learning
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Platform Belajar Cerdas Terintegrasi AI
          </p>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => onGoogleLogin(rememberMe)}
            className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-full border border-slate-300 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 relative"
          >
            <div className="absolute left-4">
              <GoogleIcon />
            </div>
            <span className="text-base font-roboto font-bold">
              Masuk dengan Google
            </span>
          </button>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="remember" className="cursor-pointer select-none">
              Tetap masuk di perangkat ini
            </label>
          </div>
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">
              ATAU
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          </div>
          <button
            onClick={onGuestLogin}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition flex items-center justify-center gap-2"
          >
            Masuk sebagai Tamu <ChevronRight size={20} />
          </button>
          <p className="text-xs text-slate-400 mt-2">
            *Mode Tamu: Riwayat hanya tersimpan di perangkat ini & tidak masuk
            Leaderboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export const UsernameSetupScreen: React.FC<{
  onSubmit: (username: string) => void;
  isLoading: boolean;
}> = ({ onSubmit, isLoading }) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setError("Username minimal 3 karakter.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Hanya huruf, angka, dan underscore (_).");
      return;
    }
    onSubmit(username);
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Buat Username
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Pilih nama unik untuk identitas belajarmu.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Username
            </label>
            <input
              type="text"
              className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl focus:border-indigo-600 focus:ring-0 outline-none font-bold"
              placeholder="Username_Unik"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.replace(/\s/g, ""));
                setError("");
              }}
              autoFocus
            />
            {error && (
              <p className="text-rose-500 text-xs mt-2 font-bold">{error}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !username}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <CheckCircle size={20} />
            )}
            Simpan & Lanjut
          </button>
        </form>
      </div>
    </div>
  );
};
