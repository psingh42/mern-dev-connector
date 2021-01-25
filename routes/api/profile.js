const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/Users');
const { route } = require('./Users');

//@route    GET api/profile/me
//@desc     Get current user's profile
//@access   private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.user.id}).populate(
            'user', 
            ['name', 'avatar']
            );
        if(!profile){
            return res.status(400).json({msg: 'No profile exists for this user'});
        }
        
        res.json(profile);

    } catch (error) {
        console.error(error.message)
        res.status(500).send("Server error!")
    }
});

//@route    POST api/profile
//@desc     Create or update user profile
//@access   private

router.post('/', [auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty(),
]], async (req, res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;

    // Build profile object
    const proflleFields = {};
    proflleFields.user = req.user.id;
    if(company) proflleFields.company = company;
    if(website) proflleFields.website = website;
    if(location) proflleFields.location = location;
    if(bio) proflleFields.bio = bio;
    if(status) proflleFields.status = status;
    if(githubusername) proflleFields.githubusername = githubusername;
    if(skills) {
        proflleFields.skills = skills.split(',').map(skill => skill.trim());
    }
    
    //Build social object
    proflleFields.social = {};
    if(youtube) proflleFields.social.youtube = youtube;
    if(facebook) proflleFields.social.facebook = facebook;
    if(twitter) proflleFields.social.twitter = twitter;
    if(instagram) proflleFields.social.instagram = instagram;
    if(linkedin) proflleFields.social.linkedin = linkedin;

    try {
        let profile = await Profile.findOne({user: req.user.id});
        if(profile){
            //update
            profile = await Profile.findOneAndUpdate(
                {user: req.user.id},
                {$set: proflleFields},
                {new: true}
                );
            return res.json(profile);
        }
        //create
        profile = new Profile(proflleFields);
        await profile.save();

        res.json(profile);

    } catch (error) {
        console.error(error.message)
        res.status(500).send("Server error!")
    }
});

//@route    GET api/profile
//@desc     Get all profiles
//@access   public
router.get('/', async (req, res) =>{
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
        
    } catch (error) {
        console.error(error.message)
        res.status(500).send("Server error!")
    }
});

//@route    GET api/profile/user/:user_id
//@desc     Get profile by user ID
//@access   public
router.get('/user/:user_id', async (req, res) =>{
    try {
        const profile = await Profile.findOne({user: req.params.user_id}).populate('user', ['name', 'avatar']);
        res.json(profile);
        
        if(!profile){
            return res.status(400).json({msg: 'Profile not found'});
        }  
    } catch (error) {
        console.error(error.message)
        if(error.kind == 'ObjectId'){
            return res.status(400).json({msg: 'Profile not found'});
        }
        res.status(500).send("Server error!")
    }
});
//@route    DELETE api/profile
//@desc     Delete profile, user, post
//@access   public
router.delete('/', auth, async (req, res) =>{
    try {
        //@todo Remove post
        //Remove profile
        await Profile.findOneAndRemove({user: req.user.id});
        //Remove user
        await User.findOneAndRemove({_id: req.user.id});

        res.json('User deleted');
        
    } catch (error) {
        console.error(error.message)
        res.status(500).send("Server error!")
    }
});

//@route    PUT api/profile/experience
//@desc     Add profile experience
//@access   private
router.put('/experience', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty(),
]], async (req, res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({user: req.user.id});
        profile.experience.unshift(newExp);
        await profile.save();

        res.json(profile);
        
    } catch (error) {
        console.error(error.message)
        res.status(500).send("Server error!")
    }
});

//@route    DELETE api/profile/experience/:exp_id
//@desc     Delete experience
//@access   private
router.delete('/experience/:exp_id', auth, async (req, res) =>{
    try {
        const profile = await Profile.findOne({user: req.user.id});
        removeIndex = profile.experience.map(item => item.id).indexOf(req.param.exp_id);
        profile.experience.splice(removeIndex, 1)

        await profile.save();
        res.json(profile);
        
    } catch (error) {
        console.error(error.message)
        res.status(500).send("Server error!")
    }
});

//@route    PUT api/profile/education
//@desc     Add profile education
//@access   private
router.put('/education', [auth, [
    check('degree', 'Degree is required').not().isEmpty(),
    check('school', 'School is required').not().isEmpty(),
    check('fieldofstudy', 'Field of study is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty(),
]], async (req, res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({user: req.user.id});
        profile.education.unshift(newEdu);
        await profile.save();

        res.json(profile);
        
    } catch (error) {
        console.error(error.message)
        res.status(500).send("Server error!")
    }
});

//@route    DELETE api/profile/education/:edu_id
//@desc     Delete education
//@access   private
router.delete('/education/:edu_id', auth, async (req, res) =>{
    try {
        const profile = await Profile.findOne({user: req.user.id});
        removeIndex = profile.education.map(item => item.id).indexOf(req.param.edu_id);
        profile.education.splice(removeIndex, 1)

        await profile.save();
        res.json(profile);
        
    } catch (error) {
        console.error(error.message)
        res.status(500).send("Server error!")
    }
});

//@route    GET api/profile/github/:username
//@desc     Get userreps from github
//@access   public
router.get('/github/:username', async (req, res) =>{
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_pages=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubClientSecret')}`,
            method: 'GET',
            headers: {'user-agent': 'node.js'} 
        };

        request(options, (error, response, body) =>{
            if(error) console.log(error);

            if(response.statusCode !== 200){
               return res.status(400).json({msg: 'No Github profile found'}); 
            }

            res.json(JSON.parse(body));
        })

    } catch (error) {
        console.error(error.message)
        res.status(500).send("Server error!")
    }
});

module.exports = router;