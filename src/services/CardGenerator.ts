import JSZip from 'jszip';
import crypto from 'crypto';
import forge from 'node-forge';
import CardRequest from '../models/CardRequest';
import { TableClient } from '@azure/data-tables';
import axios from 'axios';

export default class CardGenerator {
    manifest: { [file:string] : string };
    zip: JSZip = new JSZip();

    async generatePkpass(request: CardRequest): Promise<Buffer> {
        this.manifest = {};

        if (request.discovered) {
            // Store some redacted data to allow us to smooth out the user experience in the future.
            // For example, if we know that a library service uses Telepen Numeric, we can skip the
            // scanning stage altogether and just get them to type in the number to render the barcode.
            //
            // Building this dataset will allow us to see which libraries use which barcode types, and
            // how the number printed on the library card differs to the value held in the barcode
            // symbology.
            //const tableService = createTableService(process.env.AzureWebJobsStorage);
            var tableService = TableClient.fromConnectionString(process.env.AzureWebJobsStorage, 'BarcodesAudit');

            await tableService.createEntity({
                partitionKey: request.code,
                rowKey: new Date().toISOString(),
                // The type of barcode
                Type: request.type,
                // A redacted version of the card number entered by the user.
                // For example, 12345678 would be received as 00000000.
                Entered: request.redactedEntered,
                // A redacted version of the card number read from the barcode.
                // For example, A12345678B would be received as A00000000B.
                Scanned: request.redactedScanned
            });
        }

        for(const f of request.files) {
            this.manifest[f.name] = f.checksum;
        }

        await this.getImages(request.code);

        this.zip.file('manifest.json', JSON.stringify(this.manifest));

        this.sign();

        return await this.zip.generateAsync({
            type: 'nodebuffer',
            mimeType: 'application/vnd.apple.pkpass'
        });
    }

    private async getImages(code: string) {
        const response = await axios.get(`https://libraree.blob.core.windows.net/brands/${code}.png`, {
            responseType: 'arraybuffer'
        });

        const raw = response.data as Buffer;
        const hash = this.createHash(raw);

        this.zip.file('icon.png', raw);
        this.manifest['icon.png'] = hash;
        this.zip.file('icon@2x.png', raw);
        this.manifest['icon@2x.png'] = hash;
        this.zip.file('logo.png', raw);
        this.manifest['logo.png'] = hash;
    }

    private createHash(content: crypto.BinaryLike): string {
        const shasum = crypto.createHash('sha1');
        shasum.update(content);
        return shasum.digest('hex');
    }

    private sign() {
        // Apple World Developer Intermediate Certificate
        const wwdr = `-----BEGIN CERTIFICATE-----
        MIIEIjCCAwqgAwIBAgIIAd68xDltoBAwDQYJKoZIhvcNAQEFBQAwYjELMAkGA1UE
        BhMCVVMxEzARBgNVBAoTCkFwcGxlIEluYy4xJjAkBgNVBAsTHUFwcGxlIENlcnRp
        ZmljYXRpb24gQXV0aG9yaXR5MRYwFAYDVQQDEw1BcHBsZSBSb290IENBMB4XDTEz
        MDIwNzIxNDg0N1oXDTIzMDIwNzIxNDg0N1owgZYxCzAJBgNVBAYTAlVTMRMwEQYD
        VQQKDApBcHBsZSBJbmMuMSwwKgYDVQQLDCNBcHBsZSBXb3JsZHdpZGUgRGV2ZWxv
        cGVyIFJlbGF0aW9uczFEMEIGA1UEAww7QXBwbGUgV29ybGR3aWRlIERldmVsb3Bl
        ciBSZWxhdGlvbnMgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkwggEiMA0GCSqGSIb3
        DQEBAQUAA4IBDwAwggEKAoIBAQDKOFSmy1aqyCQ5SOmM7uxfuH8mkbw0U3rOfGOA
        YXdkXqUHI7Y5/lAtFVZYcC1+xG7BSoU+L/DehBqhV8mvexj/avoVEkkVCBmsqtsq
        Mu2WY2hSFT2Miuy/axiV4AOsAX2XBWfODoWVN2rtCbauZ81RZJ/GXNG8V25nNYB2
        NqSHgW44j9grFU57Jdhav06DwY3Sk9UacbVgnJ0zTlX5ElgMhrgWDcHld0WNUEi6
        Ky3klIXh6MSdxmilsKP8Z35wugJZS3dCkTm59c3hTO/AO0iMpuUhXf1qarunFjVg
        0uat80YpyejDi+l5wGphZxWy8P3laLxiX27Pmd3vG2P+kmWrAgMBAAGjgaYwgaMw
        HQYDVR0OBBYEFIgnFwmpthhgi+zruvZHWcVSVKO3MA8GA1UdEwEB/wQFMAMBAf8w
        HwYDVR0jBBgwFoAUK9BpR5R2Cf70a40uQKb3R01/CF4wLgYDVR0fBCcwJTAjoCGg
        H4YdaHR0cDovL2NybC5hcHBsZS5jb20vcm9vdC5jcmwwDgYDVR0PAQH/BAQDAgGG
        MBAGCiqGSIb3Y2QGAgEEAgUAMA0GCSqGSIb3DQEBBQUAA4IBAQBPz+9Zviz1smwv
        j+4ThzLoBTWobot9yWkMudkXvHcs1Gfi/ZptOllc34MBvbKuKmFysa/Nw0Uwj6OD
        Dc4dR7Txk4qjdJukw5hyhzs+r0ULklS5MruQGFNrCk4QttkdUGwhgAqJTleMa1s8
        Pab93vcNIx0LSiaHP7qRkkykGRIZbVf1eliHe2iK5IaMSuviSRSqpd1VAKmuu0sw
        ruGgsbwpgOYJd+W+NKIByn/c4grmO7i77LpilfMFY0GCzQ87HUyVpNur+cmV6U/k
        TecmmYHpvPm0KdIBembhLoz2IYrF+Hjhga6/05Cdqa3zr/04GpZnMBxRpVzscYqC
        tGwPDBUf
        -----END CERTIFICATE-----`;
        
        const certificate = process.env.Certificate.replace('\\n', '\n');
        const privateKey = process.env.PrivateKey.replace('\\n', '\n');

        const cert = forge.pki.certificateFromPem(certificate);
        const pkey = forge.pki.decryptRsaPrivateKey(privateKey, process.env.Password);
        const w = forge.pki.certificateFromPem(wwdr);

        const p7 = forge.pkcs7.createSignedData();
        p7.content = forge.util.createBuffer(JSON.stringify(this.manifest), 'utf8');
        p7.addCertificate(cert);
        p7.addCertificate(w);
        p7.addSigner({
            key: pkey,
            certificate: cert,
            digestAlgorithm: forge.pki.oids.sha1,
            authenticatedAttributes: [{
                type: forge.pki.oids.contentType,
                value: forge.pki.oids.data
            }, {
                type: forge.pki.oids.messageDigest
            }, {
                type: forge.pki.oids.signingTime
            }]
        });

        p7.sign({detached: true});

        this.zip.file('signature', Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), 'binary'));
    }
}