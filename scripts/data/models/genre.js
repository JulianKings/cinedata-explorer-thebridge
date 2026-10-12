export default class Genre {
    constructor({ id, name }) {
        this.id = id;
        this.name = name;
    }

    static fromResponse(response) {
        return new Genre({
            id: response.id,
            name: response.name,
        });
    }
}