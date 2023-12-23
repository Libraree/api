export default class Library {
    name: string;
    code: string;
    favourite: boolean;

    constructor(name: string, code: string) {
        this.name = name;
        this.code = code;
        this.favourite = false;
    }
}