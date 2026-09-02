const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./Config/databaseConfig');
const userRoute = require('./Routes/UserRoute')

const app = express();
app.use(express.json());

dotenv.config();

connectDB();

app.use('/user', userRoute);

app.listen(process.env.PORT, () => {
    console.log(`server is running in port: ${process.env.PORT}`);
});
