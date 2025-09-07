import Order from "../models/order.js";
import User from "../models/userModel.js";
import Payment from "../models/payment.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const createOrder = async (req, res) => {
  try {
    const { senderName, senderPhone, earliestDate, lastDate, from, to, weight, description } = req.body;

    const errors = {};
    if (!senderName) errors.senderName = "Please enter Full Name";
    if (!senderPhone) errors.senderPhone = "Please enter contact number";
    if (!earliestDate) errors.earliestDate = "Please select the earliest delivery date";
    if (!lastDate) errors.lastDate = "Please select the last delivery date";
    if (!from) errors.from = "Please enter the origin city";
    if (!to) errors.to = "Please enter the destination city";
    if (!weight) errors.weight = "Please enter the package weight i.e .40kg maximum";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const imagePaths = req.files?.map(file => file.filename) || [];

    const order = new Order({
      userId: req.user.id,
      senderName,
      senderPhone,
      earliestDate,
      lastDate,
      from,
      to,
      weight,
      description,
      images: imagePaths
    });

    await order.save();

    try {
      const user = await User.findById(req.user.id);
      if (user && user.email) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Order Confirmation - PakCarry",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
              <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #0ac6ae; text-align: center; margin-bottom: 20px;">Order Confirmation</h2>
                
                <p style="font-size: 16px; color: #333;">Hello ${user.name},</p>
                <p style="font-size: 16px; color: #333;">Your order has been created successfully!</p>
<p style="font-size: 16px; color: #333;">
Travelers going to your destination city will contact you, or you can also reach out to them directly.
</p>                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #0ac6ae; margin-bottom: 15px;">Order Details:</h3>
                  <p><strong>Name:</strong> ${senderName}</p>
                  <p><strong>Contact:</strong> ${senderPhone}</p>
                  <p><strong>From:</strong> ${from}</p>
                  <p><strong>To:</strong> ${to}</p>
                  <p><strong>Weight:</strong> ${weight} kg</p>
                  <p><strong>Earliest Date:</strong> ${new Date(earliestDate).toLocaleDateString()}</p>
                  <p><strong>Last Date:</strong> ${new Date(lastDate).toLocaleDateString()}</p>
                  ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
                </div>

                <div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #856404; font-size: 14px; margin: 0; text-align: center;">
                     <strong>Important Alert:</strong> Please make payments <u>only through the official PakCarry website</u>.<br>
                    Payments made outside our platform will <strong>not be refunded</strong>, and PakCarry will not be responsible for any loss.
                  </p>
                </div>
                
                <p style="font-size: 14px; color: #666; text-align: center;">
                  Thank you for choosing PakCarry.
                </p>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="font-size: 12px; color: #0ac6ae;">PakCarry Team</p>
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

    res.json({ message: "Order created successfully", order });

  } catch (err) {
    if (err.name === "ValidationError") {
      let errors = {};
      Object.keys(err.errors).forEach((key) => {
        errors[key] = err.errors[key].message;
      });
      return res.status(400).json({ errors });
    }

    res.status(500).json({ message: "Error creating order", error: err.message });
  }
};


export const getOrders = async (req, res) => {
  try {
    // Get all orders
    let orders;
    if (req.user) {
      orders = await Order.find({ userId: req.user.id, status: { $ne: "completed" } }).sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ status: { $ne: "completed" } }).sort({ createdAt: -1 });
    }

    // Get all completed payments for orders
    const paidOrders = await Payment.find({ 
      orderType: "order", 
      status: "completed" 
    }).select('orderId');
    
    // Extract order IDs that have been paid for
    const paidOrderIds = paidOrders.map(payment => payment.orderId.toString());
    
    // Filter out orders that have been paid for
    const availableOrders = orders.filter(order => 
      !paidOrderIds.includes(order._id.toString())
    );

    res.json(availableOrders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    // Get user orders
    const orders = await Order.find({ userId: req.user.id, status: { $ne: "completed" } }).sort({ createdAt: -1 });

    // Get all completed payments for orders
    const paidOrders = await Payment.find({ 
      orderType: "order", 
      status: "completed" 
    }).select('orderId');
    
    // Extract order IDs that have been paid for
    const paidOrderIds = paidOrders.map(payment => payment.orderId.toString());
    
    // Filter out orders that have been paid for
    const availableOrders = orders.filter(order => 
      !paidOrderIds.includes(order._id.toString())
    );

    res.json(availableOrders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user orders", error: err.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Error fetching order", error: err.message });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { senderName, senderPhone, earliestDate, lastDate, from, to, weight, description, status } = req.body;

    const isStatusOnlyUpdate = Object.keys(req.body).length === 1 && req.body.hasOwnProperty('status');
    
    if (!isStatusOnlyUpdate) {
      const errors = {};
      if (!senderName) errors.senderName = "Please enter the sender's full name";
      if (!senderPhone) errors.senderPhone = "Please enter the sender's contact number";
      if (!earliestDate) errors.earliestDate = "Please select the earliest delivery date";
      if (!lastDate) errors.lastDate = "Please select the last delivery date";
      if (!from) errors.from = "Please enter the origin city";
      if (!to) errors.to = "Please enter the destination city";
      if (!weight) errors.weight = "Please enter the package weight";

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
      }
    }

    const imagePaths = req.files?.map(file => file.filename) || [];

    const updateData = {
      ...(senderName && { senderName }),
      ...(senderPhone && { senderPhone }),
      ...(earliestDate && { earliestDate }),
      ...(lastDate && { lastDate }),
      ...(from && { from }),
      ...(to && { to }),
      ...(weight && { weight }),
      ...(description && { description }),
      ...(status && { status }),
      ...(imagePaths.length > 0 && { images: imagePaths })
    };

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedOrder) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order updated successfully", order: updatedOrder });
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = {};
      for (let field in err.errors) {
        errors[field] = err.errors[field].message;
      }
      return res.status(400).json({ errors });
    }
    res.status(500).json({ message: "Error updating order", error: err.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting order", error: err.message });
  }
};
