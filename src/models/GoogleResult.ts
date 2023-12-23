export default class GoogleResult {
    id: string;
    title: string;
    subtitle: string;
    authors: string[];
    published: string;
    smallThumbnail: string;
    thumbnail: string;
    isbn: string;

    constructor(
        id: string,
        title: string,
        subtitle: string,
        authors: string[],
        published: string,
        smallThumbnail: string,
        thumbnail: string,
        isbn: string
    ) {
        this.id = id;
        this.title = title;
        this.subtitle = subtitle;
        this.authors = authors;
        this.published = published;
        this.smallThumbnail = smallThumbnail;
        this.thumbnail = thumbnail;
        this.isbn = isbn;
    }

    get url(): string {
        return `https://www.google.co.uk/books/edition/_/${encodeURIComponent(this.id)}`;
    }
}