const { GoogleAuthService: Service } = require('../../services')
const { google } = require('googleapis');
const { CustomError, ResponseHandler, CryptingTool } = require('../../utils');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, FRONTEND_URL } = require('../../config/env');

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL
);

const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
];

class GoogleAuthModule {
    static async redirectConsent(req, res, next) {
        try {
            const authorizationUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: scopes,
                include_granted_scopes: true,
            });

            return res.redirect(authorizationUrl);
        } catch (error) {
            return next(error);
        }
    }

    static async callbackAuth(req, res, next) {
        try {
            const { code, error: oauthError } = req.query;
            
            // Handle OAuth errors
            if (oauthError) {
                return res.redirect(`${FRONTEND_URL}/auth/login?error=oauth_cancelled`);
            }

            if (!code) {
                return res.redirect(`${FRONTEND_URL}/auth/login?error=no_code`);
            }

            const { tokens } = await oauth2Client.getToken(code.toString());

            oauth2Client.setCredentials(tokens);
            const oauth2 = google.oauth2({
                auth: oauth2Client,
                version: 'v2',
            });
            
            const { data } = await oauth2.userinfo.get();
            
            if (!data.email || !data.name) {
                return res.redirect(`${FRONTEND_URL}/auth/login?error=invalid_google_account`);
            }
   
            const resultCheck = await Service.provideCheckUserV2(data, req.ip);

            // Encrypt and encode the result data for URL
            let redirectUrl;
            if (resultCheck.data && resultCheck.data.token) {
                const authData = {
                    success: true,
                    message: resultCheck.message,
                    data: {
                        token: resultCheck.data.token,
                        user_id: resultCheck.data.user_id,
                        name: resultCheck.data.name,
                        group_id: resultCheck.data.group_id,
                        group_name: resultCheck.data.group_name,
                        menu_list: resultCheck.data.menu_list,
                        division: resultCheck.data.division,
                        ...(resultCheck.data.user_forgot_password && { 
                            user_forgot_password: 'true' 
                        })
                    }
                };
                const encryptedData = CryptingTool.encrypt(JSON.stringify(authData));
                redirectUrl = `${FRONTEND_URL}/auth/google-callback?data=${encodeURIComponent(encryptedData)}`;
            } else {
                redirectUrl = `${FRONTEND_URL}/auth/google-callback?error=auth_failed&message=${encodeURIComponent(resultCheck.message || 'Authentication failed')}`;
            }

            return res.redirect(redirectUrl);
            
        } catch (error) {
            console.error('Google OAuth callback error:', error);
            return res.redirect(`${FRONTEND_URL}/auth/login?error=oauth_error`);
        }
    }

    static async getAuthResult(req, res, next) {
        try {
            // Manual query string parsing as fallback
            let encryptedData, error, message;
            
            if (Object.keys(req.query).length === 0 && req.url.includes('?')) {
                // Manual parsing if req.query is empty
                const urlParts = req.url.split('?');
                if (urlParts.length > 1) {
                    const queryString = urlParts[1];
                    const params = new URLSearchParams(queryString);
                    encryptedData = params.get('data');
                    error = params.get('error');
                    message = params.get('message');
                }
            } else {
                // Normal destructuring
                encryptedData = req.query.data;
                error = req.query.error;
                message = req.query.message;
            }
            
            // Debug logging
            console.log('Full URL:', req.url);
            console.log('Query parameters:', req.query);
            console.log('Encrypted data:', encryptedData);
            console.log('Error:', error);
            console.log('Message:', message);
            
            if (error) {
                return ResponseHandler.error(req, res, message || 'Authentication failed', {}, 400);
            }

            if (!encryptedData) {
                console.log('No auth data found in URL parameters', encryptedData);
                return
            }

            try {
                const decryptedData = CryptingTool.decrypt(decodeURIComponent(encryptedData));
		
                const oauthResult = JSON.parse(decryptedData);
		        console.log('data decrypt',oauthResult)
                if (oauthResult.success) {
                    return ResponseHandler.success(req, res, oauthResult.message, oauthResult.data, 200);
                } else {
                    return ResponseHandler.error(req, res, oauthResult.message, oauthResult.data, 400);
                }
            } catch (decryptError) {
                console.error('Failed to decrypt auth data:', decryptError);
                return ResponseHandler.error(req, res, 'Invalid authentication data', {}, 400);
            }
            
        } catch (error) {
            return next(error);
        }
    }

    static async register(req, res, next) {
        try {
            const { bodyRequest } = req;
            const resultCheck = await Service.provideRegisterUser(bodyRequest, req.ip);
            return ResponseHandler.success(req, res, resultCheck.message, resultCheck.data, 200);
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = GoogleAuthModule;