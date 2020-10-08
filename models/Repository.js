
const { timeStamp } = require('console');
const fs = require('fs');
const { list } = require('../endpoints');
///////////////////////////////////////////////////////////////////////////
// This class provide CRUD operations on JSON objects collection text file 
// with the assumption that each object have an Id member.
// If the objectsFile does not exist it will be created on demand.
// Warning: no type and data validation is provided
///////////////////////////////////////////////////////////////////////////
module.exports = 
class Repository {
    constructor(objectsName) {
        objectsName = objectsName.toLowerCase();
        this.objectsList = [];
        this.objectsFile = `./data/${objectsName}.json`;
        this.read();
    }
    read() {
        try{
            // Here we use the synchronus version readFile in order  
            // to avoid concurrency problems
            let rawdata = fs.readFileSync(this.objectsFile);
            // we assume here that the json data is formatted correctly
            this.objectsList = JSON.parse(rawdata);
        } catch(error) {
            if (error.code === 'ENOENT') {
                // file does not exist, it will be created on demand
                this.objectsList = [];
            }
        }
    }
    write() {
        // Here we use the synchronus version writeFile in order
        // to avoid concurrency problems  
        fs.writeFileSync(this.objectsFile, JSON.stringify(this.objectsList));
        this.read();
    }
    nextId() {
        let maxId = 0;
        for(let object of this.objectsList){
            if (object.Id > maxId) {
                maxId = object.Id;
            }
        }
        return maxId + 1;
    }
    add(object) {
        try {
            object.Id = this.nextId();
            this.objectsList.push(object);
            this.write();
            return object;
        } catch(error) {
            return null;
        }
    }
    getAll() {
        return this.objectsList;
    }
    getAllOption(){
        return JSON.stringify(" les services disponible sont : localhost:5000/api/bookmarks? + " +
        "sort=name, sort=category, /id, name=nomBookmark, name=préfixeNom* ou category=bookmarksAvecCetteCat ");
    }
    getByAscendingOrder(sortValue) {
        if(sortValue == "name")
            return this.objectsList.sort((a, b) => (a.Name > b.Name) ? 1 : -1);
        else if(sortValue == "category")
            return this.objectsList.sort((a, b) => ( a.Category > b.Category) ? 1 : -1);
        else
            return null;
    }
    getById(id){
        for(let object of this.objectsList){
            if (object.Id === id) {
               return object;
            }
        }
        return null;
    }
    getByName(name){
        for(let object of this.objectsList){
            if (object.Name === name) {
               return object;
            }
        }
        return null;
    }
    getByNameLike(Name) {
        let listNameLike = [];
        for(let object of this.objectsList){
            let valNom = object.Name;
            if (valNom.includes(Name)) {
               listNameLike.push(object);
            }
        }
        return listNameLike;
    }
    getByCategory(Category){
        let listCategory = [];
        for(let object of this.objectsList){
            if (object.Category == Category) {
               listCategory.push(object);
            }
        }
        return listCategory;
    }
    remove(id) {
        let index = 0;
        for(let object of this.objectsList){
            if (object.Id === id) {
                this.objectsList.splice(index,1);
                this.write();
                return true;
            }
            index ++;
        }
        return false;
    }
    update(objectToModify) {
        let index = 0;
        console.log(objectToModify)
        for(let object of this.objectsList){
            if (object.Id === objectToModify.Id) {
                this.objectsList[index] = objectToModify;
                this.write();
                return true;
            }
            index ++;
        }
        return false;
    } 
    findByField(fieldName, value){
        let index = 0;
        for(let object of this.objectsList){
            try {
                if (object[fieldName] === value) {
                    return this.objectsList[index];
                }
                index ++;
            } catch(error) {
                break;
            }
        }
        return null;
    }
}