module.exports = 
class Bookmark{
    constructor(name, url, category)
    {
        this.Id = 0;
        this.Name = name !== undefined ? name : "";
        this.URL = url !== undefined ? url : "";
        this.Category = category !== undefined ? category : "";
    }
}