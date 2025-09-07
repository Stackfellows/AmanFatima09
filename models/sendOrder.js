import mongoose from "mongoose";

const sendOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  earliestDate: {
    type: String,
    required: [true, "Please select the earliest delivery date"],
    validate: {
      validator: function (value) {
        const selected = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selected >= today;
      },
      message: "Date cannot be in the past"
    }
  },
lastDate: {
    type: String,
    required: [true, "Please select the last delivery date"],
    validate: {
      validator: function (value) {
        if (!this.earliestDate || !value) return true;

        const earliest = new Date(this.earliestDate);
        const last = new Date(value);
        return last >= earliest;
      },
      message: "Last date must be equal to or after earliest date"
    }
  },
  from: {
    type: String,
    required: [true, "Please enter the origin city"]
  },
  to: {
    type: String,
    required: [true, "Please enter the destination city"]
  },
 weight: {
    type: Number,
    required: [true, "Please enter the package weight i.e max 40kg"],
    max: [40, "Package weight cannot exceed 40kg"] 
  },
  description: {
    type: String
  },
  receiverName: {
    type: String,
    required: [true, "Please Enter Receiver Name"],
     validate: {
    validator: function(value) {
      return /^[A-Za-z\s]+$/.test(value);
    },
    message: "Receiver name must only contain letters"
  }
  },
receiverPhone: {
  type: String,
  required: [true, "Please Enter Receiver Phone"],
  validate: {
    validator: function (value) {
      return /^\+92[0-9]{10}$/.test(value);
    },
    message: "Please Enter Valid Phone Number,Must Start with +92 (e.g., +923001234567)"
  }
},
termsAccepted: {
  type: Boolean,
  required: [true, "Please agree to the Terms & Conditions"]
},
  images: [String],
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed"],
    default: "pending"
  }
}, 
{ timestamps: true });

export default mongoose.model("SendOrder", sendOrderSchema);
