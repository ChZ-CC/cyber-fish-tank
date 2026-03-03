'use client';

import { useState, useEffect } from 'react';

interface FishImageProps {
  imageId: string;
  alt: string;
  className?: string;
  imageCache: Map<string, string>;
  getFishImage: (imageId: string) => Promise<string | null>;
}

export default function FishImage({ imageId, alt, className, imageCache, getFishImage }: FishImageProps) {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (imageCache.has(imageId)) {
      setImage(imageCache.get(imageId)!);
      return;
    }

    getFishImage(imageId).then(img => {
      if (img) {
        setImage(img);
      }
    });
  }, [imageId, imageCache, getFishImage]);

  if (!image) {
    return (
      <div className={`${className} bg-slate-200 dark:bg-slate-700 animate-pulse`} />
    );
  }

  return (
    <img src={image} alt={alt} className={className} />
  );
}
