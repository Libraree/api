import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import axios from 'axios';
import { PDFDocument } from 'pdf-lib';
import BwipJs from 'bwip-js';

export async function GenerateCardsPoster(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    if (!request.query.has('code')) {
        return {
            status: 400,
            body: '<html><head><title>No library code</title></head><body><h1>No library code provided!</h1></body></html>',
            headers: {
                'Content-Type': 'text/html'
            }
        };
    }

    const response = await axios.get('https://librareecards.blob.core.windows.net/etc/Poster.pdf', {
        responseType: 'arraybuffer'
    });
    const posterBytes = response.data as ArrayBuffer;

    const qrBytes = await BwipJs.toBuffer({ 
        bcid: 'qrcode', 
        text:`https://cards.libraree.org#${request.query.get('code')}`,
        includetext: false,
        scale: 5
    });

    const pdfDoc = await PDFDocument.load(posterBytes);

    const qr = await pdfDoc.embedPng(qrBytes);

    const page = pdfDoc.getPage(0);

    page.drawImage(qr, {
        x: page.getWidth() / 4,
        y: 240,
        width: page.getWidth() - (page.getWidth() / 2),
        height: page.getWidth() - (page.getWidth() / 2)
      });

    const finalBytes = await pdfDoc.save();

    return {
        body: finalBytes,
        headers: {
            'Content-Type': 'application/pdf'
        }
    };
};

app.http('GenerateCardsPoster', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: GenerateCardsPoster
});
