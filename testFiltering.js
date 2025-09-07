import mongoose from 'mongoose';
import Payment from './models/payment.js';
import Order from './models/order.js';

async function testFiltering() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const paidOrders = await Payment.find({ 
      orderType: 'order', 
      status: 'completed' 
    }).select('orderId');
    
    const allOrders = await Order.find().select('_id');
    
    const paidOrderIds = paidOrders.map(payment => payment.orderId.toString());
    
    const availableOrders = allOrders.filter(order => 
      !paidOrderIds.includes(order._id.toString())
    );
    
  } catch (err) {
  } finally {
    mongoose.connection.close();
  }
}

testFiltering();
