const axios = require('axios');
const { response } = require('express');

let cachedToken = null;
let tokenExpireAt = null

const TOKEN_REFRESH_BUFFER = 60 * 1000;// 1 minutes

//Nibss Api request
const nibssApi = async (url, options = {}) => {
    try {
        const response = await axios({
            url,
            ...options
        });

        return response.data;

    } catch (error) {
        const responseData = error.response?.data;

        const message =
            responseData?.message ||
            (typeof responseData === 'string'
                ? responseData
                : error.message) ||
            'External API request failed';

        const apiError = new Error(message);
        apiError.statusCode = error.response?.status || 500;
        apiError.data = responseData;

        throw apiError;
    }
};


const fintechLogin = async () => {

    return await nibssApi(
        `${process.env.BASE_URL}/api/auth/token`,
        {
            method: 'POST',
            headers: {
                Accept: '*/*',
                'Content-Type': 'application/json'
            },
            data: {
                'apiKey': process.env.API_KEY,
                'apiSecret': process.env.API_SECRET
            }
        }
    );
};


//Reuses the cached token until it is close to expiry, and then
//Get a valid NIBSS token.
const getNibssToken = async () => {
    //Reuse valid token
    if(
        cachedToken &&
        tokenExpireAt &&
        Date.now() < tokenExpireAt - TOKEN_REFRESH_BUFFER
    ){
        return cachedToken;
    }

    //Get a new jwt token
    const loginResponse = await fintechLogin();
    if(!loginResponse?.token){
        throw new Error('NIBSS Authentication did not return a token');
    }
    cachedToken = loginResponse.token;

    //Decode JWT token to get the ExpireIn payload
    const tokenParts = cachedToken.split('.');
    if(tokenParts.length !== 3){
        throw new Error('Invalid Nibss token');
    }

    try {
        const payload = JSON.parse( Buffer.from(tokenParts[1], 'base64url').toString('utf8'));
        if(!payload.exp){
            throw new Error('Nibss token doesn\'t contain expireIn');
        }
        tokenExpireAt = payload.exp * 1000;
    } catch (error) {
        throw new Error(' Unable to decode NIBSS token');
    }

    return cachedToken;
}

// const generateBvn = () => {
//     return math.Floor(10000000000 + math.Random() * 90000000000).toString();
// };

const insertBvn = async ({
    bvn,
    firstName,
    lastName,
    dob,
    phone
}) => {
    return await nibssApi(
        `${process.env.BASE_URL}/api/insertBvn`, 
        {
            method: 'POST',
            headers: {
                Accept: '*/*',
                'Content-Type': 'application/json'
            },
            data: {
                bvn,
                firstName,
                lastName,
                dob,
                phone
            }
        }
    );

};

const validateBvn = async (bvn) => {
    return await nibssApi(
        `${process.env.BASE_URL}/api/validateBvn`,
        {
            method: 'POST',
            headers: {
                Accept: '*/*',
                "Content-Type": 'application/json'
            },
            data: {
                bvn
            }
        }
    );
};

const createAccount = async ({
    kycID,
    dob
}) => {
    const accessToken = await getNibssToken(); 

    return await nibssApi(
        `${process.env.BASE_URL}/api/account/create`,
        {
            method: 'POST',
            headers: {
                Accept: '*/*',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            },
            data: {
                kycType: 'bvn',
                kycID,
                dob
            }
        }
    );
};

const nameEnquiry = async (to) => {
    const accessToken = await getNibssToken();

    const response = await axios(
        `${process.env.BASE_URL}/api/account/name-enquiry/${to}`,
        {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            }
        }
    );
    //for debuging
    console.log('NAME ENQUIRY RESPONSE:', response.data);
    return response.data;
};

const transferFunds = async({ from, to, amount, reference}) => {

    const accessToken = await getNibssToken();

    const response = await axios(
        `${process.env.BASE_URL}/api/transfer`,
        {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            },
            data: {
                from,
                to,
                amount,
                reference
            }
        }
    );
    //for debugging
    console.log('TRANSFER PROVIDER RESPONSE:', response.data);
    const data = response.data;

    return {
        success: data.status === 'SUCCESS',
        providerReference: data.reference,
        amount: data.amount,
        from: data.senderAccount,
        to: data.receiverAccount,
        message: data.status
    };
};


module.exports = {
    insertBvn,
    validateBvn,
    createAccount,
    transferFunds,
    nameEnquiry
}