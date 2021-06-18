const { check, validationResult } = require('express-validator/check');
const User = require('../model/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('config');
const express = require('express');
const router = express.Router();

router.post(
  '/signup',
  [
    //registration field validations
    check('username')
      .notEmpty()
      .isLength({ min: 5 })
      .withMessage('Username must have at least 5 characters'),
    check('fullName').notEmpty(),
    check('password')
      .notEmpty()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    check('email').notEmpty().isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).jsonp(errors.array());
    } else {
      let u = await User.findOne({ email: req.body.email });
      if (u)
        return res.status(400).send({ error: 'Email already registered.' });
      const salt = await bcrypt.genSalt(10);
      const result = await bcrypt.hash(req.body.password, salt);

      let user = new User({
        username: req.body.username,
        fullName: req.body.fullName,
        password: result,
        email: req.body.email,
      });
      user = await user.save().catch((err) => res.status(400).send(err));
      // put expiry in this format Eg: 60, "2 days", "10h", "7d"
      const tok = jwt.sign(
        {
          email: req.body.email,
          password: req.body.password,
        },
        config.get('jwtPrivateKey'),
        { expiresIn: '15d' }
      );

      //successgful registration response
      return res.status(200).header('x-auth-token', tok).send({
        status: 'success',
        token: tok,
        user: user,
      });
    }
  }
);

//User sign-in
router.post('/signin', async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user)
    return res
      .status(400)
      .send({ error: 'No account registered with this email .' });
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (validPassword) {
    // put expiry in this format Eg: 60, "2 days", "10h", "7d"
    const tok = jwt.sign(
      {
        email: req.body.email,
        password: req.body.password,
      },
      config.get('jwtPrivateKey'),
      { expiresIn: '15d' }
    );
    res.status(200).header('x-auth-token', tok).send({
      status: 'success',
      token: tok,
      user: user,
    });
  } else {
    res.status(400).send({ error: 'Wrong Password.' });
  }
});

//Handling forgot password
router.post('/changePassword', async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user)
    return res
      .status(400)
      .send({ error: 'No account registered with this email .' });

  const salt = await bcrypt.genSalt(10);
  const result = await bcrypt.hash(req.body.password, salt);
  user.password = result;
  await user.save();
  res.send({ success: 'Password Changed Successfully.' });
});

//fetching all the users list
router.get('/allUser', async (req, res) => {
  let user = await User.find();

  return res.status(200).send(user);
});

module.exports = router;
