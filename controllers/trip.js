import tripModel from "../models/newTrip.js";
import User from "../models/userModel.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const createTrip = async (req, res) => {
  try {
    const { name, phone, from, to, date, space, price, description, agree } = req.body;
    let errors = {};

    if (!from) errors.from = "Please select your departure city";
    if (!to) errors.to = "Please select your destination city";
    if (!date) errors.date = "Please provide your travel date";
    if (!space) errors.space = "Please specify available space (in KG)";
    if (!price) errors.price = "Please enter the price for your trip";
    if (price && price < 0) errors.price = "Price cannot be negative";
    if (!agree) errors.agree = "You must agree to terms";
    if (!name) errors.name = "Please provide your full name";
    if (!phone) {
      errors.phone = "Please provide your phone number";
    } else if (!/^\+92\d{10}$/.test(phone)) {
      errors.phone = "Phone number must start with +92 and contain 10 digits";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const newTrip = new tripModel({
      userId: req.user.id,
      name,
      phone,
      from,
      to,
      date,
      space,
      price,
      description,
      agree,
    });
    await newTrip.save();

    try {
      const user = await User.findById(req.user.id);
      if (user && user.email) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Trip Confirmation - PakCarry",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
              <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #0ac6ae; text-align: center; margin-bottom: 20px;">Trip Confirmation</h2>
                
                <p style="font-size: 16px; color: #333;">Hello ${user.name},</p>
                <p style="font-size: 16px; color: #333;">Your trip has been created successfully and visible to all senders!</p>
<p style="font-size: 16px; color: #333;">
Senders will contact you shortly, or you can directly reach out to senders for your destination.
</p>                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #0ac6ae; margin-bottom: 15px;">Trip Details:</h3>
                  <p><strong>Traveler:</strong> ${name}</p>
                  <p><strong>Contact:</strong> ${phone}</p>
                  <p><strong>From:</strong> ${from}</p>
                  <p><strong>To:</strong> ${to}</p>
                  <p><strong>Travel Date:</strong> ${new Date(date).toLocaleDateString()}</p>
                  <p><strong>Available Space:</strong> ${space} kg</p>
                  <p><strong>Price:</strong> Rs. ${price}</p>
                  ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
                </div>
                
                <p style="font-size: 14px; color: #666; text-align: center;">
                  Thank you for choosing PakCarry. Senders will be able to see your trip and contact you.
                </p>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="font-size: 12px; color: #999;">PakCarry Team</p>
                </div>
              </div>
            </div>
          `,
        };

        transporter.sendMail(mailOptions).catch((emailError) => {
        });
      }
    } catch (emailError) {
    }

    res.status(200).json({ msg: "Trip created successfully", trip: newTrip });
  } catch (err) {
    if (err.name === "ValidationError") {
      let errors = {};
      Object.keys(err.errors).forEach((key) => {
        errors[key] = err.errors[key].message;
      });
      return res.status(400).json({ errors });
    }
    res.status(500).json({ msg: "Server error, please try again later" });
  }
};

export const getTrip = async (req, res) => {
  try {
    const trips = await tripModel.find().sort({ createdAt: 1 });
    res.status(200).json(trips);
  } catch (err) {
    res.status(500).json({ msg: "Unable to fetch trips" });
  }
};

export const getUserTrips = async (req, res) => {
  try {
    const trips = await tripModel.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(trips);
  } catch (err) {
    res.status(500).json({ msg: "Unable to fetch user trips" });
  }
};

export const searchTrips = async (req, res) => {
  try {
    const { name, phone, from, to, startDate, endDate } = req.query;

    const query = {};
    if (from) query.from = from;
    if (to) query.to = to;
    if (name) query.name = name;
    if (phone) query.phone = phone;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const trips = await tripModel.find(query).sort({ date: 1 });
    res.status(200).json(trips);
  } catch (err) {
    res.status(500).json({ msg: "Unable to search trips" });
  }
};

export const getSingleTrip = async (req, res) => {
  try {
    const singleTrip = await tripModel.findById(req.params.id);
    if (!singleTrip) {
      return res.status(404).json({ msg: "Trip not found" });
    }
    res.status(200).json(singleTrip);
  } catch (err) {
    res.status(500).json({ msg: "Server error, please try again later" });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const updatedTrip = await tripModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedTrip) {
      return res.status(404).json({ msg: "Trip not found" });
    }

    res.status(200).json({ msg: "Trip details updated successfully", trip: updatedTrip });
  } catch (err) {
    if (err.name === "ValidationError") {
      let errors = {};
      Object.keys(err.errors).forEach((key) => {
        errors[key] = err.errors[key].message;
      });
      return res.status(400).json({ errors });
    }

    res.status(500).json({ msg: "Server error, please try again later" });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    const deletedTrip = await tripModel.findByIdAndDelete(req.params.id);
    if (!deletedTrip) {
      return res.status(404).json({ msg: "Trip not found" });
    }
    res.status(200).json({ msg: "Trip deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error, please try again later" });
  }
};
