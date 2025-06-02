import React from 'react';

interface ProgressBarProps {
  percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
  const cappedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 md:h-3.5 dark:bg-gray-700 my-4 shadow-inner">
      <div
        className="bg-primary h-2.5 md:h-3.5 rounded-full transition-all duration-500 ease-out flex items-center justify-center text-white text-xs font-medium"
        style={{ width: `${cappedPercentage}%` }}
        role="progressbar"
        aria-valuenow={cappedPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
      {cappedPercentage > 10 && `${cappedPercentage.toFixed(0)}%`}
      </div>
       <span className="sr-only">{cappedPercentage.toFixed(0)}% Complete</span>
    </div>
  );
};

export default ProgressBar;