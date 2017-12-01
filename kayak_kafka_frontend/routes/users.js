let express = require('express');
const passport = require("passport");
let router = express.Router();
require('./passport')(passport);
var kafka = require('./kafka/client');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/login', function (req, res) {
    console.log(req.body);
    passport.authenticate('login', function (err, response) {
        console.log("response:");
        console.log(response);
        if (err) {
            console.log(err);
            res.status(400).send();
        }
        if (response.status === 200) {
            req.session.username = response.username;
            console.log("session initialized. :" + req.session.username);
            res.status(response.status).send(req.session.username);
        }
        else if (response.status === 201) {
            req.session.username = response.username;
            console.log("session initialized for admin. : ");
            console.log(req.session.username);
            res.status(response.status).send(req.session.username);
        }
        else if (response.status === 400) {
            res.status(response.status).send({"message": response.message});
        }
        else {
            res.status(401).send({"message": "Login Failed"});
        }
    })(req, res);
});

router.post('/logout', function (req, res) {

    console.log(req.session.username);
    console.log(req.session);
    if (req.session.username !== null && req.session.username !== undefined) {
        req.session.destroy();
        console.log('Session Destroyed');
        res.status(200).send();
    }
    else {
        console.log('Session does not exist');
        res.status(400).send();
    }

});

router.post('/validateSession', function (req, res) {
    console.log(req.session.username);
    if (req.session.username !== null && req.session.username !== undefined) {
        res.status(200).send({"username": req.session.username});
    }
    else {
        res.status(204).end();
    }
});

router.post('/signup', function (req, res, next) {
    try {
        console.log(req.body);
        kafka.make_request('signup_topic', req.body, function (err, results) {
            console.log('in result');
            console.log(results);
            if (err) {
                console.log(err);
                throw err;
            }
            else {
                if (results.status === 200) {
                    req.session.username = results.username;
                    console.log("Received username: " + results.username);
                    console.log("Local username: " + req.body.username);
                    res.status(results.status).send({"message": "Signup Successful"});
                }
                else if (results.status === 201) {
                    req.session.username = results.username;
                    console.log("Received admin username: " + results.username);
                    console.log("Local username: " + req.body.username);
                    res.status(results.status).send({"message": "Signup Successful"});
                }
                else if (results.status === 301) {
                    res.status(results.status).send({"message": "User already Exist"});
                }
                else if (results.status === 400) {
                    res.status(results.status).send({"message": "Signup Failed"});
                }
            }
        });
    }
    catch (e) {
        console.log(e);
        res.status(400).json({message: "Signup Failed"});
    }
});

router.post('/getFlightDetails', function (req, res) {

    console.log("2 : " + req.body);
    try {
        kafka.make_request('getFlightDetails_topic', req.body, function(err, results) {

            console.log("8");
            console.log(results);
            console.log(results.status);
            console.log(results.message);
            console.log(results.flight);


            if(err) {
                console.log(err);
                throw(err);
            }
            else {
                if(results.status === 200) {
                    console.log("9");
                    res.status(results.status).send(results.flight);
                }
                else {
                    console.log("In users.js - getFlightDetails - Some other status code");
                }
            }
        });
    }
    catch (e) {
        console.log(e);
        res.status(400).json({message: "Get flight details failed"});
    }
});

router.post('/getUserDetails', function (req, res) {
    try {
        console.log(req.session.username);

        //edit payload
        payload = {
            username : req.session.username
        };
        console.log("12");

        //edit if statements
        kafka.make_request('getUserDetails_topic', payload, function (err, results) {
            console.log('in result');
            console.log(results);

            if (err) {
                console.log(err);
                throw err;
            }
            else {
                if (results.status === 200) {

                    res.status(results.status).send(results);
                }
                else if (results.status === 400) {
                    res.status(results.status).send({"message": "Fetch unsuccessful"});
                }
            }
        });
    }
    catch (e) {
        console.log(e);
        res.status(400).json({message: "Fetch unsuccessful"});
    }
});

module.exports = router;
