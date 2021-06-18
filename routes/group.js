const express = require('express');
const mongoose = require('mongoose');
const Groups = require('../model/group');
const User = require('../model/user');
const auth = require('../middleware/auhenticate');
const router = express.Router();

//Admin can create/update/delete Groups
//Initially the person who creates the group becomes admin
router.post('/createGroup/:username', auth, async (req, res) => {
  let user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(400).send({ error: 'No such user present.' });
  let members = [];

  let u = {
    name: user.fullName,
    userName: user.username,
    email: user.email,
    isAdmin: true,
  };
  members.push(u);
  let group = new Groups({
    groupName: req.body.groupName,
    groupID: req.body.groupID,
    owner: user._id,
    ownerName: user.fullName,
    groupCapacity: req.body.groupCapacity,
    members: members,
  });
  await group.save().catch((err) => res.status(400).send(err));
  res.status(200).send({ message: 'Group Created.', group: group });
});

//Deleting a group- Only by admins
router.delete('/deleteGroup/:id/:adminUserName', auth, async (req, res) => {
  const group = await Groups.findOne({ groupID: req.params.id });
  if (!group)
    return res.status(400).send({
      message: 'Something went wrong. No group present with given ID.',
    });

  let user = await User.findOne({ username: req.params.adminUserName });
  if (!user) return res.status(400).send({ error: 'No such user present.' });

  const docs = await Groups.find({ groupID: req.params.id }).select(
    'members -_id'
  );
  for (const [i, value] of docs[0].members.entries()) {
    if (
      docs[0].members[i].userName == user.username &&
      docs[0].members[i].isAdmin
    ) {
      await Groups.findOneAndDelete({ groupID: req.params.id });
      return res.status(200).send({ message: 'Group Removed.' });
    }
  }
  return res.status(400).send({
    message: 'User is either not present in the group or not an admin.',
  });
});

//Removing a member from the group - Only by group admin(s)
router.delete(
  '/removeMember/:id/:userName/:adminUserName',
  auth,
  async (req, res) => {
    let checkAdmin = false;
    if (req.params.userName == req.params.adminUserName) {
      return res
        .status(400)
        .send({ error: 'You are admin. Try deleting group.' });
    }
    const group = await Groups.findOne({ groupID: req.params.id });
    if (!group)
      return res.status(400).send({
        message: 'Something went wrong. No group present with given ID.',
      });

    let user = await User.findOne({ username: req.params.userName });
    if (!user) return res.status(400).send({ error: 'No such user present.' });

    let aduser = await User.findOne({ username: req.params.adminUserName });
    if (!aduser)
      return res.status(400).send({ error: 'No such user present.' });

    const docs = await Groups.find({ groupID: req.params.id }).select(
      'members -_id'
    );
    for (const [i, value] of docs[0].members.entries()) {
      if (
        docs[0].members[i].userName == req.params.adminUserName &&
        docs[0].members[i].isAdmin
      ) {
        checkAdmin = true;
      }
    }
    if (checkAdmin) {
      for (const [i, value] of docs[0].members.entries()) {
        if (docs[0].members[i].userName == req.params.userName) {
          var existingMenbers = [];
          existingMenbers = group.members;
          existingMenbers.splice(i, 1);
          group.members = existingMenbers;
          await group.save();
          return res.status(200).send({ message: 'Member Removed.' });
        }
      }
      return res.status(400).send({ message: 'User not present in Group.' });
    } else {
      return res.status(400).send({
        message:
          "You are not admin. You don't have permission to remove member.",
      });
    }
  }
);

//Admin can add Users
router.put(
  '/joinGroup/:id/:username/:adminUserName',
  auth,
  async (req, res) => {
    let checkAdmin = false;

    let user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(400).send({ error: 'No such user present.' });

    let aduser = await User.findOne({ username: req.params.adminUserName });
    if (!aduser)
      return res.status(400).send({ error: 'No such user present.' });

    let group = await Groups.findOne({ groupID: req.params.id });
    if (!group)
      return res.status(400).send({ message: 'Group Does not Exits' });

    let newMenber = {
      name: user.fullName,
      userName: user.username,
      email: user.email,
    }; //Any user joing the group is not an admin by default i.e isAdmin == false

    const docs = await Groups.find({ groupID: req.params.id }).select(
      'members -_id'
    );

    for (const [i, value] of docs[0].members.entries()) {
      if (
        docs[0].members[i].userName == user.userName ||
        docs[0].members[i].email == user.email
      ) {
        return res.status(400).send({ message: 'Already in group.' });
      }
      if (
        docs[0].members[i].userName == req.params.adminUserName &&
        docs[0].members[i].isAdmin
      ) {
        checkAdmin = true;
      }
    }
    if (checkAdmin) {
      if (group.members.length < group.groupCapacity) {
        var existingMenbers = [];
        existingMenbers = group.members;
        existingMenbers.push(newMenber);
        group.members = existingMenbers;
        await group.save();
        return res.status(200).send({ message: 'Member Added.', group: group });
      } else {
        return res.status(400).send({ message: 'Group Capacity Exceeded.' });
      }
    } else {
      return res.status(400).send({ message: 'You are not Group Admin.' });
    }
  }
);

//A group can have multiple GroupAdmins
router.put(
  '/makeAsAdmin/:id/:username/:adminUserName',
  auth,
  async (req, res) => {
    let checkAdmin = false;
    let isInGroup = false;

    let group = await Groups.findOne({ groupID: req.params.id });
    if (!group)
      return res.status(400).send({ message: 'Group Does not Exits' });
    let user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(400).send({ error: 'No such user present.' });
    let aduser = await User.findOne({ username: req.params.adminUserName });
    if (!aduser)
      return res.status(400).send({ error: 'No such user present.' });
    const docs = await Groups.find({ groupID: req.params.id }).select(
      'members -_id'
    );

    for (const [i, value] of docs[0].members.entries()) {
      if (docs[0].members[i].userName == req.params.username) {
        isInGroup = true;
      }
      if (
        docs[0].members[i].userName == req.params.adminUserName &&
        docs[0].members[i].isAdmin
      ) {
        checkAdmin = true;
      }
    }

    if (checkAdmin) {
      if (isInGroup) {
        for (const [i, value] of docs[0].members.entries()) {
          if (docs[0].members[i].userName == req.params.username) {
            var existingMenbers = [];
            existingMenbers = group.members;

            let data = existingMenbers[i];
            data.isAdmin = true;

            existingMenbers[i] = data;
            group.members = existingMenbers;
            await group.save();
            return res
              .status(200)
              .send({ message: 'Admin Permission Granted.' });
          }
        }
      } else {
        return res.status(400).send({ message: 'User not in group.' });
      }
    } else {
      return res.status(400).send({ message: 'You are not a Group Admin.' });
    }
  }
);

//moving admin back to normal user
router.put(
  '/removeAsAdmin/:id/:username/:adminUserName',
  auth,
  async (req, res) => {
    let checkAdmin = false;
    let isInGroup = false;

    let group = await Groups.findOne({ groupID: req.params.id });
    if (!group)
      return res.status(400).send({ message: 'Group Does not Exits' });
    let user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(400).send({ error: 'No such user present.' });
    let aduser = await User.findOne({ username: req.params.adminUserName });
    if (!aduser)
      return res.status(400).send({ error: 'No such user present.' });
    const docs = await Groups.find({ groupID: req.params.id }).select(
      'members -_id'
    );

    for (const [i, value] of docs[0].members.entries()) {
      if (docs[0].members[i].userName == req.params.username) {
        isInGroup = true;
      }
      if (
        docs[0].members[i].userName == req.params.adminUserName &&
        docs[0].members[i].isAdmin
      ) {
        checkAdmin = true;
      }
    }

    if (checkAdmin) {
      if (isInGroup) {
        for (const [i, value] of docs[0].members.entries()) {
          if (docs[0].members[i].userName == req.params.username) {
            var existingMenbers = [];
            existingMenbers = group.members;

            let data = existingMenbers[i];
            data.isAdmin = false;

            existingMenbers[i] = data;
            group.members = existingMenbers;
            await group.save();
            return res
              .status(200)
              .send({ message: 'Admin Permission Revoked.' });
          }
        }
      } else {
        return res.status(400).send({ message: 'User not in group.' });
      }
    } else {
      return res.status(400).send({ message: 'You are not a Group Admin.' });
    }
  }
);

//List of all groups present
router.get('/allGroups', auth, async (req, res) => {
  const allGroups = await Groups.find();
  if (!allGroups)
    return res.status(400).send({ message: 'Something went wrong.' });
  res.status(200).send(allGroups);
});

//Getting all members of a group
router.get('/getGroup/:id', auth, async (req, res) => {
  const group = await Groups.findOne({ groupID: req.params.id });
  if (!group) return res.status(400).send({ message: 'Something went wrong.' });
  res.status(200).send(group);
});

router.get('/getAllMembers/:id', auth, async (req, res) => {
  const group = await Groups.findOne({ groupID: req.params.id });
  if (!group) return res.status(400).send({ message: 'Something went wrong.' });
  res.status(200).send(group.members);
});

module.exports = router;
