import React, { useState, useRef } from 'react';

export const ArexPage = () => {
  const [arexUrl] = useState(() => {
    return (
      import.meta.env.VITE_AREX_URL ||
      localStorage.getItem('notex_arex_url') ||
      'http://localhost:3000'
    );
  });
  const iframeRef = useRef(null);

  return (
    <div className="fixed inset-0 w-screen h-screen z-0 bg-[#09090B] overflow-hidden">
      <iframe
        ref={iframeRef}
        src={arexUrl}
        title="Agent Arex Live Multimodal AI Whiteboard"
        className="w-full h-full border-0 block"
        allow="camera; microphone; display-capture; autoplay; clipboard-write; clipboard-read"
      />
    </div>
  );
};
