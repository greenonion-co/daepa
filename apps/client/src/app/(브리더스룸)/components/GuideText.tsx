"use client";

import { XCircle, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface GuideTextProps {
  text: string;
  icon: LucideIcon;
}

const GuideText = ({ text, icon: Icon }: GuideTextProps) => {
  const [isClosed, setIsClosed] = useState(false);

  const handleClose = () => {
    localStorage.setItem(text, "false");
    setIsClosed(true);
  };

  useEffect(() => {
    const isClosed = localStorage.getItem(text) === "false";
    setIsClosed(isClosed);
  }, [text]);

  if (isClosed) return null;

  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-900/90 px-4 py-2 text-sm text-white">
        <Icon className="h-4 w-4" />
        {text}
      </span>

      <button onClick={handleClose} className="cursor-pointer">
        <XCircle className="h-5 w-5 text-gray-400 hover:text-gray-700" />
      </button>
    </div>
  );
};

export default GuideText;
