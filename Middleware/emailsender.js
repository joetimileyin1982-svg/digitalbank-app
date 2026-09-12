const transporter = require('../config/emailConfig.js');

const sendEmail = async (email, subject, message) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: subject,
      text: message,
    };
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendEmail };
