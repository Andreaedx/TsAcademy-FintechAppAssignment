const axios = require('axios');

let cachedToken = null;
let tokenExpireAt = null

const TOKEN_REFRESH_BUFFER = 60 * 1000;// 1 minutes

//Nibss Api request
const nibssApi = async (url, options = {}) => {
    try{
        const Response = await axios({
            url,
            ...options
        });

        return Response.data;

    } catch (error) {
        
        // const responseData = error.response?.data;
        // const message = responseData?.message || (typeof responseData === 'string' ? responseData : error.message) || 'External API request failed';

        // const apiError = new Error(message);
        // apiError.statusCode = error.response?.status || 500;
        // apiError.data = responseData;
        
        //throw apiError;

    console.error("NIBSS request failed");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("URL:", error.config?.url);
    console.error("Method:", error.config?.method);
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);
    console.error("Headers:", error.response?.headers);


        // if (error.request && !error.response) {
        //     console.error("Request was sent but no response was received.");
        // }

        // if (error.response) {
        //     console.error("NIBSS server responded with an error.");
        // }

        if (error.response?.status === 409) {
            return error.response.data;
        }

        // console.error("=====================================");

    throw error;

    }
}

//Login to NIBSS and obtain JWT token
const fintechLogin = async () => {

    console.log('NIBSS LOGIN URL:', `${process.env.BASE_URL}/api/auth/token`);

    console.log('API KEY LOADED:', !!process.env.API_KEY);
    console.log('API SECRET LOADED:', !!process.env.API_SECRET);

    console.log('API KEY LENGTH:', process.env.API_KEY?.length);
    console.log('API SECRET LENGTH:', process.env.API_SECRET?.length);


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
    if(!payload){
        throw new Error('Nibss token doesn\'t contain expireIn');
    }

    tokenExpireAt = payload.exp * 1000;

    } catch (error) {
        throw new Error(' Unable to decode NIBSS token');
    }

    return cachedToken;
}

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
                kycType: 'BVN',
                kycID,
                dob
            }
        }
    );
};


module.exports = {
    fintechLogin,
    getNibssToken,
    insertBvn,
    validateBvn,
    createAccount
}