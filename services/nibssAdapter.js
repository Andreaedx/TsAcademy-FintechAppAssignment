const axios = require('axios');
const { response } = require('express');
const { ModifiedPathsSnapshot } = require('mongoose');

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

    const response = await nibssApi(
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
    )

    return response;
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
    const response = await nibssApi(
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
    )
    return response;
};

const validateBvn = async (bvn) => {
    const response = await nibssApi(
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
    )
    return response;
};

const InsertNin = async ({
    nin,
    firstName,
    lastName,
    dob
}) => {

    const response = await nibssApi(
        `${process.env.BASE_URL}/api/insertNin`,
        {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json'
            },
            data: {
                nin,
                firstName,
                lastName,
                dob
            }
        }
    )
    return response;
}

const createAccount = async ({
    kycID,
    dob
}) => {
    const accessToken = await getNibssToken(); 

    const response = await nibssApi(
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

    return response;
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

    return response.data;
};

const transferFunds = async({ from, to, amount }) => {

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
            }
        }
    );

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

const getTrxFromNibss = async (reference) => {
    const accessToken = await getNibssToken();
    
    const response = await nibssApi(
        `${process.env.BASE_URL}/api/transaction/${reference}`,
        {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            }
        }
    )  
    return response;
}

const getBalanceFromNibss = async (accountNumber) => {
    const accessToken = await getNibssToken();

    const response = await nibssApi(
        `${process.env.BASE_URL}/api/account/balance/${accountNumber}`,
        {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            }
        }
    )
    return response;
};

const getAccountsFromNibss = async () => {
    const accessToken = await getNibssToken();

    const response = await nibssApi(
        `${process.env.BASE_URL}/api/accounts`,
        {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            },
        }
    )
    return response;
}

module.exports = {
    insertBvn,
    validateBvn,
    createAccount,
    transferFunds,
    nameEnquiry,
    getTrxFromNibss,
    getBalanceFromNibss,
    getAccountsFromNibss
}