/*
*
*
*       Complete the API routing below
*
*
*/

"use strict";

const expect = require("chai").expect;
const MongoClient = require("mongodb");
const mongoose = require("mongoose");
const ObjectId = require("mongodb").ObjectID;

// Import Model
const Project = require("../models/Project");

const isEmpty = require("../validation/isEmpty");

mongoose
  .connect(process.env.MONGOLAB_URI)
  .then(db => console.log("MongoDB connected"))
  .catch(err => console.log(err));

module.exports = function(app) {
  app
    .route("/api/issues/:project")

    .get(function(req, res) {
      let project_name = req.params.project;

      Project.findOne({ project: project_name })
        .then(project => {
          let issues = project.issues;
          let query = req.query;
          let queryResults;

          issues.sort(function(a, b) {
            return Date.parse(b.created_on) - Date.parse(a.created_on);
          });

          if (query.open) {
            if (query.open === "true") {
              query.open = true;
            } else if (query.open === "false") {
              query.open = false;
            }
          }

          if (!isEmpty(query)) {
            queryResults = issues.filter(obj => {
              for (let key in query) {
                if (!obj.hasOwnProperty(key) && obj[key] != query[key]) {
                  return false;
                }
                return true;
              }
            });

            return res.json(queryResults);
          }

          return res.json(issues);
        })
        .catch(err => res.status(404).json(err));
    })

    .post(function(req, res) {
      // Get request information
      let project_name = req.params.project;
      let {
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open
      } = req.body;

      // Find a project with the param name
      Project.findOne({ project: project_name })
        .then(project => {
          // If no project found, create one. Else create a new issue an add it to the project
          if (!project) {
            let newProject = new Project({
              project: project_name,
              issues: [
                {
                  issue_title,
                  issue_text,
                  created_by,
                  assigned_to,
                  status_text,
                  open
                }
              ]
            });
            newProject
              .save()
              .then(project => res.json(project.issues[0]))
              .catch(err => res.status(404).json(err));
          } else {
            const newIssue = {
              issue_title,
              issue_text,
              created_by,
              assigned_to,
              status_text,
              open
            };
            project.issues.unshift(newIssue);
            project
              .save()
              .then(project => {
                let issues = project.issues;

                issues.sort(function(a, b) {
                  return Date.parse(b.created_on) - Date.parse(a.created_on);
                });

                return res.json(issues[0]);
              })
              .catch(err => res.status(404).json(err));
          }
        })
        .catch(err => err.status(404).json(err));
    })

    .put(function(req, res) {
      // Get request information
      let project_name = req.params.project;
      let {
        _id,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open
      } = req.body;
      let updatedFields;
      const setValues = {
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open
      };

      /**
       *
       * @param {Object} obj Object to filter
       * @param {Function} predicate Condition
       */
      function filterObj(obj, predicate) {
        var result = {};

        for (let key in obj) {
          if (obj.hasOwnProperty(key) && predicate(obj[key])) {
            result["issues.$." + key] = obj[key];
          }
        }

        return result;
      }

      const filteredObj = filterObj(setValues, property => {
        return isEmpty(property) ? false : true;
      });

      if (isEmpty(filteredObj)) {
        return res.status(400).send("no updated field sent");
      }

      filteredObj["issues.$.updated_on"] = Date.now();

      updatedFields = Object.keys(filteredObj).length;

      Project.updateOne(
        {
          project: project_name,
          "issues._id": _id
        },
        {
          $set: filteredObj
        }
      )
        .then(person =>
          res.json({
            response: person,
            updatedFields,
            message: "successfully updated"
          })
        )
        .catch(err => res.send("could not update " + _id));
    })

    .delete(function(req, res) {
      let project_name = req.params.project;
      let { _id } = req.body;

      if (isEmpty(_id)) {
        return res.status(400).send("_id error");
      }

      Project.findOne({ "issues._id": _id }).then(project => {
        let issuesArr = project.issues.map(issue => issue.id);
        let index = issuesArr.indexOf(_id);
        if (index == -1) {
          return res.status(404).send("id not found");
        }

        project.issues.splice(index, 1);

        project.save().then(project =>
          res.json({
            project,
            message: "valid _id"
          })
        );
      });
    });

  // app.route("/api/issues/delete/:project").delete(function(req, res) {
  //   Project.deleteOne({});
  // });
};
