import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export const useOptimizedImage = () => {
  const [labelImage, setLabelImage] = useState(null);
  const [labelFile, setLabelFile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Cache images in sessionStorage
  const getCachedImageUrl = useCallback((filename) => {
    return sessionStorage.getItem(`img_${filename}`);
  }, []);

  const setCachedImageUrl = useCallback((filename, url) => {
    try {
      sessionStorage.setItem(`img_${filename}`, url);
    } catch (e) {
      console.warn("SessionStorage full, clearing cache");
      // Clear old entries if storage is full
      const keys = Object.keys(sessionStorage);
      keys
        .filter((k) => k.startsWith("img_"))
        .slice(0, 10)
        .forEach((k) => sessionStorage.removeItem(k));
    }
  }, []);

  const loadImage = useCallback(
    async (email) => {
      if (isLoading) return;

      setIsLoading(true);
      setError("");

      try {
        // Get filename
        const filenameResponse = await axios.get("/dropbox/imagefile", {
          params: { email },
          timeout: 30000,
        });

        const filename = filenameResponse.data;
        setLabelFile(filename);

        // Check cache first
        const cachedUrl = getCachedImageUrl(filename);
        if (cachedUrl) {
          console.log("✓ Using cached image");
          setLabelImage(cachedUrl);
          setIsLoading(false);
          return;
        }

        // Fetch as blob
        const imageResponse = await axios.get("/dropbox/imagedata", {
          responseType: "blob",
          params: { imagefile: filename },
          timeout: 30000,
        });

        const imageUrl = URL.createObjectURL(imageResponse.data);
        setCachedImageUrl(filename, imageUrl);

        setLabelImage(imageUrl);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading image:", error);
        setError("Error loading image. Please try again.");
        setIsLoading(false);
      }
    },
    [isLoading, getCachedImageUrl, setCachedImageUrl]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (labelImage && labelImage.startsWith("blob:")) {
        URL.revokeObjectURL(labelImage);
      }
    };
  }, [labelImage]);

  return {
    labelImage,
    labelFile,
    isLoading,
    error,
    loadImage,
    setLabelImage,
    setLabelFile,
    setError,
  };
};
