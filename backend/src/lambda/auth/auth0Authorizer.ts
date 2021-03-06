import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda';
import 'source-map-support/register';

import { verify, decode } from 'jsonwebtoken';
import { createLogger } from '../../utils/logger';
import { getToken } from '../../auth/utils';
import Axios from 'axios'  
import { Jwt } from '../../auth/Jwt';
import { JwtPayload } from '../../auth/JwtPayload';


const logger = createLogger('auth')
const jwkToPem = require('jwk-to-pem');
const jwksUrl = 'https://dev--on20g8p.us.auth0.com/.well-known/jwks.json'


export const handler = async (
    event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
    logger.info('Authorizing a user', event.authorizationToken)
    try {
        const jwtToken = await verifyToken(event.authorizationToken)
        logger.info('User was authorized', jwtToken)

        return {
            principalId: jwtToken.sub,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: '*'
                    }
                ]
            }
        }
    } catch (e) {
        logger.error('User not authorized', { error: e.message })

        return {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Deny',
                        Resource: '*'
                    }
                ]
            }
        }
    }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
    if (!authHeader)
        throw new Error('No authentication header')

    if (!authHeader.toLowerCase().startsWith('bearer '))
        throw new Error('Invalid authentication header')

    const token = getToken(authHeader)
    const jwt: Jwt = decode(token, { complete: true }) as Jwt
    // Done: Implement token verification
    const response = await Axios(jwksUrl);
    const responseData = response.data;
    const signingKey = responseData['keys'].find(key => key['kid'] === jwt['header']['kid']);
    if (!signingKey) {
        throw new Error('Invalid Signing key');
    }
    return verify(token, jwkToPem(signingKey), {algorithms: ['RS256']}) as JwtPayload;
}
