import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Client } from '@libraree/uk-libraries-search';

const client = new Client();

export async function SearchLibrary(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const results = await client.searchBooks(request.query.get('service'), [ request.query.get('isbn') ]);

    return {
        jsonBody: results
    };
};

app.http('SearchLibrary', {
    methods: ['GET'],
    authLevel: 'function',
    handler: SearchLibrary
});
