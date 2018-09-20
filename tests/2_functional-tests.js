/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function() {
  suite("POST /api/issues/{project} => object with issue data", function() {
    test("Every field filled in", function(done) {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          issue_title: "Title",
          issue_text: "text",
          created_by: "Functional Test - Every field filled in",
          assigned_to: "Chai and Mocha",
          status_text: "In QA"
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, "Title");
          assert.equal(res.body.issue_text, "text");
          assert.equal(
            res.body.created_by,
            "Functional Test - Every field filled in"
          );
          assert.equal(res.body.assigned_to, "Chai and Mocha");
          assert.equal(res.body.status_text, "In QA");
          assert.isNull(err);
          done();
        });
    });

    test("Required fields filled in", function(done) {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          issue_title: "Title",
          issue_text: "text",
          created_by: "Functional Test - Required fields filled in"
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, "Title");
          assert.equal(res.body.issue_text, "text");
          assert.equal(
            res.body.created_by,
            "Functional Test - Required fields filled in"
          );
          assert.isNull(err);
          done();
        });
    });

    test("Missing required fields", function(done) {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          issue_title: "Title"
        })
        .end((err, res) => {
          assert.equal(res.status, 404);
          assert.equal(res.body._message, "Project validation failed");
          assert.isNotNull(err);
          done();
        });
    });
  });

  suite("PUT /api/issues/{project} => text", function() {
    test("No body", function(done) {
      chai
        .request(server)
        .put("/api/issues/test")
        .send({})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.equal(res.text, "no updated field sent");
          // assert.isNull(err);
          done();
        });
    });

    test("One field to update", function(done) {
      chai
        .request(server)
        .put("/api/issues/test")
        .send({
          _id: "5ba2a982609fa316a069dc56",
          issue_title: "Created 3 updated test"
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.message, "successfully updated");
          assert.equal(res.body.updatedFields, 2);
          assert.isNull(err);
          done();
        });
    });

    test("Multiple fields to update", function(done) {
      chai
        .request(server)
        .put("/api/issues/test")
        .send({
          _id: "5ba2a982609fa316a069dc56",
          issue_title: "Created 3 updated test",
          issue_text: "Lorem Ipsum 3 updated"
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.message, "successfully updated");
          assert.equal(res.body.updatedFields, 3);
          assert.isNull(err);
          done();
        });
    });
  });

  suite(
    "GET /api/issues/{project} => Array of objects with issue data",
    function() {
      test("No filter", function(done) {
        chai
          .request(server)
          .get("/api/issues/test")
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.property(res.body[0], "_id");
            assert.property(res.body[0], "issue_title");
            assert.property(res.body[0], "issue_text");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "updated_on");
            assert.property(res.body[0], "created_by");
            assert.property(res.body[0], "open");
            if (res.body[0].assigned_to) {
              assert.property(res.body[0], "assigned_to");
            }
            if (res.body[0].status_text) {
              assert.property(res.body[0], "status_text");
            }
            assert.isNull(err);
            done();
          });
      });

      test("One filter", function(done) {
        chai
          .request(server)
          .get("/api/issues/test?issue_title=Title")
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.equal(res.body[0].issue_title, "Title");
            assert.isNull(err);
            done();
          });
      });

      test("Multiple filters (test for multiple fields you know will be in the db for a return)", function(done) {
        chai
          .request(server)
          .get("/api/issues/test?issue_title=Title&issue_text=text&open=true")
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.equal(res.body[0].issue_title, "Title");
            assert.equal(res.body[0].issue_text, "text");
            assert.equal(res.body[0].open, true);
            assert.isNull(err);
            done();
          });
      });
    }
  );

  suite("DELETE /api/issues/{project} => text", function() {
    test("No _id", function(done) {
      chai
        .request(server)
        .delete("/api/issues/test")
        .end(function(err, res) {
          assert.equal(res.status, 400);
          assert.equal(res.text, "_id error");
          done();
        });
    });

    test("Valid _id", function(done) {
      chai
        .request(server)
        .get("/api/issues/test")
        .end(function(err, res) {
          let id = res.body[0]._id;
          chai
            .request(server)
            .delete("/api/issues/test")
            .send({ _id: id })
            .end(function(req, res) {
              assert.equal(res.body.message, "valid _id");
              assert.equal(res.status, 200);
              done();
            });
        });
    });
  });
});
