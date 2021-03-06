import 'source-map-support/register';

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import * as middy from 'middy';
import { cors } from 'middy/middlewares';

import { deleteTodo } from '../../businessLogic/todos';
import { getToken, parseUserId } from '../../auth/utils';
import { createLogger } from '../../utils/logger';

const logger = createLogger('deleteTodo');

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId;

  logger.info('Processing event: ', { event: event });

  // Get user id
  const authHeader = event.headers.Authorization;
  const jwtToken = getToken(authHeader);
  logger.info('jwtToken: ', { jwtToken: jwtToken });

  const userId = parseUserId(jwtToken);
  logger.info('userId: ', { userId: userId });

  try {
    await deleteTodo(todoId, userId);

  } catch (e) {

    return {
      statusCode: 404,
      headers: {
            "Access-Control-Allow-Origin": "*",
            'Access-Control-Allow-Credentials': true,
        },
      body: `error ${e}`
    };
  }

  return {
    statusCode: 204,
    headers: {
            "Access-Control-Allow-Origin": "*",
            'Access-Control-Allow-Credentials': true,
        },   
    body: ''
  };
});

handler.use(
  cors({
    credentials: true
  })
);
