import contactModel from "../models/contact.js";

export const createContact = async (req, res) => {
  try {
    const { name, message } = req.body;
    const { id: userId, email: userEmail } = req.user;

    if (!name || !message) {
      return res.status(400).json({ msg: "Please fill all required fields" });
    }

    const newContact = new contactModel({
      name,
      email: userEmail,
      message,
      userId
    });

    await newContact.save();
    res.status(200).json({ msg: "Message Sent Successfully" });
  } catch (err) {
    if (err.name === "ValidationError") {
      const fieldErrors = {};
      for (let field in err.errors) {
        fieldErrors[field] = err.errors[field].message;
      }
      return res.status(400).json({ errors: fieldErrors });
    }

    res.status(500).json({ msg: "Server Error, Please try again later" });
  }
};

export const getContacts = async (req, res) => {
  try {
    const messages = await contactModel.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ msg: "Unable to fetch messages" });
  }
};
