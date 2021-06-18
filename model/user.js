const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//Initial User Schema to Register and save the user details
const UserSchema = new Schema({
  username: { type: String, required: true, unique: true, minlength: 5 },
  fullName: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('User', UserSchema);
