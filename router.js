const utilities = require('./utilities');
const queryString = require("query-string");
const url = require('url');
const BookmarksController = require('./controllers/bookmarksController');
const Response = require("./response");
const TokenManager = require('./tokenManager');

// this function extract the JSON data from the body of the request
// and and pass it to controller Method
// if an error occurs it will send an error response
function processJSONBody(req, res, controller, methodName) {
    let response = new Response(res);
    let body = [];
    req.on('data', chunk => {
        body.push(chunk);
    }).on('end', () => {
        try {
            // we assume that the data is in JSON format
            if (req.headers['content-type'] === "application/json") {
                controller[methodName](JSON.parse(body));
            }
            else 
                response.unsupported();
        } catch(error){
            console.log(error);
            response.unprocessable();
        }
    });
}

exports.dispatch_TOKEN_EndPoint = function(req, res){
    let response = new Response(res);
    let url = utilities.removeQueryString(req.url);
    if (url =='/token'){
        try{
            // dynamically import the targeted controller
            // if the controller does not exist the catch section will be called
            const Controller = require('./controllers/AccountsController');
            // instanciate the controller       
            let controller =  new Controller(req, res);
            if (req.method === 'POST')
                processJSONBody(req, res, controller, 'login');
            else {
                response.notFound();
            }
            // request consumed
            return true;

        } catch(error){
            // catch likely called because of missing controller class
            // i.e. require('./' + controllerName) failed
            // but also any unhandled error...
            console.log('endpoint not found');
            console.log(error);
            response.notFound();
            // request consumed
            return true;
        }
    }
    // request not consumed
    // must be handled by another middleware
    return false;
}

// {method, ControllerName, Action}
const RouteRegister = require('./routeRegister');
exports.dispatch_Registered_EndPoint = function(req, res){
    let route = RouteRegister.find(req);
    if (route != null) {
        try{
            // dynamically import the targeted controller
            // if the controllerName does not exist the catch section will be called
            const Controller = require('./controllers/' + route.modelName + "Controller");
            // instanciate the controller       
            let controller =  new Controller(req, res);
            if (route.method === 'POST' || route.method === 'PUT')
                processJSONBody(req, res, controller, route.actionName);
            else {
                controller[route.actionName](route.id);
            }
            // request consumed
            return true;

        } catch(error){
            // catch likely called because of missing controller class
            // i.e. require('./' + controllerName) failed
            // but also any unhandled error...
            console.log('endpoint not found');
            console.log(error);
            response.notFound();
                // request consumed
                return true;
        }
    }
    // not an registered endpoint
    // request not consumed
    // must be handled by another middleware
    return false;

}

//////////////////////////////////////////////////////////////////////
// dispatch_API_EndPoint middleware
// parse the req.url that must have the following format:
// /api/{ressource name} or
// /api/{ressource name}/{id}
// then select the targeted controller
// using the http verb (req.method) and optionnal id
// call the right controller function
// warning: this function does not handle sub resource
// of like the following : api/resource/id/subresource/id?....
//
// Important note about controllers:
// You must respect pluralize convention: 
// For ressource name RessourName you have to name the controller
// RessourceNamesController that must inherit from Controller class
/////////////////////////////////////////////////////////////////////
exports.dispatch_API_EndPoint = function (req, res) {

    const Response = require("./response");
    let response = new Response(res);

    // this function extract the JSON data from the body of the request
    // and and pass it to controllerMethod
    // if an error occurs it will send an error response
    function processJSONBody(req, controller, methodName) {
        let body = [];
        req.on('data', chunk => {
            body.push(chunk);
        }).on('end', () => {
            try {
                // we assume that the data is in the JSON format
                if (req.headers['content-type'] === "application/json") {
                    controller[methodName](JSON.parse(body));
                }
                else
                    response.unsupported();
            } catch (error) {
                console.log(error);
                response.unprocessable();
            }
        });
    }

    let controllerName = '';
    let id = undefined;

    // this function check if url contain a valid API endpoint.
    // in the process, controllerName and optional id will be extracted
    function API_Endpoint_Ok(url) {
        // ignore the query string, it will be handled by the targeted controller
        let queryStringMarkerPos = url.indexOf('?');
        if (queryStringMarkerPos > -1)
            url = url.substr(0, url.indexOf('?'));
        // by convention api endpoint start with /api/...
        if (path.isAPI) {
            if (path.model != undefined) {
                // by convention controller name -> NameController
                controllerName = utilities.capitalizeFirstLetter(path.model) + 'Controller';
                // do we have an id?
                if (urlParts.length > 3) {
                    if (urlParts[3] !== '') {
                        id = parseInt(urlParts[3]);
                        if (isNaN(id)) {
                            response.badRequest();
                            // bad id
                            return false;
                        } else
                            // we have a valid id
                            return true;

                    } else
                        // it is ok to have no id
                        return true;
                } else
                    // it is ok to have no id
                    return true;
            }
        }
        // bad API endpoint
        return false;
    }

    if (req.url == "/api") {
        const endpoints = require('./endpoints');
        endpoints.list(res);
        return true;
    }
    if (API_Endpoint_Ok(req.url)) {
        // At this point we have a controllerName and an id holding a number or undefined value.
        // in the following, we will call the corresponding method of the controller class accordingly  
        // by using the Http verb of the request.
        // for the POST and PUT verb, will we have to extract the data from the body of the request
        try {
            // dynamically import the targeted controller
            // if the controllerName does not exist the catch section will be called
            const Controller = require('./controllers/' + controllerName);
            // instanciate the controller       
            let controller = new Controller(req, res);

            let string = req.url.split("bookmarks")[1];
            let param = queryString.parse(string);

            var queryObject = url.parse(req.url, true).query;
            var nbParam = Object.keys(queryObject).length;

            console.log(param.category)

            // to do : find methods that contain the http verb
            if (nbParam <= 3) {
                if (req.method === 'GET') {
                    if (nbParam >= 1) {
                        if (param.sort != "" && param.sort != undefined) {
                            let sortValue = param.sort.replace('"', '').replace('"', '');
                            controller.getBookmarksByAscendingOrder(sortValue);
                        }
                        else if (param.name != "" && param.name != undefined) {
                            let name = param.name.replace('"', '').replace('"', '');
                            if (param.name.includes("*")) {
                                let newName = name.replace('*', '')
                                controller.getBookmarkByNameLike(newName)
                            } else {
                                controller.getBookmarkByName(name)
                            }
                        }
                        else if (param.category != "" && param.category != undefined) {
                            let cat = param.category.replace('"', '').replace('"', '');
                            controller.getBookmarkByCategory(cat)
                        }
                    }
                    else if (nbParam == 0) {
                        if (string.includes("/")) {
                            controller.getBookmarkById(id)
                        }
                        else if (req.url.split("bookmarks")[1] == "?") {
                            controller.getAllOption();
                        }
                        else {
                            controller.getAll();
                        }
                    }

                    // request consumed
                    return true;

                }
                if (req.method === 'POST') {
                    processJSONBody(req, controller, "post");
                    // request consumed
                    return true;

                }
                if (req.method === 'PUT') {
                    processJSONBody(req, controller, "put");
                    // request consumed
                    return true;

                }
                if (req.method === 'PATCH') {
                    processJSONBody(req, controller, "patch");
                    // request consumed
                    return true;
                }
                if (req.method === 'DELETE') {
                    if (!isNaN(id))
                        controller.remove(id);
                    else
                        response.badRequest();
                    // request consumed
                    return true;
                }
            }
        } catch (error) {
            // catch likely called because of missing controller class
            // i.e. require('./' + controllerName) failed
            // but also any unhandled error...
            console.log('endpoint not found');
            console.log(error);
            response.notFound();
            // request consumed
            return true;
        }
    }
    // not an API endpoint
    // request not consumed
    // must be handled by another middleware
    return false;
}