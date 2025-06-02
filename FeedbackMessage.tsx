import React from 'react';
import { ValidationResult } from '../../types.ts';

interface FeedbackMessageProps {
  result: ValidationResult;
}

const FeedbackMessage: React.FC<FeedbackMessageProps> = ({ result }) => {
  const bgColor = result.success ? 'bg-green-50' : 'bg-red-50';
  const textColor = result.success ? 'text-green-700' : 'text-red-700';
  const borderColor = result.success ? 'border-green-500' : 'border-red-500';
  const icon = result.success ? '✅' : '❌';

  return (
    <div className={`p-4 border-l-4 ${borderColor} ${bgColor} ${textColor} rounded-r-md shadow-md my-2`}>
      <div className="flex items-start">
        <span className="text-xl mr-3">{icon}</span>
        <div>
          <span className="font-bold block">{result.success ? 'Correct!' : 'Needs Improvement!'}</span>
          <span className="text-sm">{result.message}</span>
        </div>
      </div>
    </div>
  );
};

export default FeedbackMessage;