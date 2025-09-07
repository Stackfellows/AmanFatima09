import Payment from "../models/payment.js";
import SendOrder from "../models/sendOrder.js";
import Order from "../models/order.js";
import TripModel from "../models/newTrip.js";
import User from "../models/userModel.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const createPayment = async (req, res) => {
  try {
    const { orderType, orderId, method, transactionId, amount } = req.body;

    if (!orderType || !orderId || !method || !transactionId || !amount) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required",
        errors: {
          orderType: !orderType ? "Order type is required" : undefined,
          orderId: !orderId ? "Order ID is required" : undefined,
          method: !method ? "Payment method is required" : undefined,
          transactionId: !transactionId ? "Transaction ID is required" : undefined,
          amount: !amount ? "Amount is required" : undefined
        }
      });
    }

    if (!["sendOrder", "order", "trip"].includes(orderType)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid order type",
        errors: {
          orderType: "Order type must be one of: 'sendOrder', 'order'"
        }
      });
    }

    if (!["easypaisa", "bank", "jazzcash", "paypal", "google"].includes(method)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid payment method",
        errors: {
          method: "Payment method must be one of: easypaisa, bank, jazzcash, paypal, google"
        }
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid amount",
        errors: {
          amount: "Amount must be a positive number"
        }
      });
    }

    let order;
    if (orderType === "sendOrder") {
      order = await SendOrder.findById(orderId);
    } else if (orderType === "order") {
      order = await Order.findById(orderId);
    } else if (orderType === "trip") {
      order = await TripModel.findById(orderId);
    }

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found",
        errors: {
          orderId: "Order ID does not exist in the system"
        }
      });
    }

    if (transactionId.trim().length < 5) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid transaction ID",
        errors: {
          transactionId: "Transaction ID must be at least 5 characters long"
        }
      });
    }
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "Payment screenshot is required",
        errors: {
          screenshot: "Please upload a payment screenshot"
        }
      });
    }

    const payment = new Payment({
      orderType,
      orderId,
      method,
      transactionId: transactionId.trim(),
      amount,
      screenshot: req.file.filename,
      status: "pending",
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      payment,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error creating payment",
      error: error.message 
    });
  }
};

export const getPaymentsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payments = await Payment.find({ orderId });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payments", error });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate({
        path: 'orderId',
        select: 'price status userId',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 });

    // Add user information to each payment
    const paymentsWithUserInfo = await Promise.all(payments.map(async (payment) => {
      let user = null;
      if (payment.orderId && payment.orderId.userId) {
        user = await User.findById(payment.orderId.userId).select('name email');
      }
      
      return {
        ...payment.toObject(),
        user: user ? { _id: user._id, name: user.name, email: user.email } : null
      };
    }));

    res.status(200).json({
      success: true,
      count: paymentsWithUserInfo.length,
      payments: paymentsWithUserInfo
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching payments",
      error: error.message 
    });
  }
};

const sendPaymentNotificationEmail = async (payment, status) => {
  try {
    // Create transporter inside the function to ensure environment variables are loaded
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let order;
    let user;
    
    if (payment.orderType === "sendOrder") {
      order = await SendOrder.findById(payment.orderId);
    } else if (payment.orderType === "order") {
      order = await Order.findById(payment.orderId);
    } else if (payment.orderType === "trip") {
      order = await TripModel.findById(payment.orderId);
    }

    if (!order) {
      return;
    }

    user = await User.findById(order.userId);
    if (!user || !user.email) {
      return;
    }

    const subject = status === "completed" 
      ? "Payment Verified - PakCarry" 
      : "Payment Rejected - PakCarry";

    const statusMessage = status === "completed" 
      ? "Your payment has been successfully verified by our team."
      : "Your payment has been rejected by our team. Please contact support for assistance.";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #0ac6ae; text-align: center; margin-bottom: 20px;">${subject}</h2>
            
            <p style="font-size: 16px; color: #333;">Hello ${user.name},</p>
            <p style="font-size: 16px; color: #333;">${statusMessage}</p>
             <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0ac6ae; margin-bottom: 15px;">Payment Details:</h3>
              <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
              <p><strong>Payment Method:</strong> ${payment.method}</p>
              <p><strong>Amount:</strong> Rs. ${payment.amount}</p>
              <p><strong>Status:</strong> ${status === "completed" ? "Verified" : "Rejected"}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            ${status === "rejected" ? `
            <div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #856404; font-size: 14px; margin: 0; text-align: center;">
                <strong>Important:</strong> If you believe this is an error, please contact our support team immediately.
              </p>
            </div>
            ` : ''}
            
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

    const result = await transporter.sendMail(mailOptions);
    console.log("Payment notification email sent successfully:", {
      paymentId: payment._id,
      status: status,
      email: user.email,
      messageId: result.messageId
    });
  } catch (emailError) {
    console.error("Error sending payment notification email:", emailError.message);
    console.error("Email error details:", {
      paymentId: payment._id,
      status: status,
      error: emailError.response || emailError.message
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "completed", "failed"].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid status",
        errors: {
          status: "Status must be one of: pending, completed, failed"
        }
      });
    }

    const payment = await Payment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (status === "completed") {
        // Delete the specific order associated with the payment
        if (payment.orderType === "sendOrder") {
            await SendOrder.findByIdAndDelete(payment.orderId);
        } else if (payment.orderType === "order") {
            await Order.findByIdAndDelete(payment.orderId);
        } else if (payment.orderType === "trip") {
            // Do not delete trips; keep them in the database
        }
    }
    if (status === "completed" || status === "failed") {
      await sendPaymentNotificationEmail(payment, status);
    }

    res.json({ 
      success: true,
      message: `Payment ${status} successfully`, 
      payment 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error updating payment", 
      error: error.message 
    });
  }
};

export const deletePayment = async (req, res) => {
  const { id } = req.params;
  try {
    const payment = await Payment.findByIdAndDelete(id);
    if (!payment) {
      return res.status(404).json({ msg: "Payment not found" });
    }
    res.status(200).json({ msg: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error while deleting payment." });
  }
};
