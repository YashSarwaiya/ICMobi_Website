import { React, useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Table from "react-bootstrap/Table";
import Alert from "react-bootstrap/Alert";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { AuthConsumer } from "../helpers/AuthContext";
import "../styles/responsive.css";

import "react-circular-progressbar/dist/styles.css";

const Dashboard = () => {
  //User variable
  const [user, setUser] = useState(null);
  const [rank, setRank] = useState("NA");
  const [progress, setProgress] = useState(0);

  //Get user data
  const getUserData = () => {
    const email = localStorage.getItem("Email");

    if (!email || email === "guest") {
      return;
    }

    axios
      .get("/api/users/user", {
        params: {
          email,
        },
      })
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        // console.log(err);
      });
  };

  //await until user data is set, to set rank and progress
  useEffect(() => {
    if (!user) {
      return;
    }

    const comp = user.components.length;
    let perc = 0;

    if (comp === 0) {
      setRank("Newbie");
      perc = 0;
    } else if (comp <= 5) {
      setRank("Rookie");
      perc = Math.floor((comp / 5.0) * 100);
    } else if (comp < 10) {
      setRank("Beginner");
      perc = Math.floor(((comp - 6) / 4.0) * 100);
    } else if (comp < 25) {
      setRank("Intermediate");
      perc = Math.floor(((comp - 10) / 15.0) * 100);
    } else if (comp < 30) {
      setRank("Seasoned");
      perc = Math.floor(((comp - 25) / 5.0) * 100);
    } else if (comp < 50) {
      setRank("Proficient");
      perc = Math.floor(((comp - 30) / 20.0) * 100);
    } else if (comp < 75) {
      setRank("Experienced");
      perc = Math.floor(((comp - 50) / 25.0) * 100);
    } else if (comp < 100) {
      setRank("Advanced");
      perc = Math.floor(((comp - 75) / 25.0) * 100);
    } else if (comp < 500) {
      setRank("Expert");
      perc = Math.floor(((comp - 100) / 400.0) * 100);
    } else if (comp >= 500) {
      setRank("Ultimate Master");
      perc = 100;
    } else {
      setRank("You Don't Exist");
      perc = 100;
    }

    setProgress(perc);
  }, [user]);

  //on page reload use effect
  useEffect(() => {
    //Get user data
    getUserData();
  }, []);

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
                  style={{ padding: "10px" }}
                >
                  <Card style={{ marginBottom: "10px" }}>
                    <Card.Header as="h2">
                      {Name} <Badge bg="secondary">{rank}</Badge>
                    </Card.Header>
                  </Card>
                  <Row>
                    <Col xs={12} lg={6} className="mb-3 mb-lg-0">
                      <Card>
                        <Card.Header as="h5">Profile</Card.Header>
                        <Card.Body>
                          <Container className="mobile-padding-sm">
                            {user ? (
                              <div className="table-responsive-mobile">
                                <Table hover>
                                  <tbody>
                                    <tr>
                                      <td>First Name</td>
                                      <td>{user.fname}</td>
                                    </tr>
                                    <tr>
                                      <td>Last Name</td>
                                      <td>{user.lname}</td>
                                    </tr>
                                    <tr>
                                      <td>Email</td>
                                      <td style={{ wordBreak: "break-all" }}>
                                        {user.email}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>Association</td>
                                      <td>{user.assoc}</td>
                                    </tr>
                                    <tr>
                                      <td>Education</td>
                                      <td>{user.edu}</td>
                                    </tr>
                                    <tr>
                                      <td>Experience</td>
                                      <td>{user.exp}</td>
                                    </tr>
                                  </tbody>
                                </Table>
                              </div>
                            ) : (
                              <Alert key="noprofile" variant="warning">
                                No User Profile Retrieved
                              </Alert>
                            )}
                          </Container>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} lg={6}>
                      <Card>
                        <Card.Header as="h5">
                          Progress To Next Level
                        </Card.Header>
                        <Card.Body>
                          {user ? (
                            <Container className="mobile-padding-sm">
                              <Container
                                style={{
                                  width: "50%",
                                  maxWidth: "200px",
                                  margin: "0 auto",
                                }}
                              >
                                <CircularProgressbar
                                  value={progress}
                                  text={`${progress}%`}
                                  strokeWidth={5}
                                  styles={buildStyles({
                                    strokeLinecap: "butt",
                                  })}
                                />
                              </Container>
                              <Container style={{ paddingTop: "30px" }}>
                                <div className="table-responsive-mobile">
                                  <Table hover>
                                    <tbody>
                                      <tr>
                                        <td>Skill Level</td>
                                        <td>
                                          <Badge bg="secondary">{rank}</Badge>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td>Components Labeled</td>
                                        <td>{user.components.length}</td>
                                      </tr>
                                    </tbody>
                                  </Table>
                                </div>
                              </Container>
                            </Container>
                          ) : (
                            <Container className="mobile-padding-sm">
                              <Alert key="noprogress" variant="warning">
                                No User Progress Retrieved
                              </Alert>
                            </Container>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <Card style={{ marginTop: "10px" }}>
                    <Card.Header>Admin Links</Card.Header>
                    <Card.Body>
                      <p>Hey, you are authenticated as an admin.</p>
                    </Card.Body>
                  </Card>
                </Container>
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
                  style={{ padding: "10px" }}
                >
                  <Card style={{ marginBottom: "10px" }}>
                    <Card.Header as="h2">
                      {Name} <Badge bg="secondary">{rank}</Badge>
                    </Card.Header>
                  </Card>
                  <Row>
                    <Col xs={12} lg={6} className="mb-3 mb-lg-0">
                      <Card>
                        <Card.Header as="h5">Profile</Card.Header>
                        <Card.Body>
                          <Container className="mobile-padding-sm">
                            {user ? (
                              <div className="table-responsive-mobile">
                                <Table hover>
                                  <tbody>
                                    <tr>
                                      <td>First Name</td>
                                      <td>{user.fname}</td>
                                    </tr>
                                    <tr>
                                      <td>Last Name</td>
                                      <td>{user.lname}</td>
                                    </tr>
                                    <tr>
                                      <td>Email</td>
                                      <td style={{ wordBreak: "break-all" }}>
                                        {user.email}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>Association</td>
                                      <td>{user.assoc}</td>
                                    </tr>
                                    <tr>
                                      <td>Education</td>
                                      <td>{user.edu}</td>
                                    </tr>
                                    <tr>
                                      <td>Experience</td>
                                      <td>{user.exp}</td>
                                    </tr>
                                  </tbody>
                                </Table>
                              </div>
                            ) : (
                              <Alert key="noprofile" variant="warning">
                                No User Profile Retrieved
                              </Alert>
                            )}
                          </Container>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} lg={6}>
                      <Card>
                        <Card.Header as="h5">
                          Progress To Next Level
                        </Card.Header>
                        <Card.Body>
                          {user ? (
                            <Container className="mobile-padding-sm">
                              <Container
                                style={{
                                  width: "50%",
                                  maxWidth: "200px",
                                  margin: "0 auto",
                                }}
                              >
                                <CircularProgressbar
                                  value={progress}
                                  text={`${progress}%`}
                                  strokeWidth={5}
                                  styles={buildStyles({
                                    strokeLinecap: "butt",
                                  })}
                                />
                              </Container>
                              <Container style={{ paddingTop: "30px" }}>
                                <div className="table-responsive-mobile">
                                  <Table hover>
                                    <tbody>
                                      <tr>
                                        <td>Skill Level</td>
                                        <td>
                                          <Badge bg="secondary">{rank}</Badge>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td>Components Labeled</td>
                                        <td>{user.components.length}</td>
                                      </tr>
                                    </tbody>
                                  </Table>
                                </div>
                              </Container>
                            </Container>
                          ) : (
                            <Container className="mobile-padding-sm">
                              <Alert key="noprogress" variant="warning">
                                No User Progress Retrieved
                              </Alert>
                            </Container>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Container>
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
                  style={{ paddingTop: "70px" }}
                >
                  <Card>
                    <Card.Header as="h3">
                      Sorry, looks like you are in the wrong place?
                    </Card.Header>
                    <Card.Body>
                      <Row style={{ padding: "5px" }}>
                        <p>You are not authenticated to view the page.</p>
                      </Row>
                      <Row style={{ padding: "5px" }}>
                        <p>
                          Please <a href="/login">login</a> with to access the
                          page.
                        </p>
                      </Row>
                    </Card.Body>
                  </Card>
                </Container>
              </div>
            </div>
          );
        }
      }}
    </AuthConsumer>
  );
};

export default Dashboard;
