import GoogleResult from '../models/GoogleResult';
import axios from 'axios';
import _ from 'underscore';

export default class GoogleService {
    async getTitles(filter: string): Promise<GoogleResult[]> {
        const response = await axios.get(this.appendKeyToUrl(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(this.getIsbn(filter))}`));
        const items = response.data.items;

        return _.chain(items)
            .filter(x => x.volumeInfo.industryIdentifiers)
            .map(x => {
                return new GoogleResult(
                    x.id,
                    x.volumeInfo.title,
                    x.volumeInfo.subtitle,
                    x.volumeInfo.authors,
                    x.volumeInfo.publishedDate,
                    x.volumeInfo.imageLinks?.smallThumbnail?.replace('http://books.google.com', 'https://books.google.com'),
                    x.volumeInfo.imageLinks?.thumbnail?.replace('http://books.google.com', 'https://books.google.com'),
                    x.volumeInfo.industryIdentifiers.find(y => y.type == 'ISBN_13')?.identifier
                );
            })
            .value();
    }

    private getIsbn(filter: string): string {
        const cleaned = filter.replace(/[\s-]/g, '');

        if (/^9[0-9]{12}$/.test(cleaned))
            return `isbn:${cleaned}`;

        return filter;
    }

    async getEditionsByVolumeId(volumeId: string): Promise<string[]> {
        const response = await axios.get(`https://www.google.co.uk/books/edition/_/${encodeURIComponent(volumeId)}?hl=en&gbpv=0&kptab=editions`, 
        {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
            }
        });
        const html = response.data;

        // E.g. https://www.google.co.uk/books/edition/_/HD4dDAAAQBAJ?hl=en&sa=X&ved=2ahUKEwjj96mM6830AhVkQvEDHTcPDuMQ8fIDegQIAxAr
        const regexp = /\/books\/edition\/_\/([^?%]+)/g;

        const results = [...html.matchAll(regexp)];
        const ids = _.uniq(_.map(results, x => x[1]));
        const promises = [];

        for(const id of ids) {
            // Look up the ISBN-13 number for the volume
            promises.push(this.getIsbnForVolume(id));
        }

        const volumeResults = await Promise.all(promises);
        const flattened = _.uniq(_.filter(volumeResults, x => x != '').flat());   

        // Limit to publications from English-speaking countries - i.e. ISBNs which begin 9780 or 9781.
        // NB: this doesn't prevent Welsh publications from appearing, as these are also published under
        // these ISBN prefixes. This is mainly to stop us spending time searching for French editions
        // in UK libraries, for example!
        return _.filter(flattened, x => x.indexOf('9780') == 0 || x.indexOf('9781') == 0);
    }

    async getEditionsByIsbn(isbn: string): Promise<string[]> {
        const search = await this.getTitles(isbn);

        if (!search || search.length == 0) {
            return [];
        }

        return await this.getEditionsByVolumeId(search[0].id);
    }

    async getIsbnForVolume(volumeId: string): Promise<string[]> {
        try {
            const response = await axios.get(this.appendKeyToUrl(`https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(volumeId)}`));
            const items = _.filter(response.data.volumeInfo.industryIdentifiers, x => x.type == 'ISBN_13');
        
            return _.map(items, x => x.identifier) ?? [''];
        }
        catch(e) {
            return [''];
        }
    }

    private appendKeyToUrl(url: string): string {
        const key = process.env['GoogleApiKey'];

        if (!key) return url;

        return url.indexOf('?') > -1 ? `${url}&key=${key}` : `${url}?key=${key}`;
    }
}