import GoogleService from './GoogleService';
import _ from 'underscore';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { TableClient, TableServiceClient } from '@azure/data-tables';

export default class IsbnService {
    private googleService = new GoogleService();

    convertIsbn(isbn: string): string {
        // Convert a 10-digit ISBN to 13-digit ISBN
        isbn = '978' + isbn.substring(0,9);
		let total = 0;
        let y = 3;

        for (let x = 0; x < 12; x++) {
            if ((x % 2) == 0) { 
                y = 1; 
            }
            else { 
                y = 3; 
            }

            total = total + (parseInt(isbn.charAt(x)) * y);
        }

        return `${isbn}${(10 - (total % 10)) % 10}`;
    }

    async getEditions(isbn: string): Promise<string[]> {
        const promises = [];

        promises.push(this.googleService.getEditionsByIsbn(isbn));
        promises.push(this.queryIsbnDatabase(isbn));

        const result = await Promise.all(promises);

        return _.uniq(result.flat());
    }

    private async queryIsbnDatabase(isbn: string): Promise<string[]> {
        const tableService = TableClient.fromConnectionString(process.env.AzureWebJobsStorage, 'Isbns');

        try {
            const entity = await tableService.getEntity(isbn.substring(0, 6), isbn.substring(6));
            const related = JSON.parse(entity.Related as string) as string[];
            return _.uniq(_.union([ isbn ], related)).slice(0, 10);
        }
        catch(e) {
            return [ isbn ];
        }
    }
}