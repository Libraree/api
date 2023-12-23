import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import GoogleService from '../services/GoogleService';

const service = new GoogleService();

export async function FindTitles(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // filter querystring parameter might be the book name, e.g. Stasiland.
    const filter = request.query.get('filter');
    const result = await service.getTitles(filter);

    return {
        jsonBody: result
    };
};

app.http('FindTitles', {
    methods: ['GET'],
    authLevel: 'function',
    handler: FindTitles
});
