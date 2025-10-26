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
  const isMountedRef = useRef(true);
  const currentBlobRef = useRef(null);
  const nextBlobRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [labelImage, setLabelImage] = useState(null);
  const [labelFile, setLabelFile] = useState("");

  const [nextImage, setNextImage] = useState(null);
  const [nextFile, setNextFile] = useState("");
  const [isPrefetching, setIsPrefetching] = useState(false);

  const [brain, setBrain] = useState(false);
  const [muscle, setMuscle] = useState(false);
  const [eye, setEye] = useState(false);
  const [heart, setHeart] = useState(false);
  const [linenoise, setLinenoise] = useState(false);
  const [channoise, setChannoise] = useState(false);
  const [other, setOther] = useState(false);
  const [unsure, setUnsure] = useState(false);

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (currentBlobRef.current) {
        URL.revokeObjectURL(currentBlobRef.current);
      }
      if (nextBlobRef.current) {
        URL.revokeObjectURL(nextBlobRef.current);
      }
    };
  }, []);

  const revokeBlobURL = (url) => {
    if (url && url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn("Failed to revoke blob URL:", e);
      }
    }
  };

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

  const prefetchNextImage = async (email) => {
    if (isPrefetching || !email || email === "guest" || !isMountedRef.current)
      return;

    setIsPrefetching(true);

    try {
      const filenameResponse = await axios.get("/dropbox/imagefile", {
        params: { email },
        timeout: 30000,
      });

      const filename = filenameResponse.data;

      if (!filename || !isMountedRef.current) {
        setIsPrefetching(false);
        return;
      }

      const cachedUrl = sessionStorage.getItem(`img_${filename}`);
      if (cachedUrl) {
        if (isMountedRef.current) {
          setNextFile(filename);
          setNextImage(cachedUrl);
          nextBlobRef.current = cachedUrl;
        }
        setIsPrefetching(false);
        return;
      }

      const imageResponse = await axios.get("/dropbox/imagedata", {
        responseType: "blob",
        params: { imagefile: filename },
        timeout: 30000,
      });

      if (!isMountedRef.current) {
        setIsPrefetching(false);
        return;
      }

      const imageUrl = URL.createObjectURL(imageResponse.data);

      try {
        sessionStorage.setItem(`img_${filename}`, imageUrl);
      } catch (e) {
        const keys = Object.keys(sessionStorage);
        keys
          .filter((k) => k.startsWith("img_"))
          .slice(0, 10)
          .forEach((k) => sessionStorage.removeItem(k));
        try {
          sessionStorage.setItem(`img_${filename}`, imageUrl);
        } catch (e2) {}
      }

      if (isMountedRef.current) {
        setNextImage(imageUrl);
        setNextFile(filename);
        nextBlobRef.current = imageUrl;
      } else {
        URL.revokeObjectURL(imageUrl);
      }
    } catch (error) {
      console.error("Prefetch error:", error);
    } finally {
      if (isMountedRef.current) {
        setIsPrefetching(false);
      }
    }
  };

  const submitResults = async () => {
    if (!validateSelection() || isSubmitting) return;

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
        { timeout: 15000 }
      );

      if (response.data && isMountedRef.current) {
        setStatus("success");
        setValidationError("");
        prefetchNextImage(context.Email);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setStatus("failed");
        setError(
          err.response?.data?.message || err.message || "Submission failed."
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const getNext = () => {
    setStatus("");
    setError("");
    setValidationError("");

    if (currentBlobRef.current) {
      revokeBlobURL(currentBlobRef.current);
      currentBlobRef.current = null;
    }

    setLabelImage(null);
    setLabelFile("");
    getImage();
  };

  const getImage = async () => {
    if (nextImage && nextFile && isMountedRef.current) {
      setLabelImage(nextImage);
      setLabelFile(nextFile);

      currentBlobRef.current = nextImage;

      if (nextBlobRef.current === nextImage) {
        nextBlobRef.current = null;
      }

      setNextImage(null);
      setNextFile("");

      setBrain(false);
      setMuscle(false);
      setEye(false);
      setHeart(false);
      setLinenoise(false);
      setChannoise(false);
      setOther(false);
      setUnsure(false);

      const email = localStorage.getItem("Email");
      if (email && email !== "guest") {
        setTimeout(() => prefetchNextImage(email), 100);
      }

      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setError("");
    setValidationError("");

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

    try {
      const filenameResponse = await axios.get("/dropbox/imagefile", {
        params: { email: email },
        timeout: 30000,
      });

      if (!filenameResponse.data || !isMountedRef.current) {
        throw new Error("No filename received from server");
      }

      const filename = filenameResponse.data;
      setLabelFile(filename);

      const cachedUrl = sessionStorage.getItem(`img_${filename}`);
      if (cachedUrl && isMountedRef.current) {
        setLabelImage(cachedUrl);
        currentBlobRef.current = cachedUrl;
        setIsLoading(false);
        prefetchNextImage(email);
        return;
      }

      const imageResponse = await axios.get("/dropbox/imagedata", {
        responseType: "blob",
        params: { imagefile: filename },
        timeout: 30000,
      });

      if (
        !imageResponse.data ||
        imageResponse.data.size === 0 ||
        !isMountedRef.current
      ) {
        throw new Error("Empty image data received");
      }

      const imageUrl = URL.createObjectURL(imageResponse.data);

      try {
        sessionStorage.setItem(`img_${filename}`, imageUrl);
      } catch (e) {
        const keys = Object.keys(sessionStorage);
        keys
          .filter((k) => k.startsWith("img_"))
          .slice(0, 10)
          .forEach((k) => sessionStorage.removeItem(k));
      }

      if (isMountedRef.current) {
        setLabelImage(imageUrl);
        currentBlobRef.current = imageUrl;
        setIsLoading(false);
        prefetchNextImage(email);
      } else {
        URL.revokeObjectURL(imageUrl);
      }
    } catch (error) {
      if (isMountedRef.current) {
        let errorMsg = "Error loading image. ";
        if (error.code === "ECONNABORTED") {
          errorMsg += "Request timed out.";
        } else if (error.response) {
          errorMsg +=
            error.response.data?.error ||
            error.response.statusText ||
            "Server error.";
        } else if (error.request) {
          errorMsg += "No response from server.";
        } else {
          errorMsg += error.message || "Unknown error.";
        }
        setError(errorMsg);
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!status && !labelImage && !isLoading && isMountedRef.current) {
      getImage();
    }
  }, []);

  const renderLabelingInterface = () => (
    <>
      {error && (
        <Container
          className="mobile-padding-sm"
          style={{ width: "100%", maxWidth: "600px", marginBottom: "10px" }}
        >
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={getNext}
              className="btn-responsive"
            >
              Try Again
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
            <Alert.Heading>Validation Error</Alert.Heading>
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
          <div
            className="hide-mobile"
            style={{ display: "flex", flexDirection: "row", gap: "20px" }}
          >
            <div style={{ flex: "1", minWidth: "0" }}>
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
                onError={() => {
                  setError("Failed to display image.");
                  setLabelImage(null);
                }}
              />
            </div>

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
                style={{ opacity: status ? "0.33" : "1.0", flex: "1" }}
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
                    onClick={getNext}
                    disabled={isSubmitting}
                    className="mb-2"
                    style={{ width: "100%" }}
                  >
                    Skip <CaretRightFill />
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
                onError={() => {
                  setError("Failed to display image.");
                  setLabelImage(null);
                }}
              />
            </div>
            <div>
              <Form.Group
                controlId="formBasicCheckboxMobile"
                style={{ opacity: status ? "0.33" : "1.0" }}
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
                        onClick={getNext}
                        disabled={isSubmitting}
                        style={{ width: "100%" }}
                      >
                        Skip <CaretRightFill />
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
      ) : (
        <Container className="mobile-padding-sm" style={{ paddingTop: "50px" }}>
          <Alert variant="info">No image to display.</Alert>
          <Button
            variant="primary"
            onClick={getNext}
            className="btn-responsive"
          >
            Load Image
          </Button>
        </Container>
      )}

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
                ✗ Submission Failed. {error}
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
