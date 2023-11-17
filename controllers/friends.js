const User = require("../modals/ChatUser");
const Friends = require("../modals/Friends");
const dotenv = require("dotenv");
const Pusher = require("pusher");

dotenv.config();

const pusher = new Pusher({
  appId: process.env.appId,
  key: process.env.key,
  secret: process.env.secret,
  cluster: process.env.cluster,
  useTLS: true,
});

// Pending: We have to optimise this so that it will find the pattern not compare them
const searchFriend = (req, res) => {
  const { query } = req.body;
  User.find({ $text: { $search: query } })
    .select("name _id email profilePic")
    .then((users) => {
      console.log(users);
      res.status(200).json({ success: true, users });
    })
    .catch((err) =>
      res.status(500).json({ success: false, message: err.message })
    );
};

// API: That will create the Friend
const addFriend = async (req, res) => {
  const { friendid } = req.params;

  // 1. check if user with this friendid exist or not
  try {
    const friend = await User.findById(friendid);

    // checked if loggedin user and friend id is same
    if (req.user._id == friendid)
      return res.status(400).json({
        success: false,
        message: "you can not send request to yourself",
      });

    if (!friend) {
      return res
        .status(400)
        .json({ success: false, message: "No user Found by this Id" });
    }

    // generating the uniqui id by combining the both user id
    let connectionId;
    if (req.user._id > friendid) connectionId = req.user._id + friendid;
    else connectionId = friendid + req.user._id;

    const alreadyInConnection = await Friends.findOne({
      connectionId: connectionId,
      $or: [{ status: "Pending" }, { status: "Accepted" }],
    });

    // 2. Check if Both are already friends ( Complex Query )
    // const alreadyInConnection = await Friends.findOne({
    //   $or: [{ status: "Pending" }, { status: "Accepted" }],
    //   $or: [
    //     {
    //       sender: req.user._id,
    //       receiver: friendid,
    //     },
    //     {
    //       sender: friendid,
    //       receiver: req.user._id,
    //     },
    //   ],
    // });
    if (alreadyInConnection)
      return res
        .status(400)
        .json({ success: false, message: "Already in Friends" });

    // 2. Adding the new friend in the database
    const newFriend = await Friends.create({
      sender: req.user._id,
      receiver: friendid,
      connectionId: connectionId,
    });
    // searching that new friend again so that we can populate it (newFriend._id == documentId)

    const newFriendComplete = await Friends.findById(newFriend._id).populate(
      "sender"
    );

    pusher.trigger("new-messege-channel", "friend-request", newFriendComplete);

    return res
      .status(200)
      .json({ success: true, message: "Friend Request Sent" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// API: this will return u all your friend who are connected or pending
const giveConnectedFriends = async (req, res) => {
  try {
    const friends = await Friends.find({
      status: "Accepted",
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    }).populate("sender receiver");
    return res.status(200).json({ success: true, friends });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const fetchPendingRequest = async (req, res) => {
  try {
    const friends = await Friends.find({
      status: "Pending",
      receiver: req.user._id,
    }).populate("sender");
    return res.status(200).json({ success: true, friends });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// accept request
const accpetFriendRequest = async (req, res) => {
  try {
    const { docid } = req.params;

    const result = await Friends.findOneAndUpdate(
      { _id: docid, receiver: req.user._id },
      { status: "Accepted" }
    );

    if (!result) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request" });
    }
    // fetch the again in order to populate and send the data
    const acceptedRequest = await Friends.findById(docid).populate(
      "receiver sender"
    );
    pusher.trigger(
      "new-messege-channel",
      "friend-request-accepted",
      acceptedRequest
    );

    return res.status(200).json({ success: true, message: "Request Accepted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const rejectFriendRequest = async (req, res) => {
  const { docid } = req.params;
  const result = await Friends.findOneAndUpdate(
    { _id: docid, receiver: req.user._id },
    { status: "Rejected" }
  );

  if (result)
    return res.status(200).json({ success: true, message: "Request Rejected" });

  return res
    .status(500)
    .json({ success: false, message: "Something went wrong" });
};

module.exports = {
  searchFriend,
  addFriend,
  giveConnectedFriends,
  fetchPendingRequest,
  rejectFriendRequest,
  accpetFriendRequest,
};
