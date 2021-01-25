const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/Users');

//@route    POST api/users
//@desc     Register user
//@access   Public
router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Email is required').isEmail(),
    check('password', 'Minimum six characters required').isLength({ min: 6})

], async (req, res) => {
   
     const errors = validationResult(req.body);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    const {name, email, password} = req.body;
    
     try {
        //Check if user exists
        let user = await User.findOne({email})
        if(user){
            console.log('User already exists');
            return res.status(400).json({errors: [{msg: 'User already exists'}]});
        }

        //Get user's gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        user = new User({
            name,
            email,
            avatar,
            password
        })
        
        //Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

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

    //    res.send('User registered');

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }


});

module.exports = router;