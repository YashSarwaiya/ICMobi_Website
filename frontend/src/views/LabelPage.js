import { React, useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Alert from "react-bootstrap/Alert";
import { CaretRightFill } from "react-bootstrap-icons";
import LoadingSpinner from "../components/LoadingSpinner";
import LabelModal from "../components/LabelModal";
import { AuthContext, AuthConsumer } from "../helpers/AuthContext";
import Sidebar from "../components/Sidebar";
import "../styles/responsive.css";

const LabelPage = () => {
  const context = useContext(AuthContext);
  const [skipCooldown, setSkipCooldown] = useState(0); // 0 = no cooldown

  //Loading variables
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  //Label image data
  const [labelImage, setLabelImage] = useState(null);
  const [labelFile, setLabelFile] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);

  //Prefetch next image (NEW)
  const [nextImage, setNextImage] = useState(null);
  const [nextFile, setNextFile] = useState("");
  const [isPrefetching, setIsPrefetching] = useState(false);

  //Checkbox values
  const [brain, setBrain] = useState(false);
  const [muscle, setMuscle] = useState(false);
  const [eye, setEye] = useState(false);
  const [heart, setHeart] = useState(false);
  const [linenoise, setLinenoise] = useState(false);
  const [channoise, setChannoise] = useState(false);
  const [other, setOther] = useState(false);
  const [unsure, setUnsure] = useState(false);

  //Submission
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  // Retry mechanism
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Refs to prevent cleanup during load
  const imageRef = useRef(null);
  const currentBlobUrl = useRef(null);
  const nextBlobUrl = useRef(null);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (currentBlobUrl.current) {
        URL.revokeObjectURL(currentBlobUrl.current);
        currentBlobUrl.current = null;
      }
      if (nextBlobUrl.current) {
        URL.revokeObjectURL(nextBlobUrl.current);
        nextBlobUrl.current = null;
      }
    };
  }, []);

  const validateSelection = () => {
    const hasSelection =
      brain ||
      muscle ||
      eye ||
      heart ||
      linenoise ||
      channoise ||
      other ||
      unsure;

    if (!hasSelection) {
      setValidationError(
        "Please select at least one label before submitting, or click Skip to move to the next component."
      );
      return false;
    }

    setValidationError("");
    return true;
  };

  // NEW: Prefetch next image in background
  const prefetchNextImage = async (email) => {
    if (isPrefetching || !email || email === "guest") return;

    console.log("🔄 Prefetching next image...");
    setIsPrefetching(true);

    try {
      // Get next filename
      const filenameResponse = await axios.get("/dropbox/imagefile", {
        params: { email },
        timeout: 30000,
      });

      const filename = filenameResponse.data;

      if (!filename) {
        throw new Error("No filename received");
      }

      console.log("📋 Next filename:", filename);
      setNextFile(filename);

      // Check cache first
      const cachedUrl = sessionStorage.getItem(`img_${filename}`);
      if (cachedUrl) {
        // Validate cached URL
        try {
          const testResponse = await fetch(cachedUrl, { method: "HEAD" });
          if (testResponse.ok) {
            console.log("✓ Next image already cached");
            nextBlobUrl.current = cachedUrl;
            setNextImage(cachedUrl);
            setIsPrefetching(false);
            return;
          } else {
            sessionStorage.removeItem(`img_${filename}`);
          }
        } catch (e) {
          sessionStorage.removeItem(`img_${filename}`);
        }
      }

      // Fetch image as blob
      console.log("⬇️ Downloading next image...");
      const imageResponse = await axios.get("/dropbox/imagedata", {
        responseType: "blob",
        params: { imagefile: filename },
        timeout: 45000,
      });

      if (!imageResponse.data || imageResponse.data.size === 0) {
        throw new Error("Empty image data received for prefetch");
      }

      // Verify it's an image
      if (!imageResponse.data.type.startsWith("image/")) {
        throw new Error(`Invalid image type: ${imageResponse.data.type}`);
      }

      const imageUrl = URL.createObjectURL(imageResponse.data);
      nextBlobUrl.current = imageUrl;

      // Cache it
      try {
        sessionStorage.setItem(`img_${filename}`, imageUrl);
        console.log("💾 Cached next image");
      } catch (e) {
        console.warn("SessionStorage full, clearing cache");
        const keys = Object.keys(sessionStorage);
        keys
          .filter((k) => k.startsWith("img_"))
          .slice(0, 10)
          .forEach((k) => {
            const urlToRevoke = sessionStorage.getItem(k);
            if (urlToRevoke && urlToRevoke.startsWith("blob:")) {
              URL.revokeObjectURL(urlToRevoke);
            }
            sessionStorage.removeItem(k);
          });
        // Try caching again
        sessionStorage.setItem(`img_${filename}`, imageUrl);
      }

      setNextImage(imageUrl);
      console.log("✅ Next image prefetched successfully");
    } catch (error) {
      console.error("❌ Prefetch error (non-critical):", error);
      // Don't show error to user - prefetch failures are silent
    } finally {
      setIsPrefetching(false);
    }
  };

  const submitResults = async () => {
    if (!validateSelection()) {
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    let tags = [];

    if (brain) tags.push("Brain");
    if (muscle) tags.push("Muscle");
    if (eye) tags.push("Eye");
    if (heart) tags.push("Heart");
    if (linenoise) tags.push("Line Noise");
    if (channoise) tags.push("Channel Noise");
    if (other) tags.push("Other");
    if (unsure) tags.push("Unsure");

    try {
      const response = await axios.post(
        "/api/components/submit",
        {
          name: labelFile,
          email: context.Email,
          tags: tags,
          domain: context.Domain,
          weight: context.Weight,
        },
        {
          timeout: 15000,
        }
      );

      if (response.data) {
        console.log("Submission successful:", response.data);
        setStatus("success");
        setValidationError("");

        // ⭐ Start prefetching next image while user views results
        prefetchNextImage(context.Email);
      } else {
        throw new Error("Empty response from server");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setStatus("failed");
      setError(
        err.response?.data?.message ||
          err.message ||
          "Submission failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNext = () => {
    console.log("Getting next image...");
    setStatus("");
    setError("");
    setValidationError("");
    setRetryCount(0);

    // Don't cleanup current image yet - will be cleaned up after new image loads
    setImageLoaded(false);
    getImage();
  };

  const getImage = async (isRetry = false) => {
    // ⭐ CHECK FOR PREFETCHED IMAGE FIRST
    if (nextImage && nextFile && !isRetry) {
      console.log("⚡ Using prefetched image - INSTANT LOAD!");

      // Cleanup old current image
      if (currentBlobUrl.current && currentBlobUrl.current !== nextImage) {
        URL.revokeObjectURL(currentBlobUrl.current);
      }

      // Use the prefetched image
      currentBlobUrl.current = nextBlobUrl.current;
      setLabelImage(nextImage);
      setLabelFile(nextFile);
      setImageLoaded(false); // Will be set by onLoad

      // Clear prefetch state
      nextBlobUrl.current = null;
      setNextImage(null);
      setNextFile("");

      // Reset checkboxes
      setBrain(false);
      setMuscle(false);
      setEye(false);
      setHeart(false);
      setLinenoise(false);
      setChannoise(false);
      setOther(false);
      setUnsure(false);

      // Immediately prefetch the next one in background
      const email = localStorage.getItem("Email");
      if (email && email !== "guest") {
        setTimeout(() => prefetchNextImage(email), 100);
      }

      return; // EXIT EARLY - NO LOADING NEEDED!
    }

    // ORIGINAL LOADING LOGIC (if no prefetch available)
    if (isLoading) {
      console.log("Already loading, skipping request");
      return;
    }

    setIsLoading(true);
    if (!isRetry) {
      setError("");
      setValidationError("");
    }

    //Set all checkboxes to blank
    setBrain(false);
    setMuscle(false);
    setEye(false);
    setHeart(false);
    setLinenoise(false);
    setChannoise(false);
    setOther(false);
    setUnsure(false);

    const email = localStorage.getItem("Email");

    if (!email || email === "guest") {
      setError("You must be logged in to label components.");
      setIsLoading(false);
      return;
    }

    console.log("Getting image file for:", email);

    try {
      // Get image filename (only if not retrying with same file)
      let filename = labelFile;

      if (!isRetry || !filename) {
        const filenameResponse = await axios.get("/dropbox/imagefile", {
          params: { email: email },
          timeout: 30000,
        });

        console.log("Got filename:", filenameResponse.data);

        if (!filenameResponse.data) {
          throw new Error("No filename received from server");
        }

        filename = filenameResponse.data;
        setLabelFile(filename);
      }

      // Check sessionStorage cache first (but not on retry)
      if (!isRetry) {
        const cachedUrl = sessionStorage.getItem(`img_${filename}`);
        if (cachedUrl) {
          console.log("✓ Using cached image URL");

          // Validate cached URL still works
          try {
            const testResponse = await fetch(cachedUrl, { method: "HEAD" });
            if (testResponse.ok) {
              // Cleanup old current image
              if (
                currentBlobUrl.current &&
                currentBlobUrl.current !== cachedUrl
              ) {
                URL.revokeObjectURL(currentBlobUrl.current);
              }

              currentBlobUrl.current = cachedUrl;
              setLabelImage(cachedUrl);
              setImageLoaded(false);
              setIsLoading(false);

              // Start prefetching next image
              prefetchNextImage(email);
              return;
            } else {
              console.log("Cached URL invalid, removing from cache");
              sessionStorage.removeItem(`img_${filename}`);
            }
          } catch (e) {
            console.log("Cached URL test failed:", e);
            sessionStorage.removeItem(`img_${filename}`);
          }
        }
      }

      // Get image data as BLOB
      console.log("✗ Fetching image from server:", filename);
      const imageResponse = await axios.get("/dropbox/imagedata", {
        responseType: "blob",
        params: { imagefile: filename },
        timeout: 45000,
      });

      console.log("Got image data, size:", imageResponse.data.size, "bytes");

      if (!imageResponse.data || imageResponse.data.size === 0) {
        throw new Error("Empty image data received");
      }

      // Verify it's actually an image
      if (!imageResponse.data.type.startsWith("image/")) {
        throw new Error(`Invalid image type: ${imageResponse.data.type}`);
      }

      // Cleanup old blob URL before creating new one
      if (currentBlobUrl.current) {
        URL.revokeObjectURL(currentBlobUrl.current);
      }

      // Create object URL from blob
      const imageUrl = URL.createObjectURL(imageResponse.data);
      currentBlobUrl.current = imageUrl;

      // Cache the URL in sessionStorage (don't cache on retry)
      if (!isRetry) {
        try {
          sessionStorage.setItem(`img_${filename}`, imageUrl);
        } catch (e) {
          console.warn("SessionStorage full, clearing cache");
          const keys = Object.keys(sessionStorage);
          keys
            .filter((k) => k.startsWith("img_"))
            .slice(0, 10)
            .forEach((k) => {
              const urlToRevoke = sessionStorage.getItem(k);
              if (urlToRevoke && urlToRevoke.startsWith("blob:")) {
                URL.revokeObjectURL(urlToRevoke);
              }
              sessionStorage.removeItem(k);
            });
        }
      }

      setLabelImage(imageUrl);
      setImageLoaded(false);
      setIsLoading(false);
      setRetryCount(0);

      // Start prefetching next image
      prefetchNextImage(email);
    } catch (error) {
      console.error("Error loading image:", error);

      // Check if we should retry
      if (retryCount < maxRetries) {
        console.log(`Retrying... Attempt ${retryCount + 1} of ${maxRetries}`);
        setRetryCount(retryCount + 1);
        setIsLoading(false);

        // Wait before retrying (exponential backoff)
        setTimeout(() => {
          getImage(true);
        }, 1000 * (retryCount + 1));
        return;
      }

      let errorMsg = "Unable to load image. ";

      if (error.code === "ECONNABORTED") {
        errorMsg += "Connection timed out.";
      } else if (error.response) {
        errorMsg += error.response.data?.error || "Server error occurred.";
      } else if (error.request) {
        errorMsg += "No response from server.";
      } else {
        errorMsg += error.message || "Unknown error.";
      }

      setError(errorMsg);
      setIsLoading(false);
      setRetryCount(0);
      setLabelImage(null);
      setLabelFile("");
    }
  };

  useEffect(() => {
    if (!status && !labelImage && !isLoading && !nextImage) {
      getImage();
    }
  }, []);

  // Handle image load success
  const handleImageLoad = () => {
    console.log("✓ Image rendered successfully");
    setImageLoaded(true);
    setError("");
  };

  // Handle image load error
  const handleImageError = (e) => {
    console.error("✗ Image failed to render");

    // Only retry if we haven't exceeded max retries
    if (retryCount < maxRetries) {
      console.log(
        `Image render failed, retrying... Attempt ${
          retryCount + 1
        } of ${maxRetries}`
      );
      setRetryCount(retryCount + 1);
      setLabelImage(null);
      setImageLoaded(false);

      setTimeout(() => {
        getImage(true);
      }, 1000 * (retryCount + 1));
    } else {
      // Max retries exceeded - just move to next image
      console.log("Max retries exceeded, loading next image");
      setRetryCount(0);
      setTimeout(() => getNext(), 500);
    }
  };

  const renderLabelingInterface = () => (
    <>
      {error && (
        <Container
          className="mobile-padding-sm"
          style={{ width: "100%", maxWidth: "600px", marginBottom: "10px" }}
        >
          <Alert variant="warning" dismissible onClose={() => setError("")}>
            <Alert.Heading>Connection Issue</Alert.Heading>
            <p>{error}</p>
            {retryCount > 0 && (
              <p>
                <small>
                  Retry attempt: {retryCount}/{maxRetries}
                </small>
              </p>
            )}
            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => {
                setRetryCount(0);
                setError("");
                getNext();
              }}
              className="btn-responsive"
            >
              Try Next Image
            </Button>
          </Alert>
        </Container>
      )}

      {validationError && (
        <Container
          className="mobile-padding-sm"
          style={{ width: "100%", maxWidth: "600px", marginBottom: "10px" }}
        >
          <Alert
            variant="warning"
            dismissible
            onClose={() => setValidationError("")}
          >
            <Alert.Heading>Selection Required</Alert.Heading>
            <p>{validationError}</p>
          </Alert>
        </Container>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : labelImage ? (
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "10px",
          }}
        >
          {/* DESKTOP: Side by side */}
          <div
            className="hide-mobile"
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "20px",
            }}
          >
            {/* Image on left */}
            <div style={{ flex: "1", minWidth: "0" }}>
              <img
                ref={imageRef}
                src={labelImage}
                alt="Labeling data"
                className="img-responsive"
                style={{
                  width: "100%",
                  height: "auto",
                  border: "2px solid #C0C2C9",
                  opacity: status ? "0.33" : "1.0",
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>

            {/* Options on right */}
            <div
              style={{
                flex: "0 0 auto",
                minWidth: "180px",
                maxWidth: "200px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Form.Group
                className="flex-column"
                controlId="formBasicCheckbox"
                style={{
                  opacity: status ? "0.33" : "1.0",
                  flex: "1",
                }}
              >
                <Form.Check
                  id="brain"
                  type="checkbox"
                  label="Brain"
                  checked={brain}
                  disabled={!!status || isSubmitting}
                  className="mb-2"
                  style={{
                    textAlign: "left",
                    paddingLeft: "40px",
                    borderRadius: "10px",
                    background: "#00A5E0",
                  }}
                  onChange={(e) => {
                    setBrain(e.target.checked);
                    setValidationError("");
                  }}
                />
                <Form.Check
                  id="muscle"
                  type="checkbox"
                  label="Muscle"
                  checked={muscle}
                  disabled={!!status || isSubmitting}
                  className="mb-2"
                  style={{
                    textAlign: "left",
                    paddingLeft: "40px",
                    borderRadius: "10px",
                    background: "#EF9CDA",
                  }}
                  onChange={(e) => {
                    setMuscle(e.target.checked);
                    setValidationError("");
                  }}
                />
                <Form.Check
                  id="eye"
                  type="checkbox"
                  label="Eye"
                  checked={eye}
                  disabled={!!status || isSubmitting}
                  className="mb-2"
                  style={{
                    textAlign: "left",
                    paddingLeft: "40px",
                    borderRadius: "10px",
                    background: "#89A1EF",
                  }}
                  onChange={(e) => {
                    setEye(e.target.checked);
                    setValidationError("");
                  }}
                />
                <Form.Check
                  id="heart"
                  type="checkbox"
                  label="Heart"
                  checked={heart}
                  disabled={!!status || isSubmitting}
                  className="mb-2"
                  style={{
                    textAlign: "left",
                    paddingLeft: "40px",
                    borderRadius: "10px",
                    background: "#FECEF1",
                  }}
                  onChange={(e) => {
                    setHeart(e.target.checked);
                    setValidationError("");
                  }}
                />
                <Form.Check
                  id="linenoise"
                  type="checkbox"
                  label="Line Noise"
                  checked={linenoise}
                  disabled={!!status || isSubmitting}
                  className="mb-2"
                  style={{
                    textAlign: "left",
                    paddingLeft: "40px",
                    borderRadius: "10px",
                    background: "#C2EABD",
                  }}
                  onChange={(e) => {
                    setLinenoise(e.target.checked);
                    setValidationError("");
                  }}
                />
                <Form.Check
                  id="channoise"
                  type="checkbox"
                  label="Chan Noise"
                  checked={channoise}
                  disabled={!!status || isSubmitting}
                  className="mb-2"
                  style={{
                    textAlign: "left",
                    paddingLeft: "40px",
                    borderRadius: "10px",
                    background: "#32CBFF",
                  }}
                  onChange={(e) => {
                    setChannoise(e.target.checked);
                    setValidationError("");
                  }}
                />
                <Form.Check
                  id="other"
                  type="checkbox"
                  label="Other"
                  checked={other}
                  disabled={!!status || isSubmitting}
                  className="mb-2"
                  style={{
                    textAlign: "left",
                    paddingLeft: "40px",
                    borderRadius: "10px",
                    background: "#DCF2B0",
                  }}
                  onChange={(e) => {
                    setOther(e.target.checked);
                    setValidationError("");
                  }}
                />
                <Form.Check
                  id="unsure"
                  type="checkbox"
                  label="Unsure"
                  checked={unsure}
                  disabled={!!status || isSubmitting}
                  className="mb-2"
                  style={{
                    textAlign: "left",
                    paddingLeft: "40px",
                    borderRadius: "10px",
                    background: "#FFE5B4",
                  }}
                  onChange={(e) => {
                    setUnsure(e.target.checked);
                    setValidationError("");
                  }}
                />
              </Form.Group>

              <div className="mt-auto" style={{ marginTop: "20px" }}>
                {!status && (
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      if (skipCooldown > 0) return; // prevent spam clicks
                      setSkipCooldown(1);
                      getNext();

                      const countdown = setInterval(() => {
                        setSkipCooldown((prev) => {
                          if (prev <= 1) {
                            clearInterval(countdown);
                            return 0;
                          }
                          return prev - 1;
                        });
                      }, 1000);
                    }}
                    disabled={isSubmitting || skipCooldown > 0}
                    className="mb-2"
                    style={{
                      width: "100%",
                      opacity: skipCooldown > 0 ? 0.6 : 1, // slightly faded when disabled
                      cursor: skipCooldown > 0 ? "not-allowed" : "pointer",
                    }}
                  >
                    {skipCooldown > 0 ? (
                      `${skipCooldown}`
                    ) : (
                      <>
                        Skip <CaretRightFill />
                      </>
                    )}
                  </Button>
                )}
                {!status ? (
                  <Button
                    variant="primary"
                    type="button"
                    onClick={submitResults}
                    disabled={isSubmitting}
                    style={{ width: "100%" }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    type="button"
                    onClick={getNext}
                    style={{ width: "100%" }}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* MOBILE: Image on top, options below */}
          <div className="show-mobile">
            <div style={{ marginBottom: "20px" }}>
              <img
                src={labelImage}
                alt="Labeling data"
                className="img-responsive"
                style={{
                  width: "100%",
                  height: "auto",
                  border: "2px solid #C0C2C9",
                  opacity: status ? "0.33" : "1.0",
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>

            <div>
              <Form.Group
                controlId="formBasicCheckboxMobile"
                style={{
                  opacity: status ? "0.33" : "1.0",
                }}
              >
                <Row>
                  <Col xs={6} className="mb-2">
                    <Form.Check
                      id="brain-mobile"
                      type="checkbox"
                      label="Brain"
                      checked={brain}
                      disabled={!!status || isSubmitting}
                      style={{
                        textAlign: "left",
                        paddingLeft: "30px",
                        borderRadius: "10px",
                        background: "#00A5E0",
                        padding: "10px",
                      }}
                      onChange={(e) => {
                        setBrain(e.target.checked);
                        setValidationError("");
                      }}
                    />
                  </Col>
                  <Col xs={6} className="mb-2">
                    <Form.Check
                      id="muscle-mobile"
                      type="checkbox"
                      label="Muscle"
                      checked={muscle}
                      disabled={!!status || isSubmitting}
                      style={{
                        textAlign: "left",
                        paddingLeft: "30px",
                        borderRadius: "10px",
                        background: "#EF9CDA",
                        padding: "10px",
                      }}
                      onChange={(e) => {
                        setMuscle(e.target.checked);
                        setValidationError("");
                      }}
                    />
                  </Col>
                  <Col xs={6} className="mb-2">
                    <Form.Check
                      id="eye-mobile"
                      type="checkbox"
                      label="Eye"
                      checked={eye}
                      disabled={!!status || isSubmitting}
                      style={{
                        textAlign: "left",
                        paddingLeft: "30px",
                        borderRadius: "10px",
                        background: "#89A1EF",
                        padding: "10px",
                      }}
                      onChange={(e) => {
                        setEye(e.target.checked);
                        setValidationError("");
                      }}
                    />
                  </Col>
                  <Col xs={6} className="mb-2">
                    <Form.Check
                      id="heart-mobile"
                      type="checkbox"
                      label="Heart"
                      checked={heart}
                      disabled={!!status || isSubmitting}
                      style={{
                        textAlign: "left",
                        paddingLeft: "30px",
                        borderRadius: "10px",
                        background: "#FECEF1",
                        padding: "10px",
                      }}
                      onChange={(e) => {
                        setHeart(e.target.checked);
                        setValidationError("");
                      }}
                    />
                  </Col>
                  <Col xs={6} className="mb-2">
                    <Form.Check
                      id="linenoise-mobile"
                      type="checkbox"
                      label="Line Noise"
                      checked={linenoise}
                      disabled={!!status || isSubmitting}
                      style={{
                        textAlign: "left",
                        paddingLeft: "30px",
                        borderRadius: "10px",
                        background: "#C2EABD",
                        padding: "10px",
                      }}
                      onChange={(e) => {
                        setLinenoise(e.target.checked);
                        setValidationError("");
                      }}
                    />
                  </Col>
                  <Col xs={6} className="mb-2">
                    <Form.Check
                      id="channoise-mobile"
                      type="checkbox"
                      label="Chan Noise"
                      checked={channoise}
                      disabled={!!status || isSubmitting}
                      style={{
                        textAlign: "left",
                        paddingLeft: "30px",
                        borderRadius: "10px",
                        background: "#32CBFF",
                        padding: "10px",
                      }}
                      onChange={(e) => {
                        setChannoise(e.target.checked);
                        setValidationError("");
                      }}
                    />
                  </Col>
                  <Col xs={6} className="mb-2">
                    <Form.Check
                      id="other-mobile"
                      type="checkbox"
                      label="Other"
                      checked={other}
                      disabled={!!status || isSubmitting}
                      style={{
                        textAlign: "left",
                        paddingLeft: "30px",
                        borderRadius: "10px",
                        background: "#DCF2B0",
                        padding: "10px",
                      }}
                      onChange={(e) => {
                        setOther(e.target.checked);
                        setValidationError("");
                      }}
                    />
                  </Col>
                  <Col xs={6} className="mb-2">
                    <Form.Check
                      id="unsure-mobile"
                      type="checkbox"
                      label="Unsure"
                      checked={unsure}
                      disabled={!!status || isSubmitting}
                      style={{
                        textAlign: "left",
                        paddingLeft: "30px",
                        borderRadius: "10px",
                        background: "#FFE5B4",
                        padding: "10px",
                      }}
                      onChange={(e) => {
                        setUnsure(e.target.checked);
                        setValidationError("");
                      }}
                    />
                  </Col>
                </Row>
              </Form.Group>

              <div style={{ marginTop: "20px" }}>
                <Row>
                  {!status && (
                    <Col xs={6} className="mb-2">
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => {
                          if (skipCooldown > 0) return;
                          setSkipCooldown(1);
                          getNext();

                          const countdown = setInterval(() => {
                            setSkipCooldown((prev) => {
                              if (prev <= 1) {
                                clearInterval(countdown);
                                return 0;
                              }
                              return prev - 1;
                            });
                          }, 1000);
                        }}
                        disabled={isSubmitting || skipCooldown > 0}
                        style={{
                          width: "100%",
                          opacity: skipCooldown > 0 ? 0.6 : 1,
                          cursor: skipCooldown > 0 ? "not-allowed" : "pointer",
                        }}
                      >
                        {skipCooldown > 0 ? (
                          `${skipCooldown}`
                        ) : (
                          <>
                            Skip <CaretRightFill />
                          </>
                        )}
                      </Button>
                    </Col>
                  )}
                  <Col xs={!status ? 6 : 12}>
                    {!status ? (
                      <Button
                        variant="primary"
                        type="button"
                        onClick={submitResults}
                        disabled={isSubmitting}
                        style={{ width: "100%" }}
                      >
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        type="button"
                        onClick={getNext}
                        style={{ width: "100%" }}
                      >
                        Next
                      </Button>
                    )}
                  </Col>
                </Row>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <br />
      {status === "success" && (
        <Container
          className="mobile-padding-sm"
          style={{ width: "100%", maxWidth: "600px" }}
        >
          <Alert variant="success">
            <Row>
              <Col xs={12} md={8} className="mb-2 mb-md-0">
                ✓ Label Successfully Submitted!
              </Col>
              <Col
                xs={12}
                md={4}
                style={{ display: "flex", justifyContent: "flex-end" }}
              >
                <LabelModal
                  open={true}
                  getStatus={true}
                  compName={labelFile}
                  compData={null}
                  pracData={null}
                />
              </Col>
            </Row>
          </Alert>
        </Container>
      )}
      {status === "failed" && (
        <Container
          className="mobile-padding-sm"
          style={{ width: "100%", maxWidth: "600px" }}
        >
          <Alert variant="danger">
            <Row>
              <Col xs={12} md={8} className="mb-2 mb-md-0">
                ✗ Label Submission Failed. {error}
              </Col>
              <Col
                xs={12}
                md={4}
                style={{ display: "flex", justifyContent: "flex-end" }}
              >
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => setStatus("")}
                  className="btn-responsive"
                >
                  Retry
                </Button>
              </Col>
            </Row>
          </Alert>
        </Container>
      )}
    </>
  );

  return (
    <AuthConsumer>
      {({ Auth, Name }) => {
        if (Auth === "Admin") {
          return (
            <div>
              <Sidebar />
              <div className="content-with-sidebar">
                <Container
                  className="mobile-padding-sm"
                  style={{ paddingBottom: "10px" }}
                >
                  <Card>
                    <Card.Header>
                      Hey {Name}, you are logged in as an admin. Your labeling
                      progress will be stored.
                    </Card.Header>
                  </Card>
                </Container>
                {renderLabelingInterface()}
              </div>
            </div>
          );
        } else if (Auth === "User") {
          return (
            <div>
              <Sidebar />
              <div className="content-with-sidebar">
                <Container
                  className="mobile-padding-sm"
                  style={{ paddingBottom: "10px" }}
                >
                  <Card>
                    <Card.Header>
                      Hey {Name}, you are logged in. Your labeling progress will
                      be stored.
                    </Card.Header>
                  </Card>
                </Container>
                {renderLabelingInterface()}
              </div>
            </div>
          );
        } else {
          return (
            <div>
              <Sidebar />
              <div className="content-with-sidebar">
                <Container
                  className="mobile-padding-sm"
                  style={{ padding: "50px 15px" }}
                >
                  <Alert variant="warning">
                    <Alert.Heading>Authentication Required</Alert.Heading>
                    <p>Labeling is not available as you have not logged in.</p>
                  </Alert>
                </Container>
                <Container className="mobile-padding-sm">
                  <Row>
                    <Col xs={12} md={6} className="mb-3 mb-md-0">
                      <Card>
                        <Card.Header as="h5">Practice</Card.Header>
                        <Card.Title style={{ padding: "20px" }}>
                          Available to all
                        </Card.Title>
                        <Container style={{ paddingBottom: "20px" }}>
                          <Card.Text style={{ textAlign: "left" }}>
                            Practice allows you to test your skills and get
                            feedback by seeing the results of labels submitted
                            by other people. Follow the link below to go to the
                            practice page.
                          </Card.Text>
                          <Card.Link href="/practice">Go Practice</Card.Link>
                        </Container>
                      </Card>
                    </Col>
                    <Col xs={12} md={6}>
                      <Card>
                        <Card.Header as="h5">Contribute</Card.Header>
                        <Card.Title style={{ padding: "20px" }}>
                          Only Available to Logged In Users
                        </Card.Title>
                        <Container style={{ paddingBottom: "20px" }}>
                          <Card.Text style={{ textAlign: "left" }}>
                            Contribute to the open source labeling by signing up
                            and going to the labeling page. Once there, your
                            results will be stored and used in furthering
                            training models. Please either signup or login using
                            the links below.
                          </Card.Text>
                          <Card.Link href="/signup">Signup</Card.Link>
                          <Card.Link href="/login">Login</Card.Link>
                        </Container>
                      </Card>
                    </Col>
                  </Row>
                </Container>
              </div>
            </div>
          );
        }
      }}
    </AuthConsumer>
  );
};

export default LabelPage;
