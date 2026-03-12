import React from 'react';

interface LoadingScreenProps {
  message: string;
  colorTheme?: "primary" | "orange"; // Added color theme option
}

export const LoadingScreen = ({ message, colorTheme = "primary" }: LoadingScreenProps) => {
  // Check which theme is selected
  const isOrange = colorTheme === "orange";
  
  // Apply the correct Tailwind classes based on the theme
  const textColor = isOrange ? "text-orange-500" : "text-primary";
  const ringColor = isOrange ? "border-orange-500/20 border-t-orange-500" : "border-primary/20 border-t-primary";
  const shadowGlow = isOrange ? "shadow-[0_0_30px_rgba(249,115,22,0.4)]" : "shadow-[0_0_30px_rgba(0,128,128,0.4)]";
  const pulseColor = isOrange ? "bg-orange-500/20" : "bg-primary/20";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
        {/* Spinning outer ring */}
        <div className={`absolute inset-0 border-4 rounded-full animate-spin ${ringColor} ${shadowGlow}`}></div>
        
        {/* Inner pulsing circle */}
        <div className={`w-12 h-12 rounded-full animate-pulse ${pulseColor}`}></div>
      </div>

      <h2 className={`text-4xl font-morganite tracking-wide mb-2 uppercase ${textColor}`}>
        {message}
      </h2>
      
      <p className="text-white/60 max-w-sm">
        Please wait a moment...
      </p>
    </div>
  );
};