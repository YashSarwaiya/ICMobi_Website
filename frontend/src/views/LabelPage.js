import { React, useState, useEffect, useContext } from "react";
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

const LabelPage = () => {
  const context = useContext(AuthContext);

  //Loading variables
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        "Please select at least one label before submitting, or click Skip to move to the next component."
      );
      return false;
    }

    setValidationError("");
    return true;
  };

  const submitResults = async () => {
    // Validate selection first
    if (!validateSelection()) {
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    let tags = [];

    //Save the results
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
          timeout: 15000, // 15 second timeout
        }
      );

      if (response.data) {
        console.log("Submission successful:", response.data);
        setStatus("success");
        setValidationError("");
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
    setLabelImage(null);
    setLabelFile("");
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

    const email = localStorage.getItem("Email");

    if (!email || email === "guest") {
      setError("You must be logged in to label components.");
      setIsLoading(false);
      return;
    }

    console.log("Getting image file for:", email);

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

  const renderLabelingInterface = () => (
    <>
      {error && (
        <Container style={{ width: "50%", marginBottom: "10px" }}>
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
            <Button variant="outline-danger" size="sm" onClick={getNext}>
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
              setError("Failed to display image. The image may be corrupted.");
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
                disabled={!!status || isSubmitting}
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
                disabled={!!status || isSubmitting}
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
                disabled={!!status || isSubmitting}
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
                disabled={!!status || isSubmitting}
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
                disabled={!!status || isSubmitting}
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
                disabled={!!status || isSubmitting}
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
                disabled={!!status || isSubmitting}
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
                disabled={!!status || isSubmitting}
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

            {!status && (
              <Button
                variant="secondary"
                type="button"
                onClick={getNext}
                disabled={isSubmitting}
                style={{
                  position: "absolute",
                  bottom: "40px",
                }}
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
                style={{
                  position: "absolute",
                  bottom: 0,
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            ) : (
              <Button
                variant="primary"
                type="button"
                onClick={getNext}
                style={{
                  position: "absolute",
                  bottom: 0,
                }}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Container style={{ paddingTop: "50px" }}>
          <Alert variant="info">
            No image to display. Please click "Try Again" or refresh the page.
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
              <Col>✓ Label Successfully Submitted!</Col>
              <Col style={{ display: "flex", justifyContent: "flex-end" }}>
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
        <Container style={{ width: "50%" }}>
          <Alert variant="danger">
            <Row>
              <Col>✗ Label Submission Failed. {error}</Col>
              <Col style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => setStatus("")}
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
        //If admin
        if (Auth === "Admin") {
          return (
            <div>
              {width > 768 && <Sidebar />}
              <div
                style={{
                  paddingLeft: width > 768 ? "250px" : "0px",
                  paddingTop: "90px",
                }}
              >
                <Container style={{ paddingBottom: "10px" }}>
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
        }

        //If logged in user
        else if (Auth === "User") {
          return (
            <div>
              {width > 768 && <Sidebar />}
              <div
                style={{
                  paddingLeft: width > 768 ? "250px" : "0px",
                  paddingTop: "90px",
                }}
              >
                <Container style={{ paddingBottom: "10px" }}>
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
        }

        //If guest
        else {
          return (
            <div>
              {width > 768 && <Sidebar />}
              <div
                style={{
                  paddingLeft: width > 768 ? "250px" : "0px",
                  paddingTop: "90px",
                }}
              >
                <Container style={{ padding: "50px" }}>
                  <Alert variant="warning">
                    <Alert.Heading>Authentication Required</Alert.Heading>
                    <p>Labeling is not available as you have not logged in.</p>
                  </Alert>
                </Container>
                <Container>
                  <Row>
                    <Col>
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
                    <Col>
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
