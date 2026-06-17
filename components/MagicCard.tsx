import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface MagicCardProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    sparkleColor?: string;
}

const MagicCard: React.FC<MagicCardProps> = ({ children, onClick, className = '', sparkleColor = '#6366f1' }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            className={`relative overflow-hidden rounded-2xl cursor-pointer ${className}`}
            onClick={onClick}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ 
                scale: 1.02, 
                y: -5,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            {/* Background Glow */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 opacity-0"
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
            />

            {/* Sparkles */}
            {isHovered && (
                <>
                    <motion.div
                        className="absolute top-2 right-2 text-yellow-400"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0], rotate: [0, 180, 360] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Sparkles size={20} fill={sparkleColor} color={sparkleColor} />
                    </motion.div>
                    <motion.div
                        className="absolute bottom-4 left-4 text-yellow-400"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, -180, -360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    >
                        <Sparkles size={16} fill={sparkleColor} color={sparkleColor} />
                    </motion.div>
                     <motion.div
                        className="absolute top-1/2 left-1/2 text-yellow-400"
                        initial={{ scale: 0, opacity: 0, x: '-50%', y: '-50%' }}
                        animate={{ scale: [0, 1.5, 0], opacity: [0, 0.8, 0], rotate: [0, 90, 180] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    >
                        <Sparkles size={24} fill={sparkleColor} color={sparkleColor} />
                    </motion.div>
                </>
            )}

            {/* Content */}
            <div className="relative z-10 h-full">
                {children}
            </div>
            
            {/* Border Glow */}
            <motion.div 
                className="absolute inset-0 rounded-2xl border-2 border-transparent"
                animate={{ borderColor: isHovered ? sparkleColor : 'transparent' }}
                transition={{ duration: 0.3 }}
            />
        </motion.div>
    );
};

export default MagicCard;
