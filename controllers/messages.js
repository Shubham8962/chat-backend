const Messages = require("../modals/Messages");
const Pusher = require("pusher");
const dotenv = require("dotenv");

dotenv.config();

const pusher = new Pusher({
  appId: process.env.appId,
  key: process.env.key,
  secret: process.env.secret,
  cluster: process.env.cluster,
  useTLS: true,
});

//  this function will send the message

const sendMessage = async (req, res) => {
  // receiver = objectid (string)
  // message  = string
  try {
    const { message, reciever } = req.body;
    let messageId;
    if (reciever > req.user._id) {
      messageId = reciever + req.user._id;
    } else {
      messageId = req.user._id + reciever;
    }

    // insert the data
    const newMessege = await Messages.create({
      message: message,
      sender: req.user._id,
      reciever: reciever,
      messageId: messageId,
    });

    // after inserting message we will trigger the pusher channel
    pusher.trigger("new-messege-channel", "messege-added", newMessege);

    return res.status(200).json({ success: true, message: "Message Sent" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

//  it will read all the meaasges
const fetchAllMessages = async (req, res) => {
  try {
    const { reciever } = req.params;
    // generate message id
    let messageId;
    if (reciever > req.user._id) {
      messageId = reciever + req.user._id;
    } else {
      messageId = req.user._id + reciever;
    }

    // fetch all the messages of this message id
    const messeges = await Messages.find({ messageId: messageId });

    return res.status(200).json({ success: true, messeges });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { sendMessage, fetchAllMessages };
