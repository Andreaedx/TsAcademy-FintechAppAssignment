const express = require('express');
const app = express();

const dotenv = require('dotenv').config();

const connectDB = require('./Config/databaseConfig');
const userRoute = require('./Routes/UserRoute');
const transferRoute = require('./Routes/transferRoute');
const adminRoute = require('./Routes/adminRoute');

app.use(express.json());

connectDB();

app.use('/user', userRoute);
app.use('/transfer', transferRoute);
app.use('/admin', adminRoute);

app.listen(process.env.PORT, () => {
    console.log(`server is running in port: ${process.env.PORT}`);
});
