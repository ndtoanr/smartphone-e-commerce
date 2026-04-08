require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('MongoDB Connected');

    const orders = await Order.find({}).select('totalPrice status _id');
    console.log('--- All Orders ---');
    orders.forEach(o => {
        console.log(`Order ${o._id}: ${o.totalPrice} - Status: ${o.status}`);
    });

    const revenueAgg = await Order.aggregate([
        { $match: { status: 'Đã giao' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;
    console.log(`\nAggregated Revenue (Đã giao only): ${totalRevenue}`);

    const revenueAggNotCanceled = await Order.aggregate([
        { $match: { status: { $ne: 'Đã hủy' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenueOld = revenueAggNotCanceled.length > 0 ? revenueAggNotCanceled[0].total : 0;
    console.log(`Aggregated Revenue (Old - $ne Đã hủy): ${totalRevenueOld}`);

    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
