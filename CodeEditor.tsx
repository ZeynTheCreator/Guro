import React from 'react';
import { Language } from '../../types.ts';

interface CodeEditorProps {
  language: Language;
  value: string;
  onChange: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ language, value, onChange }) => {
  return (
    <div>
      <label htmlFor="code-editor" className="block text-sm font-medium text-gray-700 mb-1">
        Your {language} Code:
      </label>
      <textarea
        id="code-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Write your ${language} code here...`}
        className="w-full h-64 p-3 font-mono text-sm bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary resize-y"
        spellCheck="false"
        autoCapitalize="none"
        autoCorrect="off"
      />
    </div>
  );
};

export default CodeEditor;