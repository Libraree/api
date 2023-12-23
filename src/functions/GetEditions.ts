import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import GoogleService from '../services/GoogleService';
import IsbnService from '../services/IsbnService';

const service = new IsbnService();
const google = new GoogleService();

export async function GetEditions(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const isbn = request.query.get('isbn');
    const volumeId = request.query.get('volumeId');

    const result = isbn ? await service.getEditions(isbn) : await google.getEditionsByVolumeId(volumeId);

    return {
        jsonBody: result
    };
};

app.http('GetEditions', {
    methods: ['GET'],
    authLevel: 'function',
    handler: GetEditions
});
