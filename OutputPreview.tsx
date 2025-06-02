import React, { useEffect, useRef } from 'react';

interface OutputPreviewProps {
  html?: string;
  css?: string;
  js?: string;
  expectedOutput?: string; // HTML string for expected output
}

const OutputPreview: React.FC<OutputPreviewProps> = ({ html = '', css = '', js = '', expectedOutput }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const expectedIframeRef = useRef<HTMLIFrameElement>(null);

  const generateSrcDoc = (h: string, c: string, j: string) => {
    // Basic HTML sanitization (very naive, for a real app use a library)
    // This is mainly to prevent breaking out of the body/head or injecting top-level malicious scripts.
    // For production, a proper HTML sanitizer (like DOMPurify) applied to 'h' would be essential if 'h' can contain arbitrary user input.
    // Since 'h' is usually user's code in a learning context, this is less critical than in an open forum.
    const sanitizedHtml = h; // In a real app, sanitize this if it's from untrusted sources.

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 8px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; line-height: 1.5; }
          /* User's CSS will be injected here */
          ${c}
        </style>
      </head>
      <body>
        ${sanitizedHtml}
        <script>
          // Isolate script errors within the iframe
          (function() {
            try {
              ${j}
            } catch (e) {
              console.error("Error in user script:", e);
              const errorDiv = document.createElement('div');
              errorDiv.style.color = 'red';
              errorDiv.style.backgroundColor = '#ffebee';
              errorDiv.style.border = '1px solid red';
              errorDiv.style.padding = '10px';
              errorDiv.style.marginTop = '10px';
              errorDiv.style.fontFamily = 'monospace';
              errorDiv.textContent = 'Script Error: ' + e.message;
              if (document.body) {
                 document.body.appendChild(errorDiv);
              } else {
                 // Fallback if body isn't ready, though unlikely with script at end.
                 document.documentElement.appendChild(errorDiv);
              }
            }
          })();
        <\/script>
      </body>
      </html>
    `;
  };
  
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = generateSrcDoc(html, css, js);
    }
  }, [html, css, js]);

  useEffect(() => {
    if (expectedIframeRef.current && expectedOutput) {
      expectedIframeRef.current.srcdoc = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <style>body { margin: 8px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; line-height: 1.5; }</style>
        </head>
        <body>${expectedOutput}</body>
        </html>`;
    }
  }, [expectedOutput]);


  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-2">Your Output:</h4>
        <iframe
          ref={iframeRef}
          title="Code Output"
          className="w-full h-64 border border-gray-300 rounded-md bg-white shadow-inner"
          sandbox="allow-scripts" // allow-same-origin might be needed if scripts access parent resources, but not for self-contained execution. allow-scripts is key for JS.
        />
      </div>
      {expectedOutput && (
         <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">Expected Output:</h4>
             <iframe
                ref={expectedIframeRef}
                title="Expected Output"
                className="w-full h-48 border border-gray-300 rounded-md bg-gray-50 shadow-inner"
                sandbox="" // No scripts or forms for expected static HTML, completely sandboxed.
             />
         </div>
      )}
    </div>
  );
};

export default OutputPreview;