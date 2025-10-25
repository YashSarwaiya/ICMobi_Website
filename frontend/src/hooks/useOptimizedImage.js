import { useState, useEffect, useCallback } from "react";
import axios from "axios";

/**
 * Custom hook for optimized image loading with caching
 * Uses Blob URLs instead of base64 for better performance
 * Implements sessionStorage caching for faster subsequent loads
 */
export const useOptimizedImage = () => {
  const [labelImage, setLabelImage] = useState(null);
  const [labelFile, setLabelFile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Create object URL cache in sessionStorage
  const getCachedImageUrl = useCallback((filename) => {
    return sessionStorage.getItem(`img_${filename}`);
  }, []);

  const setCachedImageUrl = useCallback((filename, url) => {
    try {
      sessionStorage.setItem(`img_${filename}`, url);
    } catch (e) {
      // Storage full, clear old entries
      console.warn("SessionStorage full, clearing cache");
      const keys = Object.keys(sessionStorage);
      keys
        .filter((k) => k.startsWith("img_"))
        .slice(0, 10)
        .forEach((k) => sessionStorage.removeItem(k));
    }
  }, []);

  const loadImage = useCallback(
    async (email) => {
      if (isLoading) {
        console.log("Already loading, skipping request");
        return;
      }

      setIsLoading(true);
      setError("");
      setLabelImage(null);

      try {
        // 1. Get filename
        console.log("Getting image file for:", email);
        const filenameResponse = await axios.get("/dropbox/imagefile", {
          params: { email: email },
          timeout: 30000,
        });

        if (!filenameResponse.data) {
          throw new Error("No filename received from server");
        }

        const filename = filenameResponse.data;
        setLabelFile(filename);

        // 2. Check sessionStorage cache first
        const cachedUrl = getCachedImageUrl(filename);
        if (cachedUrl) {
          console.log("✓ Using cached image URL");
          setLabelImage(cachedUrl);
          setIsLoading(false);
          return;
        }

        // 3. Fetch image as blob (much more efficient than base64)
        console.log("✗ Fetching image from server:", filename);
        const imageResponse = await axios.get("/dropbox/imagedata", {
          responseType: "blob", // Changed from arraybuffer - THIS IS KEY!
          params: { imagefile: filename },
          timeout: 30000,
        });

        if (!imageResponse.data || imageResponse.data.size === 0) {
          throw new Error("Empty image data received");
        }

        // 4. Create object URL from blob
        const imageUrl = URL.createObjectURL(imageResponse.data);

        // 5. Cache the URL
        setCachedImageUrl(filename, imageUrl);

        setLabelImage(imageUrl);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading image:", error);

        let errorMsg = "Error loading image. ";
        if (error.code === "ECONNABORTED") {
          errorMsg +=
            "Request timed out. Please check your internet connection.";
        } else if (error.response) {
          errorMsg +=
            error.response.data?.error ||
            error.response.statusText ||
            "Server error.";
        } else if (error.request) {
          errorMsg += "No response from server. Please check your connection.";
        } else {
          errorMsg += error.message || "Unknown error occurred.";
        }

        setError(errorMsg);
        setIsLoading(false);
      }
    },
    [isLoading, getCachedImageUrl, setCachedImageUrl]
  );

  // Cleanup function to revoke object URLs
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
