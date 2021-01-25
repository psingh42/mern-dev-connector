const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/Users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

//@route    POST api/auth
//@desc     Authenticate user & get token
//@access   Public
router.post('/', [
    check('email', 'Email is required').isEmail(),
    check('password', 'Password is required').exists()

], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {email, password} = req.body;

    try {
        //Check if user exists
        let user = await User.findOne({email})
        if(!user){
            return res.status(400).json({errors: [{msg: 'Invalid credentials'}]});
        }

        const isMatch = await bcrypt.compare(password, user.password);  
        if(!isMatch){
            return res.status(400).json({errors: [{msg: 'Invalid credentials'}]});
        }

         //Return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload,
            config.get("jwtSecret"), 
            {expiresIn: 360000},
            (error, token) =>{
                if(error) throw error;
                res.json({token});  
            }
            );

       // res.send('User registered');

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }


});
module.exports = router;