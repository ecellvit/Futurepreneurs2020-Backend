const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const bodyParser = require("body-parser");

require("dotenv").config();
const Team = require("../models/team");

const router = express.Router();

router.post('/reg', async (req, res) => {
    const { name, adminPass, specPass, code } = req.body;
    const found = await Team.findOne({
        code
    });
    if (found || code === "FPadmin") {
        console.log("Code Exists");
        return res.status(201).json({ message: "Team Code Already Exist" });
    }
    if(adminPass === specPass) {
        console.log("Same Passwords Attempt");
        return res.status(201).json({ message: "Both passwords cannot match" });
    }
    bcrypt.hash(adminPass, 10, async (err1, hash1) => {
        bcrypt.hash(specPass, 10, async (err2, hash2) => {
            const team = new Team({
                _id: new mongoose.Types.ObjectId(),
                name,
                adminPass: hash1,
                specPass: hash2,
                code,
                amenSub: false,
                camSub: false
            })
            await team.save().then((result) => {
                console.log(result);
                return res.status(200).json({
                    message: "Team Registered Successfully!",
                    result
                });
            })
                .catch((err) => {
                    console.log(err);
                    return res.status(201).json({ message: "Failed" });
                });
        })
    })
});

router.post('/login', async (req, res) => {
    Team.find({ code: req.body.code })
        .exec()
        .then((team) => {
            console.log(team)
            if (team.length < 1) {
                if (process.env.adminCode === req.body.code && process.env.adminPass === req.body.password) {
                    console.log("Admin Login");
                    const token = jwt.sign(
                        {
                            teamId: "admin",
                            code: "admin",
                            name: "admin",
                            userType: "A"
                        },
                        process.env.jwtSecret,
                        {
                            expiresIn: "1d",
                        }
                    );
                    return res.status(200).json({
                        message: "Auth successful",
                        teamDetails: {
                            teamId: "admin",
                            code: "admin",
                            name: "admin",
                            userType: "A"
                        },
                        token: token,
                    });
                }
                return res.status(201).json({
                    message: "Auth failed: Email not found probably",
                });
            }
            bcrypt.compare(req.body.password, team[0].specPass, async (err1, result1) => {
                if (result1) {
                    const token = jwt.sign(
                        {
                            teamId: team[0]._id,
                            code: team[0].code,
                            name: team[0].name,
                            userType: "S",
                            amenSub: team[0].amenSub,
                            camSub: team[0].camSub
                        },
                        process.env.jwtSecret,
                        {
                            expiresIn: "1d",
                        }
                    );
                    console.log(team[0])
                    return res.status(200).json({
                        message: "Auth successful",
                        teamDetails: {
                            teamId: team[0]._id,
                            code: team[0].code,
                            name: team[0].name,
                            userType: "S",
                            amenSub: team[0].amenSub,
                            camSub: team[0].camSub
                        },
                        token: token,
                    });
                } else {
                    bcrypt.compare(req.body.password, team[0].adminPass, async (err, result) => {
                        if (result) {
                            const token = jwt.sign(
                                {
                                    teamId: team[0]._id,
                                    code: team[0].code,
                                    name: team[0].name,
                                    userType: "L",
                                    amenSub: team[0].amenSub,
                                    camSub: team[0].camSub
                                },
                                process.env.jwtSecret,
                                {
                                    expiresIn: "1d",
                                }
                            );
                            console.log(team[0])
                            return res.status(200).json({
                                message: "Auth successful",
                                teamDetails: {
                                    teamId: team[0]._id,
                                    code: team[0].code,
                                    name: team[0].name,
                                    userType: "L",
                                    amenSub: team[0].amenSub,
                                    camSub: team[0].camSub
                                },
                                token: token,
                            });
                        }
                        return res.status(201).json({
                            message: "Auth failed",
                        });
                    });
                }
            });
        })
        .catch((err) => {
            res.status(500).json({
                error: err,
            });
        });
});

//At end
module.exports = router;