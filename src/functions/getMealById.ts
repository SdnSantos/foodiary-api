import { APIGatewayProxyEventV2 } from 'aws-lambda';

import { parseResponse } from '../utils/parseResponse';
import { parseProtectedEvent } from '../utils/parseProtectedEvent';
import { unathorized } from '../utils/http';
import { GetMealByIdController } from '../Controllers/GetMealByIdController';

export async function handler(event: APIGatewayProxyEventV2) {
  try {
    const request = parseProtectedEvent(event);
    const response = await GetMealByIdController.handle(request);

    return parseResponse(response);
  } catch (error) {
    return parseResponse(unathorized({ error: 'Invalid access token.' }));
  }
}
