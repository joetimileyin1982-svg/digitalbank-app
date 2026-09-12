const axios = require('axios');
const getValidNibssToken = require('./nibssTokenManager');

const insertBvn = async (bvn, firstName, lastName, dob, phone) => {
  try {
    const token = await getValidNibssToken();
    
    const response = await axios.post(
      `${process.env.NIBSS_BASE_URL}/api/insertBvn`,
      { bvn, firstName, lastName, dob, phone },
      { headers: { Authorization: `Bearer ${token}` } } 
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to insert BVN:', error.response?.data || error.message);
    throw error;
  }
};


const insertNin = async (nin, firstName, lastName, dob) => {
  try {
    const token = await getValidNibssToken();
    
    const response = await axios.post(
      `${process.env.NIBSS_BASE_URL}/api/insertNin`,
      { nin, firstName, lastName, dob},
      { headers: { Authorization: `Bearer ${token}` } } 
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to insert NiN:', error.response?.data || error.message);
    throw error;
  }
};

const validateBvn = async (bvn) => {
    try {
    const token = await getValidNibssToken();
    
    const response = await axios.post(
      `${process.env.NIBSS_BASE_URL}/api/validateBvn`,
      { bvn},
      { headers: { Authorization: `Bearer ${token}` } } 
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to validate BVN:', error.response?.data || error.message);
    throw error;
  }
};

const validateNin = async (nin) => {
    try {
    const token = await getValidNibssToken();
    
    const response = await axios.post(
      `${process.env.NIBSS_BASE_URL}/api/validateNin`,
      { nin},
      { headers: { Authorization: `Bearer ${token}` } } 
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to validate NIN:', error.response?.data || error.message);
    throw error;
  }
};

const createNibssAccount = async (kycType, kycID, dob) => {
    try {
    const token = await getValidNibssToken();
    
    const response = await axios.post(
      `${process.env.NIBSS_BASE_URL}/api/account/create`,
      { kycType, kycID, dob},
      { headers: { Authorization: `Bearer ${token}` } } 
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to create Nibss account:', error.response?.data || error.message);
    throw error;
  }
};

const nameEnquiry = async (accountNumber) => {
  try {
    const token = await getValidNibssToken();
    const response = await axios.get(
      `${process.env.NIBSS_BASE_URL}/api/account/name-enquiry/${accountNumber}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to perform name enquiry:', error.response?.data || error.message);
    throw error;
  }
};

const transfer = async (from, to, amount) => {
  try {
    const token = await getValidNibssToken();
    const response = await axios.post(
      `${process.env.NIBSS_BASE_URL}/api/transfer`,
      { from, to, amount },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to make transfer:', error.response?.data || error.message);
    throw error;
  }
};

const checkTransactionStatus = async (transactionId) => { 
  try { 
    const token = await getValidNibssToken(); 
    const response = await axios.get(
       `${process.env.NIBSS_BASE_URL}/api/transaction/${transactionId}`, 
       { headers: { Authorization: `Bearer ${token}`, }, }
       ); 
       return response.data; 
      } catch (error) { 
        console.error( 'Failed to check transaction status:', error.response?.data || error.message ); 
        throw error; 
      } 
    };

    const checkBalance = async (accountNumber) => {
  try {
    const token = await getValidNibssToken();
    const response = await axios.get(
      `${process.env.NIBSS_BASE_URL}/api/account/balance/${accountNumber}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to check balance', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {insertBvn, insertNin, validateBvn, validateNin, createNibssAccount, nameEnquiry, transfer, checkTransactionStatus, checkBalance};


