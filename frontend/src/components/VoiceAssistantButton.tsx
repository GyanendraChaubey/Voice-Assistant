/**
 * VoiceAssistantButton
 * 
 * Floating trigger button for voice assistant modal.
 * Teal circular button with animated sound wave icon.
 */

import { useState } from 'react';
import './VoiceAssistantButton.css';

interface VoiceAssistantButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceAssistantButton({
  onClick,
  disabled = false,
  className = '',
}: VoiceAssistantButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={`voice-assistant-btn ${className} ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Open voice assistant"
      title="Voice mode"
    >
      <svg
        className={`voice-icon ${isHovered ? 'hovered' : ''}`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sound wave bars */}
        <rect
          className="wave-bar bar-1"
          x="4"
          y="10"
          width="2"
          height="4"
          rx="1"
          fill="currentColor"
        />
        <rect
          className="wave-bar bar-2"
          x="8"
          y="7"
          width="2"
          height="10"
          rx="1"
          fill="currentColor"
        />
        <rect
          className="wave-bar bar-3"
          x="12"
          y="5"
          width="2"
          height="14"
          rx="1"
          fill="currentColor"
        />
        <rect
          className="wave-bar bar-4"
          x="16"
          y="7"
          width="2"
          height="10"
          rx="1"
          fill="currentColor"
        />
        <rect
          className="wave-bar bar-5"
          x="20"
          y="10"
          width="2"
          height="4"
          rx="1"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
