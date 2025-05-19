import Image from "next/image";
import { useState } from "react";

interface PhotoViewerProps {
  photos: string[];
  onDelete: (index: number) => void;
}

export const PhotoViewer = ({ photos, onDelete }: PhotoViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="relative h-[400px] w-full overflow-hidden">
      <div className="relative h-full w-full">
        {photos.map((photo, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-transform duration-300 ${
              index === currentIndex
                ? "translate-x-0"
                : index < currentIndex
                  ? "-translate-x-full"
                  : "translate-x-full"
            }`}
          >
            <div className="relative h-full w-full">
              <Image
                src={photo}
                alt={`선택된 사진 ${index + 1}`}
                fill
                className="h-full w-full object-contain"
                sizes="(max-width: 768px) 100vw, 768px"
              />
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-black bg-opacity-50 p-1"
                onClick={() => onDelete(index)}
              >
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <button
            type="button"
            className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 ${
              currentIndex === 0 ? "cursor-not-allowed opacity-50" : ""
            }`}
            onClick={goToPrev}
            disabled={currentIndex === 0}
          >
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 ${
              currentIndex === photos.length - 1 ? "cursor-not-allowed opacity-50" : ""
            }`}
            onClick={goToNext}
            disabled={currentIndex === photos.length - 1}
          >
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
            <div className="rounded-full bg-black bg-opacity-50 px-3 py-1 text-sm font-medium text-white">
              {currentIndex + 1} / {photos.length}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
