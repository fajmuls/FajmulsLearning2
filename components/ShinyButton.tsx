import React from 'react';
import { motion } from 'framer-motion';

interface ShinyButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: 'primary' | 'secondary' | 'outline';
    type?: 'button' | 'submit' | 'reset';
}

const ShinyButton: React.FC<ShinyButtonProps> = ({ children, onClick, className = '', variant = 'primary', type = 'button' }) => {
    let baseStyles = "relative px-6 py-3 rounded-xl font-bold transition-all duration-300 overflow-hidden group";
    let variantStyles = "";

    switch (variant) {
        case 'primary':
            variantStyles = "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-indigo-400/50";
            break;
        case 'secondary':
            variantStyles = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700";
            break;
        case 'outline':
            variantStyles = "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20";
            break;
    }

    return (
        <motion.button
            type={type}
            className={`${baseStyles} ${variantStyles} ${className}`}
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
            
            {/* Shine Effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
                style={{ skewX: '-20deg' }}
            />
        </motion.button>
    );
};

export default ShinyButton;
