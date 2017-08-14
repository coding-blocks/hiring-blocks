const route = require('express').Router();
const models = require('./../db/models').models;
const uid = require('uid2');
const password = require('../utils/password');
const axios = require('axios');
const secrets = require('./../secrets.json');

router.post('/', (req, res) => {
  axios.post('https://account.codingblocks.com/oauth/token', {
    "client_id": secrets.CLIENT_ID,
    "redirect_uri": secrets.REDIRECT_URI,
    "client_secret": secrets.CLIENT_SECRET,
    "grant_type": secrets.GRANT_TYPE,
    "code": req.body.code
  }).then(function (authtoken) {
    models.Oneauth.findOne({
      where: {
        oneauthToken: authtoken.data.access_token
      }
    }).then(function (oneauth) {
      if (oneauth !== null) {
        res.status(200).send({
          success: true,
          token: oneauth.token
        })
      }
      else {
        axios.get('https://account.codingblocks.com/api/users/me', {
          headers: {'Authorization': `Bearer ${authtoken.data.access_token}`}
        }).then(function (user) {
          models.Oneauth.create({
            user: {
              name: user.data.firstname + " " + user.data.lastname,
              email: user.data.email
            }
            , oneauthToken: authtoken.data.access_token
            , token: uid(30)
          }, {
            include: [models.User]
          }).then(function (oneauthFinal) {
            res.status(201).send({
              success: true,
              token: oneauthFinal.token
            })
          }).catch(function (err) {
            console.log(err);
            res.status(500).send({
              success: false
              , code: "500"
              , error: {
                message: "Could not create in Oneauth Table(Internal Server Error)."
              }
            })
          })
        }).catch(function (err) {
          console.log(err);
          res.status(500).send({
            success: false
            , code: "500"
            , error: {
              message: "Could not get details from Oneauth API(Internal Server Error)."
            }
          })
        })
        //
        //
      }
    }).catch(function (err) {
      console.log(err);
      res.status(500).send({
        success: false
        , code: "500"
        , error: {
          message: "Could not find in Oneauth(Internal Server Error)."
        }
      })
    })
  }).catch(function (err) {
    console.log(err);
    res.status(500).send({
      success: false
      , code: "500"
      , error: {
        message: "Could not post data to Oneauth API(Internal Server Error)."
      }
    })
  })
})

module.exports = route;
