import { React, useState, useEffect } from "react";
import axios from "axios";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Alert from "react-bootstrap/Alert";
import LoadingSpinner from "../components/LoadingSpinner";
import LabelModal from "../components/LabelModal";
import { AuthConsumer } from "../helpers/AuthContext";

import Sidebar from "../components/Sidebar";

const PracticePage = () => {
  //Loading variables
  const [isLoading, setIsLoading] = useState(false);

  //Width variables
  const [width, setWidth] = useState(window.innerWidth);

  //Label image data
  const [labelImage, setLabelImage] = useState(null);
  const [labelFile, setLabelFile] = useState("");

  //Checkbox values
  const [brain, setBrain] = useState(false);
  const [muscle, setMuscle] = useState(false);
  const [eye, setEye] = useState(false);
  const [heart, setHeart] = useState(false);
  const [linenoise, setLinenoise] = useState(false);
  const [channoise, setChannoise] = useState(false);
  const [other, setOther] = useState(false);
  const [unsure, setUnsure] = useState(false);

  //List of checkbox values
  const [prac, setPrac] = useState(null);

  //Submission
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleWindowSizeChange = () => {
    setWidth(window.innerWidth);
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
        "Please select at least one label before submitting to see results."
      );
      return false;
    }

    setValidationError("");
    return true;
  };

  const submitResults = () => {
    // Validate selection first
    if (!validateSelection()) {
      return;
    }

    let tags = [];

    //Save the results temporarily
    //Results will be pushed to label modal
    if (brain) {
      tags.push("Brain");
    }
    if (muscle) {
      tags.push("Muscle");
    }
    if (eye) {
      tags.push("Eye");
    }
    if (heart) {
      tags.push("Heart");
    }
    if (linenoise) {
      tags.push("Line Noise");
    }
    if (channoise) {
      tags.push("Channel Noise");
    }
    if (other) {
      tags.push("Other");
    }
    if (unsure) {
      tags.push("Unsure");
    }

    setPrac(tags);

    //Set status to always success since no submission is required
    setStatus("success");
  };

  const getNext = () => {
    console.log("Getting next practice image...");
    setStatus("");
    setError("");
    setValidationError("");
    setLabelImage(null);
    setLabelFile("");
    setPrac(null);
    getImage();
  };

  const getImage = async () => {
    // Prevent multiple simultaneous requests
    if (isLoading) {
      console.log("Already loading, skipping request");
      return;
    }

    //While getting image, loading is true
    setIsLoading(true);
    setError("");
    setValidationError("");

    //Set all checkboxes to blank
    setBrain(false);
    setMuscle(false);
    setEye(false);
    setHeart(false);
    setLinenoise(false);
    setChannoise(false);
    setOther(false);
    setUnsure(false);

    const email = localStorage.getItem("Email") || "guest";
    console.log("Getting practice image for:", email);

    try {
      // Get image filename
      const filenameResponse = await axios.get("/dropbox/imagefile", {
        params: { email: email },
        timeout: 30000,
      });

      console.log("Got filename:", filenameResponse.data);

      if (!filenameResponse.data) {
        throw new Error("No filename received from server");
      }

      const filename = filenameResponse.data;
      setLabelFile(filename);

      // Get image data
      const imageResponse = await axios.get("/dropbox/imagedata", {
        responseType: "arraybuffer",
        params: { imagefile: filename },
        timeout: 30000,
      });

      console.log("Got image data, size:", imageResponse.data.byteLength);

      if (!imageResponse.data || imageResponse.data.byteLength === 0) {
        throw new Error("Empty image data received");
      }

      // Convert to base64
      const base64 = btoa(
        new Uint8Array(imageResponse.data).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      setLabelImage(base64);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading image:", error);

      let errorMsg = "Error loading image. ";

      if (error.code === "ECONNABORTED") {
        errorMsg += "Request timed out. Please check your internet connection.";
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
  };

  useEffect(() => {
    if (!status && !labelImage && !isLoading) {
      getImage();
    }

    //Get window size
    window.addEventListener("resize", handleWindowSizeChange);
    return () => {
      window.removeEventListener("resize", handleWindowSizeChange);
    };
  }, []);

  return (
    <AuthConsumer>
      {({ Auth }) => {
        return (
          <div>
            {width > 768 && <Sidebar />}
            <div
              style={{
                paddingLeft: width > 768 ? "250px" : "0px",
                paddingTop: "90px",
              }}
            >
              <h2>Labeling Practice</h2>
              <p>
                Results will not be stored for practice. Test your skills and
                see how your labels compare with others!
              </p>

              {error && (
                <Container style={{ width: "50%", marginBottom: "10px" }}>
                  <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError("")}
                  >
                    <Alert.Heading>Error</Alert.Heading>
                    <p>{error}</p>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={getNext}
                    >
                      Try Again
                    </Button>
                  </Alert>
                </Container>
              )}

              {validationError && (
                <Container style={{ width: "50%", marginBottom: "10px" }}>
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
                    display: "flex",
                    position: "relative",
                    minHeight: "400px",
                  }}
                >
                  <img
                    src={`data:image/jpeg;charset=utf-8;base64,${labelImage}`}
                    alt="Labeling data"
                    width="80%"
                    height="auto"
                    style={{
                      border: "2px solid #C0C2C9",
                      opacity: status ? "0.33" : "1.0",
                    }}
                    onError={() => {
                      setError(
                        "Failed to display image. The image may be corrupted."
                      );
                      setLabelImage(null);
                    }}
                  />

                  <div>
                    <Form.Group
                      className="flex-row"
                      controlId="formBasicCheckbox"
                      style={{
                        opacity: status ? "0.33" : "1.0",
                      }}
                    >
                      <Form.Check
                        id="brain"
                        type="checkbox"
                        label="Brain"
                        checked={brain}
                        disabled={!!status}
                        style={{
                          textAlign: "left",
                          paddingLeft: "40px",
                          borderRadius: "10px",
                          background: "#00A5E0",
                          margin: "10px",
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
                        disabled={!!status}
                        style={{
                          textAlign: "left",
                          paddingLeft: "40px",
                          borderRadius: "10px",
                          background: "#EF9CDA",
                          margin: "10px",
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
                        disabled={!!status}
                        style={{
                          textAlign: "left",
                          paddingLeft: "40px",
                          borderRadius: "10px",
                          background: "#89A1EF",
                          margin: "10px",
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
                        disabled={!!status}
                        style={{
                          textAlign: "left",
                          paddingLeft: "40px",
                          borderRadius: "10px",
                          background: "#FECEF1",
                          margin: "10px",
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
                        disabled={!!status}
                        style={{
                          textAlign: "left",
                          paddingLeft: "40px",
                          borderRadius: "10px",
                          background: "#C2EABD",
                          margin: "10px",
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
                        disabled={!!status}
                        style={{
                          textAlign: "left",
                          paddingLeft: "40px",
                          borderRadius: "10px",
                          background: "#32CBFF",
                          margin: "10px",
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
                        disabled={!!status}
                        style={{
                          textAlign: "left",
                          paddingLeft: "40px",
                          borderRadius: "10px",
                          background: "#DCF2B0",
                          margin: "10px",
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
                        disabled={!!status}
                        style={{
                          textAlign: "left",
                          paddingLeft: "40px",
                          borderRadius: "10px",
                          background: "#FFE5B4",
                          margin: "10px",
                        }}
                        onChange={(e) => {
                          setUnsure(e.target.checked);
                          setValidationError("");
                        }}
                      />
                    </Form.Group>
                    <Button
                      variant="info"
                      type="button"
                      onClick={submitResults}
                      disabled={!!status}
                      style={{
                        position: "absolute",
                        bottom: 0,
                      }}
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              ) : (
                <Container style={{ paddingTop: "50px" }}>
                  <Alert variant="info">
                    No image to display. Please click "Try Again" or refresh the
                    page.
                  </Alert>
                  <Button variant="primary" onClick={getNext}>
                    Load Image
                  </Button>
                </Container>
              )}

              <br />
              {status === "success" && (
                <Container style={{ width: "50%" }}>
                  <Alert variant="success">
                    <Row>
                      <Col>
                        ✓ Labels Submitted! See how your labels compare with
                        others.
                      </Col>
                      <Col
                        style={{ display: "flex", justifyContent: "flex-end" }}
                      >
                        <LabelModal
                          open={true}
                          getStatus={true}
                          compName={labelFile}
                          compData={null}
                          pracData={prac}
                        />
                        <Button
                          variant="primary"
                          onClick={getNext}
                          style={{ marginLeft: "10px" }}
                        >
                          Next
                        </Button>
                      </Col>
                    </Row>
                  </Alert>
                </Container>
              )}
            </div>
          </div>
        );
      }}
    </AuthConsumer>
  );
};

export default PracticePage;
