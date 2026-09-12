require('dotenv').config();
const express = require('express');
const connectDB = require('./config/databaseConfig');
const userRoutes = require('./Routes/userRoutes');
const kycRoutes = require('./Routes/kycRoutes');
const accountRoutes = require('./Routes/accountRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

connectDB();

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(process.env.PORT, () => {
  console.log('Server is running on port ' + process.env.PORT + '...');
});
