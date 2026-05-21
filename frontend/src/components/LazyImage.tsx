import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * Optimized lazy loading image component using Intersection Observer
 * Only loads images when they're about to enter the viewport
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  placeholder = "/placeholder-food.jpg",
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Set up Intersection Observer on container
  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement || shouldLoad) return;

    // Create Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(containerElement);

    return () => {
      observer.disconnect();
    };
  }, [shouldLoad]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    setIsLoaded(false);
    if (onError) {
      onError(event);
    }
  };

  // Reset error and loaded state when src changes
  useEffect(() => {
    if (src && shouldLoad) {
      setHasError(false);
      setIsLoaded(false);
    }
  }, [src, shouldLoad]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Placeholder/skeleton while loading */}
      {(!shouldLoad || (!isLoaded && !hasError)) && (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100 animate-pulse z-0" />
      )}
      
      {/* Actual image - only render when we should load */}
      {shouldLoad && (
        <img
          ref={imgRef}
          src={hasError ? placeholder : src}
          alt={alt}
          className={cn(
            className,
            "w-full h-full object-cover transition-opacity duration-300 relative z-10",
            isLoaded && !hasError ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
        />
      )}
    </div>
  );
};

export default LazyImage;
