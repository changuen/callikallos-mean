var router = require('express').Router();

//private
var config = require('../../config');
var email = require('../../email');

var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

var options = {
  auth: {
    api_user: email.api_user,
    api_key: email.api_key
  }
};

 var client = nodemailer.createTransport(sgTransport(options));

// localhost/api/activate/token


router.put('/:token', function(req, res, next){
try{

    req.getConnection(function(err, connection) {
      if(err)
      {
        console.error('SQL Connection error: ', err);
        return next(err);
      }

      var token = req.params.token;
      var selectSql = 'select username, email from users where temporarytoken = ?';

      connection.query(selectSql, token, function (err, result, next) {
        if(err) throw err;

        jwt.verify(token, config.secret, function(err, decoded){
          if(err){
            res.status(201).send({success:false,  message:'Activation link has expired.'});
          } else if(!result[0]){
            res.status(201).send({success:false, message:'Activation link has expired.'});
          } else {

            var updateValue = {
              temporarytoken:'0',
              active: '1'
            };

            var userInfo = {
              email:result[0].email,
              username: result[0].username
            };


            var updateSql = 'UPDATE users SET ? WHERE temporarytoken = ?';
              connection.query(updateSql, [updateValue, token], function (err, response) {

            if(err) throw err;
            else {
              var email = {
                from: 'awesome@bar.com',
                to: userInfo.email,
                subject:'Localhost Activation Link',
                text: 'Hello'+ userInfo.username + ', Your account has been successfuly activated!',
                html: 'Hello<strong>'+ userInfo.username + '</strong> Your account has been successfully activated!'
              };

              client.sendMail(email, function(err, info){
                if(err){
                  console.log(err);
                } else {
                  console.log('Message sent:' + info.response);
                }
              });

              res.status(201).send({success: true, message: '아이디가 생성되었습니다.'});
            }
          });


          }
        });

      });
    });

}
catch(ex){
  console.error("Internal error: "+ex);
  return next(ex);
}
});


module.exports= router;
