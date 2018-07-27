const router = require('express').Router();
const models = require('./../../db/models').models;
const password = require('./../../utils/password');
const passport = require('../../auth/passporthandler');
const ensure = require('./../../auth/authutils');
const errorFunction = require('../../utils/error').errorFunction;

router.post('/add', function (req, res) {
  models.User.create({
    name: req.body.name
  }).then(function (user) {
    if (user)
      return res.status(201).send("user created");
    else
      return res.status(500).send("could not create the user");

  }).catch(errorFunction(req, res, 500, "Could not create the user"));
})

router.get('/', ensure.ensureAdmin(), function (req, res) {
  models.User.findAll().then(function (users) {
    if (users)
      return res.status(200).send(users);
    else
      return res.status(404).send("No users");
  }).catch(errorFunction(req, res, 500, "Could not get the users"))
});

router.get('/me', function (req, res) {
  console.log(req.user);
  models.User.findOne({
    where: {id: req.user.id}
  }).then(function (user) {
    if (user)
      return res.status(200).send(user);
    else
      return res.status(404).send("Could not send the details");
  }).catch(errorFunction(req, res, 500, "Could not get the user"))
});

router.get('/:id', ensure.ensureAdmin(), function (req, res) {
  models.User.findOne({
    where: {id: parseInt(req.params.id)}
  }).then(function (user) {
    if (user)
      return res.status(200).send(user);
    else
      return res.status(404).send("No user with this id exists");
  }).catch(errorFunction(req, res, 500, "Could not get the user"))
});

router.get('/me/student', function (req, res) {
  models.Student.findOne({
    where: {userId: req.user.id},
  }).then(function (student) {
    if (!student) {
      return res.status(404).send("You are not a Student.");
    }
    return res.status(200).send(student);

  }).catch(errorFunction(req, res, 500, "Could not get the student details"))
});

router.get('/me/companymanager', function (req, res) {
  models.CompanyManager.findOne({
    where: {userId: req.user.id},
  }).then(function (companymanager) {
    if (companymanager) {
      return res.status(200).send(companymanager);
    }
    else
      return res.status(404).send("You are not a Company Manager.");
  }).catch(errorFunction(req, res, 500, "Could not get the company manager details"))
});

router.get('/me/admin', function (req, res) {
  models.Admin.findOne({
    where: {id: req.user.id},
  }).then(function (admin) {
    if (admin) {
      return res.status(200).send(admin);
    }
    else
      return res.status(404).send("You are not an Admin.");
  }).catch(errorFunction(req, res, 500, "Could not get the admin details"))
});

router.post('/me/student/create', function (req, res) {
  let userId = parseInt(req.user.id),
    education = req.body.education,
    skills = req.body.skills,
    compLanguages = req.body.compLanguages,
    projects = req.body.projects,
    trainings = req.body.trainings,
    cbStudent = req.body.cbStudent,
    cbCourses = req.body.cbCourses;
  models.Student.create({
    education: education,
    skills: skills,
    compLanguages: compLanguages,
    projects: projects,
    trainings: trainings,
    cbStudent: cbStudent,
    cbCourses: cbCourses,
    userId: userId
  }).then(function (student) {
    if (student)
      return res.status(201).send("Student created");
    else
      return res.status(500).send("could not create the student");

  }).catch(errorFunction(req, res, 500, "Could not create the student"));
});

router.post('/me/companymanager/create', function (req, res) {
  let userId = parseInt(req.user.id),
    designation = req.body.designation,
    companyName = req.body.companyName;
  models.Company.findOne({where: {name: companyName}}).then(function (company) {
    if (company) {
      models.CompanyManager.create({
        designation: designation,
        companyId: company.id,
        userId: userId
      }).then(function (companymanager) {
        if (companymanager)
          return res.status(201).send("Companymanager created");
        else
          return res.status(500).send("could not create the companymanager");

      }).catch(errorFunction(req, res, 500, "Could not create the company manager"));
    } else {
      console.log(companyName);
      models.Company.create({
        name: companyName
      }).then(function (companyobj) {
        if (companyobj) {
          models.CompanyManager.create({
            designation: designation,
            companyId: companyobj.id,
            userId: userId
          }).then(function (companymanager) {
            if (companymanager)
              return res.status(201).send("Companymanager created");
            else
              return res.status(500).send("could not create the companymanager");
          }).catch(errorFunction(req, res, 500, "Could not create the company manager"));
        } else
          return res.status(500).send("could not create the companymanager");
      })
    }
  }).catch(errorFunction(req, res, 500, "Could not create the company manager"));

});

module.exports = router;
