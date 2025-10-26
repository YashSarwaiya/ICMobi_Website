// // import { React, useState, useEffect, useContext } from "react";
// // import axios from "axios";
// // import Form from "react-bootstrap/Form";
// // import Button from "react-bootstrap/Button";
// // import Container from "react-bootstrap/Container";
// // import Card from "react-bootstrap/Card";
// // import Row from "react-bootstrap/Row";
// // import Col from "react-bootstrap/Col";
// // import Alert from "react-bootstrap/Alert";
// // import { CaretRightFill } from "react-bootstrap-icons";
// // import LoadingSpinner from "../components/LoadingSpinner";
// // import LabelModal from "../components/LabelModal";
// // import { AuthContext, AuthConsumer } from "../helpers/AuthContext";
// // import Sidebar from "../components/Sidebar";
// // import "../styles/responsive.css";

// // const LabelPage = () => {
// //   const context = useContext(AuthContext);

// //   //Loading variables
// //   const [isLoading, setIsLoading] = useState(false);
// //   const [isSubmitting, setIsSubmitting] = useState(false);

// //   //Label image data
// //   const [labelImage, setLabelImage] = useState(null);
// //   const [labelFile, setLabelFile] = useState("");

// //   //Checkbox values
// //   const [brain, setBrain] = useState(false);
// //   const [muscle, setMuscle] = useState(false);
// //   const [eye, setEye] = useState(false);
// //   const [heart, setHeart] = useState(false);
// //   const [linenoise, setLinenoise] = useState(false);
// //   const [channoise, setChannoise] = useState(false);
// //   const [other, setOther] = useState(false);
// //   const [unsure, setUnsure] = useState(false);

// //   //Submission
// //   const [status, setStatus] = useState("");
// //   const [error, setError] = useState("");
// //   const [validationError, setValidationError] = useState("");

// //   // Cleanup blob URLs when component unmounts or image changes
// //   useEffect(() => {
// //     return () => {
// //       if (labelImage && labelImage.startsWith("blob:")) {
// //         URL.revokeObjectURL(labelImage);
// //       }
// //     };
// //   }, [labelImage]);

// //   const validateSelection = () => {
// //     const hasSelection =
// //       brain ||
// //       muscle ||
// //       eye ||
// //       heart ||
// //       linenoise ||
// //       channoise ||
// //       other ||
// //       unsure;

// //     if (!hasSelection) {
// //       setValidationError(
// //         "Please select at least one label before submitting, or click Skip to move to the next component."
// //       );
// //       return false;
// //     }

// //     setValidationError("");
// //     return true;
// //   };

// //   const submitResults = async () => {
// //     // Validate selection first
// //     if (!validateSelection()) {
// //       return;
// //     }

// //     // Prevent double submission
// //     if (isSubmitting) {
// //       return;
// //     }

// //     setIsSubmitting(true);
// //     setError("");

// //     let tags = [];

// //     //Save the results
// //     if (brain) {
// //       tags.push("Brain");
// //     }
// //     if (muscle) {
// //       tags.push("Muscle");
// //     }
// //     if (eye) {
// //       tags.push("Eye");
// //     }
// //     if (heart) {
// //       tags.push("Heart");
// //     }
// //     if (linenoise) {
// //       tags.push("Line Noise");
// //     }
// //     if (channoise) {
// //       tags.push("Channel Noise");
// //     }
// //     if (other) {
// //       tags.push("Other");
// //     }
// //     if (unsure) {
// //       tags.push("Unsure");
// //     }

// //     try {
// //       const response = await axios.post(
// //         "/api/components/submit",
// //         {
// //           name: labelFile,
// //           email: context.Email,
// //           tags: tags,
// //           domain: context.Domain,
// //           weight: context.Weight,
// //         },
// //         {
// //           timeout: 15000, // 15 second timeout
// //         }
// //       );

// //       if (response.data) {
// //         console.log("Submission successful:", response.data);
// //         setStatus("success");
// //         setValidationError("");
// //       } else {
// //         throw new Error("Empty response from server");
// //       }
// //     } catch (err) {
// //       console.error("Submission error:", err);
// //       setStatus("failed");
// //       setError(
// //         err.response?.data?.message ||
// //           err.message ||
// //           "Submission failed. Please try again."
// //       );
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };

// //   const getNext = () => {
// //     console.log("Getting next image...");
// //     setStatus("");
// //     setError("");
// //     setValidationError("");

// //     // Revoke old blob URL before getting new image
// //     if (labelImage && labelImage.startsWith("blob:")) {
// //       URL.revokeObjectURL(labelImage);
// //     }

// //     setLabelImage(null);
// //     setLabelFile("");
// //     getImage();
// //   };

// //   const getImage = async () => {
// //     // Prevent multiple simultaneous requests
// //     if (isLoading) {
// //       console.log("Already loading, skipping request");
// //       return;
// //     }

// //     //While getting image, loading is true
// //     setIsLoading(true);
// //     setError("");
// //     setValidationError("");

// //     //Set all checkboxes to blank
// //     setBrain(false);
// //     setMuscle(false);
// //     setEye(false);
// //     setHeart(false);
// //     setLinenoise(false);
// //     setChannoise(false);
// //     setOther(false);
// //     setUnsure(false);

// //     const email = localStorage.getItem("Email");

// //     if (!email || email === "guest") {
// //       setError("You must be logged in to label components.");
// //       setIsLoading(false);
// //       return;
// //     }

// //     console.log("Getting image file for:", email);

// //     try {
// //       // Get image filename
// //       const filenameResponse = await axios.get("/dropbox/imagefile", {
// //         params: { email: email },
// //         timeout: 30000,
// //       });

// //       console.log("Got filename:", filenameResponse.data);

// //       if (!filenameResponse.data) {
// //         throw new Error("No filename received from server");
// //       }

// //       const filename = filenameResponse.data;
// //       setLabelFile(filename);

// //       // Check sessionStorage cache first
// //       const cachedUrl = sessionStorage.getItem(`img_${filename}`);
// //       if (cachedUrl) {
// //         console.log("✓ Using cached image URL");
// //         setLabelImage(cachedUrl);
// //         setIsLoading(false);
// //         return;
// //       }

// //       // Get image data as BLOB (much faster than base64)
// //       console.log("✗ Fetching image from server:", filename);
// //       const imageResponse = await axios.get("/dropbox/imagedata", {
// //         responseType: "blob",
// //         params: { imagefile: filename },
// //         timeout: 30000,
// //       });

// //       console.log("Got image data, size:", imageResponse.data.size, "bytes");

// //       if (!imageResponse.data || imageResponse.data.size === 0) {
// //         throw new Error("Empty image data received");
// //       }

// //       // Create object URL from blob
// //       const imageUrl = URL.createObjectURL(imageResponse.data);

// //       // Cache the URL in sessionStorage
// //       try {
// //         sessionStorage.setItem(`img_${filename}`, imageUrl);
// //       } catch (e) {
// //         console.warn("SessionStorage full, clearing cache");
// //         const keys = Object.keys(sessionStorage);
// //         keys
// //           .filter((k) => k.startsWith("img_"))
// //           .slice(0, 10)
// //           .forEach((k) => sessionStorage.removeItem(k));
// //       }

// //       setLabelImage(imageUrl);
// //       setIsLoading(false);
// //     } catch (error) {
// //       console.error("Error loading image:", error);

// //       let errorMsg = "Error loading image. ";

// //       if (error.code === "ECONNABORTED") {
// //         errorMsg += "Request timed out. Please check your internet connection.";
// //       } else if (error.response) {
// //         errorMsg +=
// //           error.response.data?.error ||
// //           error.response.statusText ||
// //           "Server error.";
// //       } else if (error.request) {
// //         errorMsg += "No response from server. Please check your connection.";
// //       } else {
// //         errorMsg += error.message || "Unknown error occurred.";
// //       }

// //       setError(errorMsg);
// //       setIsLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     if (!status && !labelImage && !isLoading) {
// //       getImage();
// //     }
// //   }, []);

// //   const renderLabelingInterface = () => (
// //     <>
// //       {error && (
// //         <Container
// //           className="mobile-padding-sm"
// //           style={{ width: "100%", maxWidth: "600px", marginBottom: "10px" }}
// //         >
// //           <Alert variant="danger" dismissible onClose={() => setError("")}>
// //             <Alert.Heading>Error</Alert.Heading>
// //             <p>{error}</p>
// //             <Button
// //               variant="outline-danger"
// //               size="sm"
// //               onClick={getNext}
// //               className="btn-responsive"
// //             >
// //               Try Again
// //             </Button>
// //           </Alert>
// //         </Container>
// //       )}

// //       {validationError && (
// //         <Container
// //           className="mobile-padding-sm"
// //           style={{ width: "100%", maxWidth: "600px", marginBottom: "10px" }}
// //         >
// //           <Alert
// //             variant="warning"
// //             dismissible
// //             onClose={() => setValidationError("")}
// //           >
// //             <Alert.Heading>Validation Error</Alert.Heading>
// //             <p>{validationError}</p>
// //           </Alert>
// //         </Container>
// //       )}

// //       {isLoading ? (
// //         <LoadingSpinner />
// //       ) : labelImage ? (
// //         <div
// //           style={{
// //             width: "100%",
// //             maxWidth: "1200px",
// //             margin: "0 auto",
// //             padding: "10px",
// //           }}
// //         >
// //           {/* DESKTOP: Side by side */}
// //           <div
// //             className="hide-mobile"
// //             style={{
// //               display: "flex",
// //               flexDirection: "row",
// //               gap: "20px",
// //             }}
// //           >
// //             {/* Image on left */}
// //             <div style={{ flex: "1", minWidth: "0" }}>
// //               <img
// //                 src={labelImage}
// //                 alt="Labeling data"
// //                 className="img-responsive"
// //                 style={{
// //                   width: "100%",
// //                   height: "auto",
// //                   border: "2px solid #C0C2C9",
// //                   opacity: status ? "0.33" : "1.0",
// //                 }}
// //                 onError={() => {
// //                   setError(
// //                     "Failed to display image. The image may be corrupted."
// //                   );
// //                   setLabelImage(null);
// //                 }}
// //               />
// //             </div>

// //             {/* Options on right */}
// //             <div
// //               style={{
// //                 flex: "0 0 auto",
// //                 minWidth: "180px",
// //                 maxWidth: "200px",
// //                 display: "flex",
// //                 flexDirection: "column",
// //               }}
// //             >
// //               <Form.Group
// //                 className="flex-column"
// //                 controlId="formBasicCheckbox"
// //                 style={{
// //                   opacity: status ? "0.33" : "1.0",
// //                   flex: "1",
// //                 }}
// //               >
// //                 <Form.Check
// //                   id="brain"
// //                   type="checkbox"
// //                   label="Brain"
// //                   checked={brain}
// //                   disabled={!!status || isSubmitting}
// //                   className="mb-2"
// //                   style={{
// //                     textAlign: "left",
// //                     paddingLeft: "40px",
// //                     borderRadius: "10px",
// //                     background: "#00A5E0",
// //                   }}
// //                   onChange={(e) => {
// //                     setBrain(e.target.checked);
// //                     setValidationError("");
// //                   }}
// //                 />
// //                 <Form.Check
// //                   id="muscle"
// //                   type="checkbox"
// //                   label="Muscle"
// //                   checked={muscle}
// //                   disabled={!!status || isSubmitting}
// //                   className="mb-2"
// //                   style={{
// //                     textAlign: "left",
// //                     paddingLeft: "40px",
// //                     borderRadius: "10px",
// //                     background: "#EF9CDA",
// //                   }}
// //                   onChange={(e) => {
// //                     setMuscle(e.target.checked);
// //                     setValidationError("");
// //                   }}
// //                 />
// //                 <Form.Check
// //                   id="eye"
// //                   type="checkbox"
// //                   label="Eye"
// //                   checked={eye}
// //                   disabled={!!status || isSubmitting}
// //                   className="mb-2"
// //                   style={{
// //                     textAlign: "left",
// //                     paddingLeft: "40px",
// //                     borderRadius: "10px",
// //                     background: "#89A1EF",
// //                   }}
// //                   onChange={(e) => {
// //                     setEye(e.target.checked);
// //                     setValidationError("");
// //                   }}
// //                 />
// //                 <Form.Check
// //                   id="heart"
// //                   type="checkbox"
// //                   label="Heart"
// //                   checked={heart}
// //                   disabled={!!status || isSubmitting}
// //                   className="mb-2"
// //                   style={{
// //                     textAlign: "left",
// //                     paddingLeft: "40px",
// //                     borderRadius: "10px",
// //                     background: "#FECEF1",
// //                   }}
// //                   onChange={(e) => {
// //                     setHeart(e.target.checked);
// //                     setValidationError("");
// //                   }}
// //                 />
// //                 <Form.Check
// //                   id="linenoise"
// //                   type="checkbox"
// //                   label="Line Noise"
// //                   checked={linenoise}
// //                   disabled={!!status || isSubmitting}
// //                   className="mb-2"
// //                   style={{
// //                     textAlign: "left",
// //                     paddingLeft: "40px",
// //                     borderRadius: "10px",
// //                     background: "#C2EABD",
// //                   }}
// //                   onChange={(e) => {
// //                     setLinenoise(e.target.checked);
// //                     setValidationError("");
// //                   }}
// //                 />
// //                 <Form.Check
// //                   id="channoise"
// //                   type="checkbox"
// //                   label="Chan Noise"
// //                   checked={channoise}
// //                   disabled={!!status || isSubmitting}
// //                   className="mb-2"
// //                   style={{
// //                     textAlign: "left",
// //                     paddingLeft: "40px",
// //                     borderRadius: "10px",
// //                     background: "#32CBFF",
// //                   }}
// //                   onChange={(e) => {
// //                     setChannoise(e.target.checked);
// //                     setValidationError("");
// //                   }}
// //                 />
// //                 <Form.Check
// //                   id="other"
// //                   type="checkbox"
// //                   label="Other"
// //                   checked={other}
// //                   disabled={!!status || isSubmitting}
// //                   className="mb-2"
// //                   style={{
// //                     textAlign: "left",
// //                     paddingLeft: "40px",
// //                     borderRadius: "10px",
// //                     background: "#DCF2B0",
// //                   }}
// //                   onChange={(e) => {
// //                     setOther(e.target.checked);
// //                     setValidationError("");
// //                   }}
// //                 />
// //                 <Form.Check
// //                   id="unsure"
// //                   type="checkbox"
// //                   label="Unsure"
// //                   checked={unsure}
// //                   disabled={!!status || isSubmitting}
// //                   className="mb-2"
// //                   style={{
// //                     textAlign: "left",
// //                     paddingLeft: "40px",
// //                     borderRadius: "10px",
// //                     background: "#FFE5B4",
// //                   }}
// //                   onChange={(e) => {
// //                     setUnsure(e.target.checked);
// //                     setValidationError("");
// //                   }}
// //                 />
// //               </Form.Group>

// //               <div className="mt-auto" style={{ marginTop: "20px" }}>
// //                 {!status && (
// //                   <Button
// //                     variant="secondary"
// //                     type="button"
// //                     onClick={getNext}
// //                     disabled={isSubmitting}
// //                     className="mb-2"
// //                     style={{ width: "100%" }}
// //                   >
// //                     Skip <CaretRightFill />
// //                   </Button>
// //                 )}
// //                 {!status ? (
// //                   <Button
// //                     variant="primary"
// //                     type="button"
// //                     onClick={submitResults}
// //                     disabled={isSubmitting}
// //                     style={{ width: "100%" }}
// //                   >
// //                     {isSubmitting ? "Submitting..." : "Submit"}
// //                   </Button>
// //                 ) : (
// //                   <Button
// //                     variant="primary"
// //                     type="button"
// //                     onClick={getNext}
// //                     style={{ width: "100%" }}
// //                   >
// //                     Next
// //                   </Button>
// //                 )}
// //               </div>
// //             </div>
// //           </div>

// //           {/* MOBILE: Image on top, options below */}
// //           <div className="show-mobile">
// //             {/* Image on top */}
// //             <div style={{ marginBottom: "20px" }}>
// //               <img
// //                 src={labelImage}
// //                 alt="Labeling data"
// //                 className="img-responsive"
// //                 style={{
// //                   width: "100%",
// //                   height: "auto",
// //                   border: "2px solid #C0C2C9",
// //                   opacity: status ? "0.33" : "1.0",
// //                 }}
// //                 onError={() => {
// //                   setError(
// //                     "Failed to display image. The image may be corrupted."
// //                   );
// //                   setLabelImage(null);
// //                 }}
// //               />
// //             </div>

// //             {/* Options below */}
// //             <div>
// //               <Form.Group
// //                 controlId="formBasicCheckboxMobile"
// //                 style={{
// //                   opacity: status ? "0.33" : "1.0",
// //                 }}
// //               >
// //                 <Row>
// //                   <Col xs={6} className="mb-2">
// //                     <Form.Check
// //                       id="brain-mobile"
// //                       type="checkbox"
// //                       label="Brain"
// //                       checked={brain}
// //                       disabled={!!status || isSubmitting}
// //                       style={{
// //                         textAlign: "left",
// //                         paddingLeft: "30px",
// //                         borderRadius: "10px",
// //                         background: "#00A5E0",
// //                         padding: "10px",
// //                       }}
// //                       onChange={(e) => {
// //                         setBrain(e.target.checked);
// //                         setValidationError("");
// //                       }}
// //                     />
// //                   </Col>
// //                   <Col xs={6} className="mb-2">
// //                     <Form.Check
// //                       id="muscle-mobile"
// //                       type="checkbox"
// //                       label="Muscle"
// //                       checked={muscle}
// //                       disabled={!!status || isSubmitting}
// //                       style={{
// //                         textAlign: "left",
// //                         paddingLeft: "30px",
// //                         borderRadius: "10px",
// //                         background: "#EF9CDA",
// //                         padding: "10px",
// //                       }}
// //                       onChange={(e) => {
// //                         setMuscle(e.target.checked);
// //                         setValidationError("");
// //                       }}
// //                     />
// //                   </Col>
// //                   <Col xs={6} className="mb-2">
// //                     <Form.Check
// //                       id="eye-mobile"
// //                       type="checkbox"
// //                       label="Eye"
// //                       checked={eye}
// //                       disabled={!!status || isSubmitting}
// //                       style={{
// //                         textAlign: "left",
// //                         paddingLeft: "30px",
// //                         borderRadius: "10px",
// //                         background: "#89A1EF",
// //                         padding: "10px",
// //                       }}
// //                       onChange={(e) => {
// //                         setEye(e.target.checked);
// //                         setValidationError("");
// //                       }}
// //                     />
// //                   </Col>
// //                   <Col xs={6} className="mb-2">
// //                     <Form.Check
// //                       id="heart-mobile"
// //                       type="checkbox"
// //                       label="Heart"
// //                       checked={heart}
// //                       disabled={!!status || isSubmitting}
// //                       style={{
// //                         textAlign: "left",
// //                         paddingLeft: "30px",
// //                         borderRadius: "10px",
// //                         background: "#FECEF1",
// //                         padding: "10px",
// //                       }}
// //                       onChange={(e) => {
// //                         setHeart(e.target.checked);
// //                         setValidationError("");
// //                       }}
// //                     />
// //                   </Col>
// //                   <Col xs={6} className="mb-2">
// //                     <Form.Check
// //                       id="linenoise-mobile"
// //                       type="checkbox"
// //                       label="Line Noise"
// //                       checked={linenoise}
// //                       disabled={!!status || isSubmitting}
// //                       style={{
// //                         textAlign: "left",
// //                         paddingLeft: "30px",
// //                         borderRadius: "10px",
// //                         background: "#C2EABD",
// //                         padding: "10px",
// //                       }}
// //                       onChange={(e) => {
// //                         setLinenoise(e.target.checked);
// //                         setValidationError("");
// //                       }}
// //                     />
// //                   </Col>
// //                   <Col xs={6} className="mb-2">
// //                     <Form.Check
// //                       id="channoise-mobile"
// //                       type="checkbox"
// //                       label="Chan Noise"
// //                       checked={channoise}
// //                       disabled={!!status || isSubmitting}
// //                       style={{
// //                         textAlign: "left",
// //                         paddingLeft: "30px",
// //                         borderRadius: "10px",
// //                         background: "#32CBFF",
// //                         padding: "10px",
// //                       }}
// //                       onChange={(e) => {
// //                         setChannoise(e.target.checked);
// //                         setValidationError("");
// //                       }}
// //                     />
// //                   </Col>
// //                   <Col xs={6} className="mb-2">
// //                     <Form.Check
// //                       id="other-mobile"
// //                       type="checkbox"
// //                       label="Other"
// //                       checked={other}
// //                       disabled={!!status || isSubmitting}
// //                       style={{
// //                         textAlign: "left",
// //                         paddingLeft: "30px",
// //                         borderRadius: "10px",
// //                         background: "#DCF2B0",
// //                         padding: "10px",
// //                       }}
// //                       onChange={(e) => {
// //                         setOther(e.target.checked);
// //                         setValidationError("");
// //                       }}
// //                     />
// //                   </Col>
// //                   <Col xs={6} className="mb-2">
// //                     <Form.Check
// //                       id="unsure-mobile"
// //                       type="checkbox"
// //                       label="Unsure"
// //                       checked={unsure}
// //                       disabled={!!status || isSubmitting}
// //                       style={{
// //                         textAlign: "left",
// //                         paddingLeft: "30px",
// //                         borderRadius: "10px",
// //                         background: "#FFE5B4",
// //                         padding: "10px",
// //                       }}
// //                       onChange={(e) => {
// //                         setUnsure(e.target.checked);
// //                         setValidationError("");
// //                       }}
// //                     />
// //                   </Col>
// //                 </Row>
// //               </Form.Group>

// //               <div style={{ marginTop: "20px" }}>
// //                 <Row>
// //                   {!status && (
// //                     <Col xs={6} className="mb-2">
// //                       <Button
// //                         variant="secondary"
// //                         type="button"
// //                         onClick={getNext}
// //                         disabled={isSubmitting}
// //                         style={{ width: "100%" }}
// //                       >
// //                         Skip <CaretRightFill />
// //                       </Button>
// //                     </Col>
// //                   )}
// //                   <Col xs={!status ? 6 : 12}>
// //                     {!status ? (
// //                       <Button
// //                         variant="primary"
// //                         type="button"
// //                         onClick={submitResults}
// //                         disabled={isSubmitting}
// //                         style={{ width: "100%" }}
// //                       >
// //                         {isSubmitting ? "Submitting..." : "Submit"}
// //                       </Button>
// //                     ) : (
// //                       <Button
// //                         variant="primary"
// //                         type="button"
// //                         onClick={getNext}
// //                         style={{ width: "100%" }}
// //                       >
// //                         Next
// //                       </Button>
// //                     )}
// //                   </Col>
// //                 </Row>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       ) : (
// //         <Container className="mobile-padding-sm" style={{ paddingTop: "50px" }}>
// //           <Alert variant="info">
// //             No image to display. Please click "Try Again" or refresh the page.
// //           </Alert>
// //           <Button
// //             variant="primary"
// //             onClick={getNext}
// //             className="btn-responsive"
// //           >
// //             Load Image
// //           </Button>
// //         </Container>
// //       )}

// //       <br />
// //       {status === "success" && (
// //         <Container
// //           className="mobile-padding-sm"
// //           style={{ width: "100%", maxWidth: "600px" }}
// //         >
// //           <Alert variant="success">
// //             <Row>
// //               <Col xs={12} md={8} className="mb-2 mb-md-0">
// //                 ✓ Label Successfully Submitted!
// //               </Col>
// //               <Col
// //                 xs={12}
// //                 md={4}
// //                 style={{ display: "flex", justifyContent: "flex-end" }}
// //               >
// //                 <LabelModal
// //                   open={true}
// //                   getStatus={true}
// //                   compName={labelFile}
// //                   compData={null}
// //                   pracData={null}
// //                 />
// //               </Col>
// //             </Row>
// //           </Alert>
// //         </Container>
// //       )}
// //       {status === "failed" && (
// //         <Container
// //           className="mobile-padding-sm"
// //           style={{ width: "100%", maxWidth: "600px" }}
// //         >
// //           <Alert variant="danger">
// //             <Row>
// //               <Col xs={12} md={8} className="mb-2 mb-md-0">
// //                 ✗ Label Submission Failed. {error}
// //               </Col>
// //               <Col
// //                 xs={12}
// //                 md={4}
// //                 style={{ display: "flex", justifyContent: "flex-end" }}
// //               >
// //                 <Button
// //                   variant="outline-danger"
// //                   size="sm"
// //                   onClick={() => setStatus("")}
// //                   className="btn-responsive"
// //                 >
// //                   Retry
// //                 </Button>
// //               </Col>
// //             </Row>
// //           </Alert>
// //         </Container>
// //       )}
// //     </>
// //   );

// //   return (
// //     <AuthConsumer>
// //       {({ Auth, Name }) => {
// //         //If admin
// //         if (Auth === "Admin") {
// //           return (
// //             <div>
// //               <Sidebar />
// //               <div className="content-with-sidebar">
// //                 <Container
// //                   className="mobile-padding-sm"
// //                   style={{ paddingBottom: "10px" }}
// //                 >
// //                   <Card>
// //                     <Card.Header>
// //                       Hey {Name}, you are logged in as an admin. Your labeling
// //                       progress will be stored.
// //                     </Card.Header>
// //                   </Card>
// //                 </Container>
// //                 {renderLabelingInterface()}
// //               </div>
// //             </div>
// //           );
// //         }

// //         //If logged in user
// //         else if (Auth === "User") {
// //           return (
// //             <div>
// //               <Sidebar />
// //               <div className="content-with-sidebar">
// //                 <Container
// //                   className="mobile-padding-sm"
// //                   style={{ paddingBottom: "10px" }}
// //                 >
// //                   <Card>
// //                     <Card.Header>
// //                       Hey {Name}, you are logged in. Your labeling progress will
// //                       be stored.
// //                     </Card.Header>
// //                   </Card>
// //                 </Container>
// //                 {renderLabelingInterface()}
// //               </div>
// //             </div>
// //           );
// //         }

// //         //If guest
// //         else {
// //           return (
// //             <div>
// //               <Sidebar />
// //               <div className="content-with-sidebar">
// //                 <Container
// //                   className="mobile-padding-sm"
// //                   style={{ padding: "50px 15px" }}
// //                 >
// //                   <Alert variant="warning">
// //                     <Alert.Heading>Authentication Required</Alert.Heading>
// //                     <p>Labeling is not available as you have not logged in.</p>
// //                   </Alert>
// //                 </Container>
// //                 <Container className="mobile-padding-sm">
// //                   <Row>
// //                     <Col xs={12} md={6} className="mb-3 mb-md-0">
// //                       <Card>
// //                         <Card.Header as="h5">Practice</Card.Header>
// //                         <Card.Title style={{ padding: "20px" }}>
// //                           Available to all
// //                         </Card.Title>
// //                         <Container style={{ paddingBottom: "20px" }}>
// //                           <Card.Text style={{ textAlign: "left" }}>
// //                             Practice allows you to test your skills and get
// //                             feedback by seeing the results of labels submitted
// //                             by other people. Follow the link below to go to the
// //                             practice page.
// //                           </Card.Text>
// //                           <Card.Link href="/practice">Go Practice</Card.Link>
// //                         </Container>
// //                       </Card>
// //                     </Col>
// //                     <Col xs={12} md={6}>
// //                       <Card>
// //                         <Card.Header as="h5">Contribute</Card.Header>
// //                         <Card.Title style={{ padding: "20px" }}>
// //                           Only Available to Logged In Users
// //                         </Card.Title>
// //                         <Container style={{ paddingBottom: "20px" }}>
// //                           <Card.Text style={{ textAlign: "left" }}>
// //                             Contribute to the open source labeling by signing up
// //                             and going to the labeling page. Once there, your
// //                             results will be stored and used in furthering
// //                             training models. Please either signup or login using
// //                             the links below.
// //                           </Card.Text>
// //                           <Card.Link href="/signup">Signup</Card.Link>
// //                           <Card.Link href="/login">Login</Card.Link>
// //                         </Container>
// //                       </Card>
// //                     </Col>
// //                   </Row>
// //                 </Container>
// //               </div>
// //             </div>
// //           );
// //         }
// //       }}
// //     </AuthConsumer>
// //   );
// // };

// // export default LabelPage;
// import { React, useState, useEffect, useContext } from "react";
// import axios from "axios";
// import Form from "react-bootstrap/Form";
// import Button from "react-bootstrap/Button";
// import Container from "react-bootstrap/Container";
// import Card from "react-bootstrap/Card";
// import Row from "react-bootstrap/Row";
// import Col from "react-bootstrap/Col";
// import Alert from "react-bootstrap/Alert";
// import { CaretRightFill } from "react-bootstrap-icons";
// import LoadingSpinner from "../components/LoadingSpinner";
// import LabelModal from "../components/LabelModal";
// import { AuthContext, AuthConsumer } from "../helpers/AuthContext";
// import Sidebar from "../components/Sidebar";
// import "../styles/responsive.css";

// const LabelPage = () => {
//   const context = useContext(AuthContext);

//   //Loading variables
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   //Label image data
//   const [labelImage, setLabelImage] = useState(null);
//   const [labelFile, setLabelFile] = useState("");

//   // ⭐ NEW: Prefetch next image
//   const [nextImage, setNextImage] = useState(null);
//   const [nextFile, setNextFile] = useState("");
//   const [isPrefetching, setIsPrefetching] = useState(false);

//   //Checkbox values
//   const [brain, setBrain] = useState(false);
//   const [muscle, setMuscle] = useState(false);
//   const [eye, setEye] = useState(false);
//   const [heart, setHeart] = useState(false);
//   const [linenoise, setLinenoise] = useState(false);
//   const [channoise, setChannoise] = useState(false);
//   const [other, setOther] = useState(false);
//   const [unsure, setUnsure] = useState(false);

//   //Submission
//   const [status, setStatus] = useState("");
//   const [error, setError] = useState("");
//   const [validationError, setValidationError] = useState("");

//   // Cleanup blob URLs when component unmounts or image changes
//   useEffect(() => {
//     return () => {
//       if (labelImage && labelImage.startsWith("blob:")) {
//         URL.revokeObjectURL(labelImage);
//       }
//       // ⭐ NEW: Also cleanup prefetched image
//       if (nextImage && nextImage.startsWith("blob:")) {
//         URL.revokeObjectURL(nextImage);
//       }
//     };
//   }, [labelImage, nextImage]);

//   const validateSelection = () => {
//     const hasSelection =
//       brain ||
//       muscle ||
//       eye ||
//       heart ||
//       linenoise ||
//       channoise ||
//       other ||
//       unsure;

//     if (!hasSelection) {
//       setValidationError(
//         "Please select at least one label before submitting, or click Skip to move to the next component."
//       );
//       return false;
//     }

//     setValidationError("");
//     return true;
//   };

//   // ⭐ NEW: Prefetch next image function
//   const prefetchNextImage = async (email) => {
//     if (isPrefetching || !email || email === "guest") return;

//     console.log("🔄 Prefetching next image in background...");
//     setIsPrefetching(true);

//     try {
//       // Get next filename
//       const filenameResponse = await axios.get("/dropbox/imagefile", {
//         params: { email },
//         timeout: 30000,
//       });

//       const filename = filenameResponse.data;

//       if (!filename) {
//         throw new Error("No filename received");
//       }

//       console.log("📋 Next filename:", filename);
//       setNextFile(filename);

//       // Check cache first
//       const cachedUrl = sessionStorage.getItem(`img_${filename}`);
//       if (cachedUrl) {
//         console.log("✓ Next image already cached");
//         setNextImage(cachedUrl);
//         setIsPrefetching(false);
//         return;
//       }

//       // Fetch image as blob
//       console.log("⬇️ Downloading next image...");
//       const imageResponse = await axios.get("/dropbox/imagedata", {
//         responseType: "blob",
//         params: { imagefile: filename },
//         timeout: 30000,
//       });

//       const imageUrl = URL.createObjectURL(imageResponse.data);

//       // Cache it
//       try {
//         sessionStorage.setItem(`img_${filename}`, imageUrl);
//         console.log("💾 Cached next image");
//       } catch (e) {
//         console.warn("SessionStorage full, clearing cache");
//         // Clear old entries
//         const keys = Object.keys(sessionStorage);
//         keys
//           .filter((k) => k.startsWith("img_"))
//           .slice(0, 10)
//           .forEach((k) => sessionStorage.removeItem(k));
//         // Try again
//         try {
//           sessionStorage.setItem(`img_${filename}`, imageUrl);
//         } catch (e2) {
//           console.warn("Still couldn't cache after cleanup");
//         }
//       }

//       setNextImage(imageUrl);
//       console.log("✅ Next image prefetched successfully");
//     } catch (error) {
//       console.error("❌ Prefetch error:", error);
//       // Don't show error to user - prefetch is a background operation
//     } finally {
//       setIsPrefetching(false);
//     }
//   };

//   const submitResults = async () => {
//     // Validate selection first
//     if (!validateSelection()) {
//       return;
//     }

//     // Prevent double submission
//     if (isSubmitting) {
//       return;
//     }

//     setIsSubmitting(true);
//     setError("");

//     let tags = [];

//     //Save the results
//     if (brain) {
//       tags.push("Brain");
//     }
//     if (muscle) {
//       tags.push("Muscle");
//     }
//     if (eye) {
//       tags.push("Eye");
//     }
//     if (heart) {
//       tags.push("Heart");
//     }
//     if (linenoise) {
//       tags.push("Line Noise");
//     }
//     if (channoise) {
//       tags.push("Channel Noise");
//     }
//     if (other) {
//       tags.push("Other");
//     }
//     if (unsure) {
//       tags.push("Unsure");
//     }

//     try {
//       const response = await axios.post(
//         "/api/components/submit",
//         {
//           name: labelFile,
//           email: context.Email,
//           tags: tags,
//           domain: context.Domain,
//           weight: context.Weight,
//         },
//         {
//           timeout: 15000,
//         }
//       );

//       if (response.data) {
//         console.log("Submission successful:", response.data);
//         setStatus("success");
//         setValidationError("");

//         // ⭐ NEW: Immediately prefetch next image while user views results
//         prefetchNextImage(context.Email);
//       } else {
//         throw new Error("Empty response from server");
//       }
//     } catch (err) {
//       console.error("Submission error:", err);
//       setStatus("failed");
//       setError(
//         err.response?.data?.message ||
//           err.message ||
//           "Submission failed. Please try again."
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const getNext = () => {
//     console.log("Getting next image...");
//     setStatus("");
//     setError("");
//     setValidationError("");

//     // Revoke old blob URL before getting new image
//     if (labelImage && labelImage.startsWith("blob:")) {
//       URL.revokeObjectURL(labelImage);
//     }

//     setLabelImage(null);
//     setLabelFile("");
//     getImage();
//   };

//   // ⭐ OPTIMIZED: getImage now uses prefetched data
//   const getImage = async () => {
//     // ⭐ CHECK FOR PREFETCHED IMAGE FIRST - INSTANT LOAD!
//     if (nextImage && nextFile) {
//       console.log("⚡ Using prefetched image - INSTANT LOAD!");

//       // Use the prefetched image
//       setLabelImage(nextImage);
//       setLabelFile(nextFile);

//       // Clear prefetch state
//       setNextImage(null);
//       setNextFile("");

//       // Set all checkboxes to blank
//       setBrain(false);
//       setMuscle(false);
//       setEye(false);
//       setHeart(false);
//       setLinenoise(false);
//       setChannoise(false);
//       setOther(false);
//       setUnsure(false);

//       // Immediately prefetch the next one in background
//       const email = localStorage.getItem("Email");
//       if (email && email !== "guest") {
//         setTimeout(() => prefetchNextImage(email), 100);
//       }

//       return; // EXIT EARLY - NO LOADING NEEDED!
//     }

//     // ORIGINAL LOADING LOGIC (only if no prefetch available)
//     // Prevent multiple simultaneous requests
//     if (isLoading) {
//       console.log("Already loading, skipping request");
//       return;
//     }

//     //While getting image, loading is true
//     setIsLoading(true);
//     setError("");
//     setValidationError("");

//     //Set all checkboxes to blank
//     setBrain(false);
//     setMuscle(false);
//     setEye(false);
//     setHeart(false);
//     setLinenoise(false);
//     setChannoise(false);
//     setOther(false);
//     setUnsure(false);

//     const email = localStorage.getItem("Email");

//     if (!email || email === "guest") {
//       setError("You must be logged in to label components.");
//       setIsLoading(false);
//       return;
//     }

//     console.log("Getting image file for:", email);

//     try {
//       // Get image filename
//       const filenameResponse = await axios.get("/dropbox/imagefile", {
//         params: { email: email },
//         timeout: 30000,
//       });

//       console.log("Got filename:", filenameResponse.data);

//       if (!filenameResponse.data) {
//         throw new Error("No filename received from server");
//       }

//       const filename = filenameResponse.data;
//       setLabelFile(filename);

//       // Check sessionStorage cache first
//       const cachedUrl = sessionStorage.getItem(`img_${filename}`);
//       if (cachedUrl) {
//         console.log("✓ Using cached image URL");
//         setLabelImage(cachedUrl);
//         setIsLoading(false);

//         // ⭐ NEW: Start prefetching next image
//         prefetchNextImage(email);
//         return;
//       }

//       // Get image data as BLOB (much faster than base64)
//       console.log("✗ Fetching image from server:", filename);
//       const imageResponse = await axios.get("/dropbox/imagedata", {
//         responseType: "blob",
//         params: { imagefile: filename },
//         timeout: 30000,
//       });

//       console.log("Got image data, size:", imageResponse.data.size, "bytes");

//       if (!imageResponse.data || imageResponse.data.size === 0) {
//         throw new Error("Empty image data received");
//       }

//       // Create object URL from blob
//       const imageUrl = URL.createObjectURL(imageResponse.data);

//       // Cache the URL in sessionStorage
//       try {
//         sessionStorage.setItem(`img_${filename}`, imageUrl);
//       } catch (e) {
//         console.warn("SessionStorage full, clearing cache");
//         const keys = Object.keys(sessionStorage);
//         keys
//           .filter((k) => k.startsWith("img_"))
//           .slice(0, 10)
//           .forEach((k) => sessionStorage.removeItem(k));
//       }

//       setLabelImage(imageUrl);
//       setIsLoading(false);

//       // ⭐ NEW: Start prefetching next image
//       prefetchNextImage(email);
//     } catch (error) {
//       console.error("Error loading image:", error);

//       let errorMsg = "Error loading image. ";

//       if (error.code === "ECONNABORTED") {
//         errorMsg += "Request timed out. Please check your internet connection.";
//       } else if (error.response) {
//         errorMsg +=
//           error.response.data?.error ||
//           error.response.statusText ||
//           "Server error.";
//       } else if (error.request) {
//         errorMsg += "No response from server. Please check your connection.";
//       } else {
//         errorMsg += error.message || "Unknown error occurred.";
//       }

//       setError(errorMsg);
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!status && !labelImage && !isLoading) {
//       getImage();
//     }
//   }, []);

//   const renderLabelingInterface = () => (
//     <>
//       {error && (
//         <Container
//           className="mobile-padding-sm"
//           style={{ width: "100%", maxWidth: "600px", marginBottom: "10px" }}
//         >
//           <Alert variant="danger" dismissible onClose={() => setError("")}>
//             <Alert.Heading>Error</Alert.Heading>
//             <p>{error}</p>
//             <Button
//               variant="outline-danger"
//               size="sm"
//               onClick={getNext}
//               className="btn-responsive"
//             >
//               Try Again
//             </Button>
//           </Alert>
//         </Container>
//       )}

//       {validationError && (
//         <Container
//           className="mobile-padding-sm"
//           style={{ width: "100%", maxWidth: "600px", marginBottom: "10px" }}
//         >
//           <Alert
//             variant="warning"
//             dismissible
//             onClose={() => setValidationError("")}
//           >
//             <Alert.Heading>Validation Error</Alert.Heading>
//             <p>{validationError}</p>
//           </Alert>
//         </Container>
//       )}

//       {isLoading ? (
//         <LoadingSpinner />
//       ) : labelImage ? (
//         <div
//           style={{
//             width: "100%",
//             maxWidth: "1200px",
//             margin: "0 auto",
//             padding: "10px",
//           }}
//         >
//           {/* DESKTOP: Side by side */}
//           <div
//             className="hide-mobile"
//             style={{
//               display: "flex",
//               flexDirection: "row",
//               gap: "20px",
//             }}
//           >
//             {/* Image on left */}
//             <div style={{ flex: "1", minWidth: "0" }}>
//               <img
//                 src={labelImage}
//                 alt="Labeling data"
//                 className="img-responsive"
//                 style={{
//                   width: "100%",
//                   height: "auto",
//                   border: "2px solid #C0C2C9",
//                   opacity: status ? "0.33" : "1.0",
//                 }}
//                 onError={() => {
//                   setError(
//                     "Failed to display image. The image may be corrupted."
//                   );
//                   setLabelImage(null);
//                 }}
//               />
//             </div>

//             {/* Options on right */}
//             <div
//               style={{
//                 flex: "0 0 auto",
//                 minWidth: "180px",
//                 maxWidth: "200px",
//                 display: "flex",
//                 flexDirection: "column",
//               }}
//             >
//               <Form.Group
//                 className="flex-column"
//                 controlId="formBasicCheckbox"
//                 style={{
//                   opacity: status ? "0.33" : "1.0",
//                   flex: "1",
//                 }}
//               >
//                 <Form.Check
//                   id="brain"
//                   type="checkbox"
//                   label="Brain"
//                   checked={brain}
//                   disabled={!!status || isSubmitting}
//                   className="mb-2"
//                   style={{
//                     textAlign: "left",
//                     paddingLeft: "40px",
//                     borderRadius: "10px",
//                     background: "#00A5E0",
//                   }}
//                   onChange={(e) => {
//                     setBrain(e.target.checked);
//                     setValidationError("");
//                   }}
//                 />
//                 <Form.Check
//                   id="muscle"
//                   type="checkbox"
//                   label="Muscle"
//                   checked={muscle}
//                   disabled={!!status || isSubmitting}
//                   className="mb-2"
//                   style={{
//                     textAlign: "left",
//                     paddingLeft: "40px",
//                     borderRadius: "10px",
//                     background: "#EF9CDA",
//                   }}
//                   onChange={(e) => {
//                     setMuscle(e.target.checked);
//                     setValidationError("");
//                   }}
//                 />
//                 <Form.Check
//                   id="eye"
//                   type="checkbox"
//                   label="Eye"
//                   checked={eye}
//                   disabled={!!status || isSubmitting}
//                   className="mb-2"
//                   style={{
//                     textAlign: "left",
//                     paddingLeft: "40px",
//                     borderRadius: "10px",
//                     background: "#89A1EF",
//                   }}
//                   onChange={(e) => {
//                     setEye(e.target.checked);
//                     setValidationError("");
//                   }}
//                 />
//                 <Form.Check
//                   id="heart"
//                   type="checkbox"
//                   label="Heart"
//                   checked={heart}
//                   disabled={!!status || isSubmitting}
//                   className="mb-2"
//                   style={{
//                     textAlign: "left",
//                     paddingLeft: "40px",
//                     borderRadius: "10px",
//                     background: "#FECEF1",
//                   }}
//                   onChange={(e) => {
//                     setHeart(e.target.checked);
//                     setValidationError("");
//                   }}
//                 />
//                 <Form.Check
//                   id="linenoise"
//                   type="checkbox"
//                   label="Line Noise"
//                   checked={linenoise}
//                   disabled={!!status || isSubmitting}
//                   className="mb-2"
//                   style={{
//                     textAlign: "left",
//                     paddingLeft: "40px",
//                     borderRadius: "10px",
//                     background: "#C2EABD",
//                   }}
//                   onChange={(e) => {
//                     setLinenoise(e.target.checked);
//                     setValidationError("");
//                   }}
//                 />
//                 <Form.Check
//                   id="channoise"
//                   type="checkbox"
//                   label="Chan Noise"
//                   checked={channoise}
//                   disabled={!!status || isSubmitting}
//                   className="mb-2"
//                   style={{
//                     textAlign: "left",
//                     paddingLeft: "40px",
//                     borderRadius: "10px",
//                     background: "#32CBFF",
//                   }}
//                   onChange={(e) => {
//                     setChannoise(e.target.checked);
//                     setValidationError("");
//                   }}
//                 />
//                 <Form.Check
//                   id="other"
//                   type="checkbox"
//                   label="Other"
//                   checked={other}
//                   disabled={!!status || isSubmitting}
//                   className="mb-2"
//                   style={{
//                     textAlign: "left",
//                     paddingLeft: "40px",
//                     borderRadius: "10px",
//                     background: "#DCF2B0",
//                   }}
//                   onChange={(e) => {
//                     setOther(e.target.checked);
//                     setValidationError("");
//                   }}
//                 />
//                 <Form.Check
//                   id="unsure"
//                   type="checkbox"
//                   label="Unsure"
//                   checked={unsure}
//                   disabled={!!status || isSubmitting}
//                   className="mb-2"
//                   style={{
//                     textAlign: "left",
//                     paddingLeft: "40px",
//                     borderRadius: "10px",
//                     background: "#FFE5B4",
//                   }}
//                   onChange={(e) => {
//                     setUnsure(e.target.checked);
//                     setValidationError("");
//                   }}
//                 />
//               </Form.Group>

//               <div className="mt-auto" style={{ marginTop: "20px" }}>
//                 {!status && (
//                   <Button
//                     variant="secondary"
//                     type="button"
//                     onClick={getNext}
//                     disabled={isSubmitting}
//                     className="mb-2"
//                     style={{ width: "100%" }}
//                   >
//                     Skip <CaretRightFill />
//                   </Button>
//                 )}
//                 {!status ? (
//                   <Button
//                     variant="primary"
//                     type="button"
//                     onClick={submitResults}
//                     disabled={isSubmitting}
//                     style={{ width: "100%" }}
//                   >
//                     {isSubmitting ? "Submitting..." : "Submit"}
//                   </Button>
//                 ) : (
//                   <Button
//                     variant="primary"
//                     type="button"
//                     onClick={getNext}
//                     style={{ width: "100%" }}
//                   >
//                     Next
//                   </Button>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* MOBILE: Image on top, options below */}
//           <div className="show-mobile">
//             {/* Image on top */}
//             <div style={{ marginBottom: "20px" }}>
//               <img
//                 src={labelImage}
//                 alt="Labeling data"
//                 className="img-responsive"
//                 style={{
//                   width: "100%",
//                   height: "auto",
//                   border: "2px solid #C0C2C9",
//                   opacity: status ? "0.33" : "1.0",
//                 }}
//                 onError={() => {
//                   setError(
//                     "Failed to display image. The image may be corrupted."
//                   );
//                   setLabelImage(null);
//                 }}
//               />
//             </div>

//             {/* Options below */}
//             <div>
//               <Form.Group
//                 controlId="formBasicCheckboxMobile"
//                 style={{
//                   opacity: status ? "0.33" : "1.0",
//                 }}
//               >
//                 <Row>
//                   <Col xs={6} className="mb-2">
//                     <Form.Check
//                       id="brain-mobile"
//                       type="checkbox"
//                       label="Brain"
//                       checked={brain}
//                       disabled={!!status || isSubmitting}
//                       style={{
//                         textAlign: "left",
//                         paddingLeft: "30px",
//                         borderRadius: "10px",
//                         background: "#00A5E0",
//                         padding: "10px",
//                       }}
//                       onChange={(e) => {
//                         setBrain(e.target.checked);
//                         setValidationError("");
//                       }}
//                     />
//                   </Col>
//                   <Col xs={6} className="mb-2">
//                     <Form.Check
//                       id="muscle-mobile"
//                       type="checkbox"
//                       label="Muscle"
//                       checked={muscle}
//                       disabled={!!status || isSubmitting}
//                       style={{
//                         textAlign: "left",
//                         paddingLeft: "30px",
//                         borderRadius: "10px",
//                         background: "#EF9CDA",
//                         padding: "10px",
//                       }}
//                       onChange={(e) => {
//                         setMuscle(e.target.checked);
//                         setValidationError("");
//                       }}
//                     />
//                   </Col>
//                   <Col xs={6} className="mb-2">
//                     <Form.Check
//                       id="eye-mobile"
//                       type="checkbox"
//                       label="Eye"
//                       checked={eye}
//                       disabled={!!status || isSubmitting}
//                       style={{
//                         textAlign: "left",
//                         paddingLeft: "30px",
//                         borderRadius: "10px",
//                         background: "#89A1EF",
//                         padding: "10px",
//                       }}
//                       onChange={(e) => {
//                         setEye(e.target.checked);
//                         setValidationError("");
//                       }}
//                     />
//                   </Col>
//                   <Col xs={6} className="mb-2">
//                     <Form.Check
//                       id="heart-mobile"
//                       type="checkbox"
//                       label="Heart"
//                       checked={heart}
//                       disabled={!!status || isSubmitting}
//                       style={{
//                         textAlign: "left",
//                         paddingLeft: "30px",
//                         borderRadius: "10px",
//                         background: "#FECEF1",
//                         padding: "10px",
//                       }}
//                       onChange={(e) => {
//                         setHeart(e.target.checked);
//                         setValidationError("");
//                       }}
//                     />
//                   </Col>
//                   <Col xs={6} className="mb-2">
//                     <Form.Check
//                       id="linenoise-mobile"
//                       type="checkbox"
//                       label="Line Noise"
//                       checked={linenoise}
//                       disabled={!!status || isSubmitting}
//                       style={{
//                         textAlign: "left",
//                         paddingLeft: "30px",
//                         borderRadius: "10px",
//                         background: "#C2EABD",
//                         padding: "10px",
//                       }}
//                       onChange={(e) => {
//                         setLinenoise(e.target.checked);
//                         setValidationError("");
//                       }}
//                     />
//                   </Col>
//                   <Col xs={6} className="mb-2">
//                     <Form.Check
//                       id="channoise-mobile"
//                       type="checkbox"
//                       label="Chan Noise"
//                       checked={channoise}
//                       disabled={!!status || isSubmitting}
//                       style={{
//                         textAlign: "left",
//                         paddingLeft: "30px",
//                         borderRadius: "10px",
//                         background: "#32CBFF",
//                         padding: "10px",
//                       }}
//                       onChange={(e) => {
//                         setChannoise(e.target.checked);
//                         setValidationError("");
//                       }}
//                     />
//                   </Col>
//                   <Col xs={6} className="mb-2">
//                     <Form.Check
//                       id="other-mobile"
//                       type="checkbox"
//                       label="Other"
//                       checked={other}
//                       disabled={!!status || isSubmitting}
//                       style={{
//                         textAlign: "left",
//                         paddingLeft: "30px",
//                         borderRadius: "10px",
//                         background: "#DCF2B0",
//                         padding: "10px",
//                       }}
//                       onChange={(e) => {
//                         setOther(e.target.checked);
//                         setValidationError("");
//                       }}
//                     />
//                   </Col>
//                   <Col xs={6} className="mb-2">
//                     <Form.Check
//                       id="unsure-mobile"
//                       type="checkbox"
//                       label="Unsure"
//                       checked={unsure}
//                       disabled={!!status || isSubmitting}
//                       style={{
//                         textAlign: "left",
//                         paddingLeft: "30px",
//                         borderRadius: "10px",
//                         background: "#FFE5B4",
//                         padding: "10px",
//                       }}
//                       onChange={(e) => {
//                         setUnsure(e.target.checked);
//                         setValidationError("");
//                       }}
//                     />
//                   </Col>
//                 </Row>
//               </Form.Group>

//               <div style={{ marginTop: "20px" }}>
//                 <Row>
//                   {!status && (
//                     <Col xs={6} className="mb-2">
//                       <Button
//                         variant="secondary"
//                         type="button"
//                         onClick={getNext}
//                         disabled={isSubmitting}
//                         style={{ width: "100%" }}
//                       >
//                         Skip <CaretRightFill />
//                       </Button>
//                     </Col>
//                   )}
//                   <Col xs={!status ? 6 : 12}>
//                     {!status ? (
//                       <Button
//                         variant="primary"
//                         type="button"
//                         onClick={submitResults}
//                         disabled={isSubmitting}
//                         style={{ width: "100%" }}
//                       >
//                         {isSubmitting ? "Submitting..." : "Submit"}
//                       </Button>
//                     ) : (
//                       <Button
//                         variant="primary"
//                         type="button"
//                         onClick={getNext}
//                         style={{ width: "100%" }}
//                       >
//                         Next
//                       </Button>
//                     )}
//                   </Col>
//                 </Row>
//               </div>
//             </div>
//           </div>
//         </div>
//       ) : (
//         <Container className="mobile-padding-sm" style={{ paddingTop: "50px" }}>
//           <Alert variant="info">
//             No image to display. Please click "Try Again" or refresh the page.
//           </Alert>
//           <Button
//             variant="primary"
//             onClick={getNext}
//             className="btn-responsive"
//           >
//             Load Image
//           </Button>
//         </Container>
//       )}

//       <br />
//       {status === "success" && (
//         <Container
//           className="mobile-padding-sm"
//           style={{ width: "100%", maxWidth: "600px" }}
//         >
//           <Alert variant="success">
//             <Row>
//               <Col xs={12} md={8} className="mb-2 mb-md-0">
//                 ✓ Label Successfully Submitted!
//               </Col>
//               <Col
//                 xs={12}
//                 md={4}
//                 style={{ display: "flex", justifyContent: "flex-end" }}
//               >
//                 <LabelModal
//                   open={true}
//                   getStatus={true}
//                   compName={labelFile}
//                   compData={null}
//                   pracData={null}
//                 />
//               </Col>
//             </Row>
//           </Alert>
//         </Container>
//       )}
//       {status === "failed" && (
//         <Container
//           className="mobile-padding-sm"
//           style={{ width: "100%", maxWidth: "600px" }}
//         >
//           <Alert variant="danger">
//             <Row>
//               <Col xs={12} md={8} className="mb-2 mb-md-0">
//                 ✗ Label Submission Failed. {error}
//               </Col>
//               <Col
//                 xs={12}
//                 md={4}
//                 style={{ display: "flex", justifyContent: "flex-end" }}
//               >
//                 <Button
//                   variant="outline-danger"
//                   size="sm"
//                   onClick={() => setStatus("")}
//                   className="btn-responsive"
//                 >
//                   Retry
//                 </Button>
//               </Col>
//             </Row>
//           </Alert>
//         </Container>
//       )}
//     </>
//   );

//   return (
//     <AuthConsumer>
//       {({ Auth, Name }) => {
//         //If admin
//         if (Auth === "Admin") {
//           return (
//             <div>
//               <Sidebar />
//               <div className="content-with-sidebar">
//                 <Container
//                   className="mobile-padding-sm"
//                   style={{ paddingBottom: "10px" }}
//                 >
//                   <Card>
//                     <Card.Header>
//                       Hey {Name}, you are logged in as an admin. Your labeling
//                       progress will be stored.
//                     </Card.Header>
//                   </Card>
//                 </Container>
//                 {renderLabelingInterface()}
//               </div>
//             </div>
//           );
//         }

//         //If logged in user
//         else if (Auth === "User") {
//           return (
//             <div>
//               <Sidebar />
//               <div className="content-with-sidebar">
//                 <Container
//                   className="mobile-padding-sm"
//                   style={{ paddingBottom: "10px" }}
//                 >
//                   <Card>
//                     <Card.Header>
//                       Hey {Name}, you are logged in. Your labeling progress will
//                       be stored.
//                     </Card.Header>
//                   </Card>
//                 </Container>
//                 {renderLabelingInterface()}
//               </div>
//             </div>
//           );
//         }

//         //If guest
//         else {
//           return (
//             <div>
//               <Sidebar />
//               <div className="content-with-sidebar">
//                 <Container
//                   className="mobile-padding-sm"
//                   style={{ padding: "50px 15px" }}
//                 >
//                   <Alert variant="warning">
//                     <Alert.Heading>Authentication Required</Alert.Heading>
//                     <p>Labeling is not available as you have not logged in.</p>
//                   </Alert>
//                 </Container>
//                 <Container className="mobile-padding-sm">
//                   <Row>
//                     <Col xs={12} md={6} className="mb-3 mb-md-0">
//                       <Card>
//                         <Card.Header as="h5">Practice</Card.Header>
//                         <Card.Title style={{ padding: "20px" }}>
//                           Available to all
//                         </Card.Title>
//                         <Container style={{ paddingBottom: "20px" }}>
//                           <Card.Text style={{ textAlign: "left" }}>
//                             Practice allows you to test your skills and get
//                             feedback by seeing the results of labels submitted
//                             by other people. Follow the link below to go to the
//                             practice page.
//                           </Card.Text>
//                           <Card.Link href="/practice">Go Practice</Card.Link>
//                         </Container>
//                       </Card>
//                     </Col>
//                     <Col xs={12} md={6}>
//                       <Card>
//                         <Card.Header as="h5">Contribute</Card.Header>
//                         <Card.Title style={{ padding: "20px" }}>
//                           Only Available to Logged In Users
//                         </Card.Title>
//                         <Container style={{ paddingBottom: "20px" }}>
//                           <Card.Text style={{ textAlign: "left" }}>
//                             Contribute to the open source labeling by signing up
//                             and going to the labeling page. Once there, your
//                             results will be stored and used in furthering
//                             training models. Please either signup or login using
//                             the links below.
//                           </Card.Text>
//                           <Card.Link href="/signup">Signup</Card.Link>
//                           <Card.Link href="/login">Login</Card.Link>
//                         </Container>
//                       </Card>
//                     </Col>
//                   </Row>
//                 </Container>
//               </div>
//             </div>
//           );
//         }
//       }}
//     </AuthConsumer>
//   );
// };

// export default LabelPage;
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
import "../styles/responsive.css";

const LabelPage = () => {
  const context = useContext(AuthContext);

  //Loading variables
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  //Label image data
  const [labelImage, setLabelImage] = useState(null);
  const [labelFile, setLabelFile] = useState("");
  const [oldImageUrls, setOldImageUrls] = useState([]); // Track old URLs for cleanup

  // ⭐ NEW: Prefetch next image
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

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up current images
      if (labelImage && labelImage.startsWith("blob:")) {
        URL.revokeObjectURL(labelImage);
      }
      if (nextImage && nextImage.startsWith("blob:")) {
        URL.revokeObjectURL(nextImage);
      }
      // Clean up any old URLs
      oldImageUrls.forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // Cleanup old URLs periodically
  useEffect(() => {
    if (oldImageUrls.length > 0) {
      const timer = setTimeout(() => {
        oldImageUrls.forEach((url) => {
          if (url && url.startsWith("blob:")) {
            URL.revokeObjectURL(url);
          }
        });
        setOldImageUrls([]);
      }, 2000); // Clean up after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [oldImageUrls]);

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

  // ⭐ NEW: Prefetch next image function
  const prefetchNextImage = async (email) => {
    if (isPrefetching || !email || email === "guest") return;

    console.log("🔄 Prefetching next image in background...");
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
        console.log("✓ Next image already cached");
        setNextImage(cachedUrl);
        setIsPrefetching(false);
        return;
      }

      // Fetch image as blob
      console.log("⬇️ Downloading next image...");
      const imageResponse = await axios.get("/dropbox/imagedata", {
        responseType: "blob",
        params: { imagefile: filename },
        timeout: 30000,
      });

      const imageUrl = URL.createObjectURL(imageResponse.data);

      // Cache it
      try {
        sessionStorage.setItem(`img_${filename}`, imageUrl);
        console.log("💾 Cached next image");
      } catch (e) {
        console.warn("SessionStorage full, clearing cache");
        // Clear old entries
        const keys = Object.keys(sessionStorage);
        keys
          .filter((k) => k.startsWith("img_"))
          .slice(0, 10)
          .forEach((k) => sessionStorage.removeItem(k));
        // Try again
        try {
          sessionStorage.setItem(`img_${filename}`, imageUrl);
        } catch (e2) {
          console.warn("Still couldn't cache after cleanup");
        }
      }

      setNextImage(imageUrl);
      console.log("✅ Next image prefetched successfully");
    } catch (error) {
      console.error("❌ Prefetch error:", error);
      // Don't show error to user - prefetch is a background operation
    } finally {
      setIsPrefetching(false);
    }
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
          timeout: 15000,
        }
      );

      if (response.data) {
        console.log("Submission successful:", response.data);
        setStatus("success");
        setValidationError("");

        // ⭐ NEW: Immediately prefetch next image while user views results
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

    // DON'T revoke here - let useEffect handle it
    // The image might still be rendering
    setLabelImage(null);
    setLabelFile("");
    getImage();
  };

  // ⭐ OPTIMIZED: getImage now uses prefetched data
  const getImage = async () => {
    // ⭐ CHECK FOR PREFETCHED IMAGE FIRST - INSTANT LOAD!
    if (nextImage && nextFile) {
      console.log("⚡ Using prefetched image - INSTANT LOAD!");

      // Move old image URL to cleanup array
      if (labelImage && labelImage.startsWith("blob:")) {
        setOldImageUrls((prev) => [...prev, labelImage]);
      }

      // Use the prefetched image
      setLabelImage(nextImage);
      setLabelFile(nextFile);

      // Clear prefetch state
      setNextImage(null);
      setNextFile("");

      // Set all checkboxes to blank
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

    // ORIGINAL LOADING LOGIC (only if no prefetch available)
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

      // Check sessionStorage cache first
      const cachedUrl = sessionStorage.getItem(`img_${filename}`);
      if (cachedUrl) {
        console.log("✓ Using cached image URL");

        // Move old image URL to cleanup array
        if (labelImage && labelImage.startsWith("blob:")) {
          setOldImageUrls((prev) => [...prev, labelImage]);
        }

        setLabelImage(cachedUrl);
        setIsLoading(false);

        // ⭐ NEW: Start prefetching next image
        prefetchNextImage(email);
        return;
      }

      // Get image data as BLOB (much faster than base64)
      console.log("✗ Fetching image from server:", filename);
      const imageResponse = await axios.get("/dropbox/imagedata", {
        responseType: "blob",
        params: { imagefile: filename },
        timeout: 30000,
      });

      console.log("Got image data, size:", imageResponse.data.size, "bytes");

      if (!imageResponse.data || imageResponse.data.size === 0) {
        throw new Error("Empty image data received");
      }

      // Create object URL from blob
      const imageUrl = URL.createObjectURL(imageResponse.data);

      // Move old image URL to cleanup array
      if (labelImage && labelImage.startsWith("blob:")) {
        setOldImageUrls((prev) => [...prev, labelImage]);
      }

      // Cache the URL in sessionStorage
      try {
        sessionStorage.setItem(`img_${filename}`, imageUrl);
      } catch (e) {
        console.warn("SessionStorage full, clearing cache");
        const keys = Object.keys(sessionStorage);
        keys
          .filter((k) => k.startsWith("img_"))
          .slice(0, 10)
          .forEach((k) => sessionStorage.removeItem(k));
      }

      setLabelImage(imageUrl);
      setIsLoading(false);

      // ⭐ NEW: Start prefetching next image
      prefetchNextImage(email);
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
                  setError(
                    "Failed to display image. The image may be corrupted."
                  );
                  setLabelImage(null);
                }}
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

          {/* MOBILE: Image on top, options below */}
          <div className="show-mobile">
            {/* Image on top */}
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
                  setError(
                    "Failed to display image. The image may be corrupted."
                  );
                  setLabelImage(null);
                }}
              />
            </div>

            {/* Options below */}
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
          <Alert variant="info">
            No image to display. Please click "Try Again" or refresh the page.
          </Alert>
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
        //If admin
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
        }

        //If logged in user
        else if (Auth === "User") {
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
        }

        //If guest
        else {
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
