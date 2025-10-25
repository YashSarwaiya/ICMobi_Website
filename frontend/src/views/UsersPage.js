import { React, useState, useEffect } from "react";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Table from "react-bootstrap/Table";
import { ArrowClockwise } from "react-bootstrap-icons";
import axios from "axios";
import { AuthConsumer } from "../helpers/AuthContext";
import "../styles/responsive.css";

const UsersPage = () => {
  const [userList, setUserList] = useState([]);

  const getUserList = () => {
    axios.get("/api/users/userlist").then((res) => {
      setUserList(res.data);
    });
  };

  useEffect(() => {
    getUserList();
  }, []);

  return (
    <AuthConsumer>
      {({ Auth }) => {
        //If admin
        if (Auth === "Admin") {
          return (
            <div>
              <div className="content-with-sidebar">
                <Container className="mobile-padding-sm">
                  <p>
                    This page is in progress. You can view the data that can be
                    pulled from dropbox.
                  </p>

                  <Container fluid style={{ maxWidth: "100%" }}>
                    <Button
                      variant="primary"
                      type="submit"
                      onClick={getUserList}
                      style={{ marginBottom: "10px" }}
                      className="btn-responsive"
                    >
                      <ArrowClockwise /> &nbsp; Refresh
                    </Button>
                    <div className="table-responsive-mobile">
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Email</th>
                            <th>Domain</th>
                            <th>Components Labeled</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userList.map((user) => {
                            return (
                              <tr key={user.email}>
                                <th>{user.email}</th>
                                <th>{user.domain}</th>
                                <th>{user.components.length}</th>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  </Container>
                </Container>
              </div>
            </div>
          );
        }

        //If logged in user
        else if (Auth === "User") {
          return (
            <Container
              className="mobile-padding-sm"
              style={{ paddingTop: "120px" }}
            >
              <Card>
                <Card.Header as="h3">
                  Sorry, looks like you are in the wrong place?
                </Card.Header>
                <Card.Body>
                  <Row style={{ padding: "5px" }}>
                    <p>You are not authorized to view the page.</p>
                  </Row>
                  <Row style={{ padding: "5px" }}>
                    <p>
                      Please <a href="/logout">logout</a> and then login with
                      correct credentials to access the page
                    </p>
                  </Row>
                </Card.Body>
              </Card>
            </Container>
          );
        }

        //If guest
        else {
          return (
            <Container
              className="mobile-padding-sm"
              style={{ paddingTop: "120px" }}
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
                      Please <a href="/login">login</a> with correct credentials
                      to access the page
                    </p>
                  </Row>
                </Card.Body>
              </Card>
            </Container>
          );
        }
      }}
    </AuthConsumer>
  );
};

export default UsersPage;
