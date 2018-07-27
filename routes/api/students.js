const router = require('express').Router();
const models = require('./../../db/models').models;
const password = require('./../../utils/password');
const passport = require('./../../auth/passporthandler');
const ensure = require('./../../auth/authutils');
const errorFunction = require('../../utils/error').errorFunction;


router.get('/', function (req, res) {
  models.Student.findAll({
    attributes: ['id', 'education'],
    include: [{
      model: models.User,
      attributes: ['id', 'image', 'name']
    }]
  }).then(function (students) {
    res.status(200).send(students.map((i) => i.get()));
  }).catch(errorFunction(req, res, 500, "Could not get all the students"))
});

router.get('/:id', function (req, res) {
  models.User.findOne({
    where: {'$student.id$': parseInt(req.params.id)},
    include: models.Student
  }).then(function (user) {
    res.status(200).send(user);
  }).catch(errorFunction(req, res, 500, "Could not get the details of the student"))
});

router.post('/add', async function (req, res) {
  if (config.DEV_MODE) {
    await models.User.create({
      name: req.body.name
    }).then(function (user) {
      req.body.userId = user.id;
    });
  }
  if (!req.body.userId === true) {
    return res.status(400).send("Please login first");
  }
  models.Student.create({
    education: req.body.education,
    skills: req.body.skills,
    compLanguages: req.body.compLanguages,
    projects: req.body.projects,
    trainings: req.body.trainings,
    cbStudent: req.body.cbStudent,
    cbCourses: req.body.cbCourses,
    userId: req.body.userId
  }).then(function (student) {
    if (!student)
      return res.status(500).send("Could not create the student.");

    return res.status(201).send("Student created");
  }).catch(errorFunction(req, res, 500, "Could not create the student"))

});


router.put('/:id', config.DEV_MODE ? function (req, res, next) {
  next();
} : passport.authenticate('bearer'), ensure.ensureAdmin('/'), function (req, res) {
  models.Student.update(
    {
      education: req.body.education,
      skills: req.body.skills,
      compLanguages: req.body.compLanguages,
      projects: req.body.projects,
      trainings: req.body.trainings,
      cbStudent: req.body.cbStudent,
      cbCourses: req.body.cbCourses,
    },
    {
      where: {id: parseInt(req.params.id)},
      returning: true
    }).then(function (student) {
    if (!student) {
      return res.status(404).send({code: "404", error: {message: "Could not find the student"}})
    }
    return res.status(200).send({success: true, student});
  }).catch(errorFunction(req, res, 500, "Database Error"))

});
//TODO: Ask if this is student id or user id
//this is user id as all the applications belong to a user and not to a student

router.get('/:id/applications', passport.authenticate('bearer'), function (req, res) {
  let userId = parseInt(req.params.id);
  models.Admin.findOne({where: {id: req.user.id}}).then(function (admin) {
    if (admin) {
      models.Application.findAll({
        where: {userId: userId},
        include: models.Job
      }).then(function (applications) {
        if (!applications) {
          return res.status(404).send({code: "404", error: {message: "No Applications submitted"}})
        }
        return res.status(200).send(applications);
      }).catch(errorFunction(req, res, 500, "Database Error"))
    } else {
      models.CompanyManager.findOne({where: {userId: req.user.id}}).then(function (companymanager) {
        if (companymanager) {
          models.Application.findAll({
            where: {
              userId: userId,
              '$job.companyId$': companymanager.companyId
            },
            include: [
              {
                model: models.Job,
                include: [models.Company]
              }]
          }).then(function (applications) {
            if (!applications) {
              return res.status(404).send({code: "404", error: {message: "No Applications submitted"}})
            }
            return res.status(200).send(applications);
          }).catch(errorFunction(req, res, 500, "Database Error"))
        } else {
          res.status(401).send({code: "401", error: {message: "You are not allowed"}});
        }
      }).catch(errorFunction(req, res, 500, "Database Error"))
    }
  })
});


module.exports = router;
