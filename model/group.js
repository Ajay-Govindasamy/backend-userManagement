const mongoose = require('mongoose');

//Each member details
const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
});

//Group information with total capacity field
const Groups = new mongoose.Schema({
  groupName: { type: String, required: true, unique: true },
  groupID: { type: Number, required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId },
  ownerName: { type: String, required: true },
  groupCapacity: { type: Number, required: true },
  createdOn: { type: Date, required: true, default: Date.now },
  members: [memberSchema],
});

module.exports = mongoose.model('Groups', Groups);
