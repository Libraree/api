import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Client } from '@libraree/uk-libraries-search';
import _ from 'underscore';
import Library from '../models/Library';

const client = new Client();
const results = _.map(client.listServices(), x => {
    return new Library(x.name, x.code);
});

export async function ListServices(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    return {
        jsonBody: results
    };
};

app.http('ListServices', {
    methods: ['GET'],
    authLevel: 'function',
    handler: ListServices
});
