import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { plainToClass } from 'class-transformer';
import CardRequest from '../models/CardRequest';
import Generator from '../services/CardGenerator';

export async function GenerateCard(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Get body, generate zip with signature, return.
    const req = plainToClass(CardRequest, request.body);
    const service = new Generator();

    return {
        // status: 200, /* Defaults to 200 */
        body: await service.generatePkpass(req),
        headers: {
            'Content-Type': 'application/vnd.apple.pkpass'
        }
    };
};

app.http('GenerateCard', {
    methods: ['GET'],
    authLevel: 'function',
    handler: GenerateCard
});
