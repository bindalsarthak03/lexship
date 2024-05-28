require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

exports.createLeadController = async (req, res) => {
  try {
    const customerId = req.params.Customer_id;
    if (!customerId) {
      return res.status(400).json({ error: 'Customer_id is required' });
    }
    const customerDetailsResponse = await axios.get(`${process.env.CUSTOMER_DETAIL_API}?Customer_Id=${customerId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    const customerDetails = customerDetailsResponse.data[0]
    const leadData = {
      data: [
        {
          Cust_ID: customerDetails.id,
          First_Name: customerDetails.name,
          Company: customerDetails.company_name,
          Last_Name: customerDetails.last_name,
          Email: customerDetails.email,
          Phone: customerDetails.mobile,
          Type_of_business: customerDetails.type_of_business
        }]
    }
    // Send data to Zoho CRM API
    const zohoResponse = await axios.post(process.env.ZOHO_LEAD_API, leadData, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${process.env.ZOHO_OAUTH_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    const zohoResponseData = zohoResponse.data;

    if (zohoResponseData.data && zohoResponseData.data.length > 0) {
      const leadId = zohoResponseData.data[0].details.id;

      // Define the path to the file
      const filePath = path.join(__dirname, '../leadsInfo', 'leadDetails.txt');
      console.log(filePath)
      // Append the lead ID to the file
      fs.appendFileSync(filePath, `${leadId}\n`, 'utf8');
    }

    // Respond with the Zoho CRM API response
    res.status(zohoResponse.status).json(zohoResponse.data);
  } catch (error) {
    console.error('Error creating lead:', error.response ? error.response.data : error.message);
    res.status(error.response ? error.response.status : 500).json({
      error: 'An error occurred while creating the lead',
      details: error.response ? error.response.data : error.message
    });
  }
};