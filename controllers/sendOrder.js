import SendOrder from "../models/sendOrder.js";
import User from "../models/userModel.js";
import Payment from "../models/payment.js";
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

export const createSendOrder = async (req, res) => {
  try {
    const { earliestDate, lastDate, from, to, weight, description, receiverName, receiverPhone, termsAccepted } = req.body;
    const errors = {};

    if (!earliestDate) errors.earliestDate = "Please select the earliest delivery date";
    if (!lastDate) errors.lastDate = "Please select the last delivery date";
    if (!from) errors.from = "Please enter the origin city";
    if (!to) errors.to = "Please enter the destination city";
    if (!weight) {
   errors.weight = "Please enter the package weight";
} else if (Number(weight) > 40) {
   errors.weight = "Package weight cannot exceed 40kg";
}
    if (!receiverName) errors.receiverName = "Please Enter Reciever Name";
    if (!receiverPhone) errors.receiverPhone = "Please enter reciever phone No";
const termsAcceptedBool = termsAccepted === 'true' || termsAccepted === true;
if (!termsAcceptedBool) errors.termsAccepted = "Please agree to the Terms & Conditions";
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const imagePaths = req.files?.map(file => file.filename) || [];

    const order = new SendOrder({
      userId: req.user.id, 
      earliestDate,
      lastDate,
      from,
      to,
      weight,
      description,
      receiverName,
      receiverPhone,
      images: imagePaths,
      termsAccepted: termsAcceptedBool
    });

    await order.save();

    try {
      const user = await User.findById(req.user.id);
      if (user && user.email) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Send Order Confirmation - PakCarry",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
              <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #0ac6ae; text-align: center; margin-bottom: 20px;">Send Order Confirmation</h2>
                
                <p style="font-size: 16px; color: #333;">Hello ${user.name},</p>
                <p style="font-size: 16px; color: #333;">Your send order has been created successfully!</p>
                <p style="font-size: 16px; color: #333;">
Travelers going to your destination city will contact you, or you can also reach out to them directly.
</p>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #0ac6ae; margin-bottom: 15px;">Order Details:</h3>
                  <p><strong>Receiver:</strong> ${receiverName}</p>
                  <p><strong>Contact:</strong> ${receiverPhone}</p>
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

export const getSendOrders = async (req, res) => {
  try {
    const orders = await SendOrder.find({ userId: req.user.id, status: { $ne: "completed" } }).sort({ createdAt: -1 });
    
    // Get all completed payments for send orders
    const paidSendOrders = await Payment.find({ 
      orderType: "sendOrder", 
      status: "completed" 
    }).select('orderId');
    
    // Extract send order IDs that have been paid for
    const paidSendOrderIds = paidSendOrders.map(payment => payment.orderId.toString());
    
    // Filter out send orders that have been paid for
    const availableSendOrders = orders.filter(order => 
      !paidSendOrderIds.includes(order._id.toString())
    );
    
    res.json(availableSendOrders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
};

export const getUserSendOrders = async (req, res) => {
  try {
    const orders = await SendOrder.find({ userId: req.user.id }).sort({ createdAt: -1 });
    
    // Get all completed payments for send orders
    const paidSendOrders = await Payment.find({ 
      orderType: "sendOrder", 
      status: "completed" 
    }).select('orderId');
    
    // Extract send order IDs that have been paid for
    const paidSendOrderIds = paidSendOrders.map(payment => payment.orderId.toString());
    
    // Filter out send orders that have been paid for
    const availableSendOrders = orders.filter(order => 
      !paidSendOrderIds.includes(order._id.toString())
    );
    
    res.json(availableSendOrders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user orders", error: err.message });
  }
};

export const getAllSendOrders = async (req, res) => {
  try {
    const orders = await SendOrder.find().sort({ createdAt: -1 });
    
    // Get all completed payments for send orders
    const paidSendOrders = await Payment.find({ 
      orderType: "sendOrder", 
      status: "completed" 
    }).select('orderId');
    
    // Extract send order IDs that have been paid for
    const paidSendOrderIds = paidSendOrders.map(payment => payment.orderId.toString());
    
    // Filter out send orders that have been paid for
    const availableSendOrders = orders.filter(order => 
      !paidSendOrderIds.includes(order._id.toString())
    );
    
    res.json(availableSendOrders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching all orders", error: err.message });
  }
};
export const getSendOrderById = async (req, res) => {
  try {
    const order = await SendOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Error fetching order", error: err.message });
  }
};

export const updateSendOrder = async (req, res) => {
  try {
    const { earliestDate, lastDate, from, to, weight, description,termsAccepted } = req.body;
    const receiverName = req.body.receiverName;
    const receiverPhone = req.body.receiverPhone;

    const errors = {};

    if (!earliestDate) errors.earliestDate = "Please select the earliest delivery date";
    if (!lastDate) errors.lastDate = "Please select the last delivery date";
    if (!from) errors.from = "Please enter the origin city";
    if (!to) errors.to = "Please enter the destination city";

    if (!weight) errors.weight = "Please enter the package weight";
    else if (Number(weight) > 40) errors.weight = "Package weight cannot exceed 40kg";

    if (!receiverName) errors.receiverName = "Please Enter Receiver Name";
    if (!receiverPhone) errors.receiverPhone = "Please Enter Receiver Phone Number";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const imagePaths = req.files?.map(file => file.filename) || [];

    const updatedOrder = await SendOrder.findByIdAndUpdate(
      req.params.id,
      {
        earliestDate,
        lastDate,
        from,
        to,
        weight,
        description,
        receiverName,
        receiverPhone,
        ...(imagePaths.length > 0 && { images: imagePaths }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

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

export const deleteSendOrder = async (req, res) => {
  try {
    const deletedOrder = await SendOrder.findByIdAndDelete(req.params.id);
    if (!deletedOrder) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting order", error: err.message });
  }
};
