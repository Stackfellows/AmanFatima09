import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Test email configuration
const testEmail = async () => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("Testing email configuration...");
    console.log("Email user:", process.env.EMAIL_USER);
    
    // Verify connection configuration
    transporter.verify((error) => {
      if (error) {
        console.error("Email connection failed:", error);
      } else {
        console.log("Email server is ready to send messages");
      }
    });

    // Test sending an email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "test@example.com", // Replace with actual test email
      subject: "Test Email from PakCarry",
      text: "This is a test email to verify email configuration is working.",
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Test email sent successfully!");
    console.log("Message ID:", result.messageId);
    
  } catch (error) {
    console.error("Error sending test email:", error);
    console.error("Error details:", error.response || error.message);
  }
};

testEmail();
