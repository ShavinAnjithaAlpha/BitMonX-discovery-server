/**
 * MIT License
 *
 * Copyright (c) 2024 Shavin Anjitha Chandrawansha
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * RouteMap class to handle the route handlers for different HTTP methods
 * @class
 * @classdesc RouteMap class to handle the route handlers for different HTTP methods
 * @param {string}
 * @returns {RouteMap} - A new RouteMap object
 * @example
 * const RouteMap = require('./route_map');
 * const routeMap = new RouteMap();
 * routeMap.add('/service')
 * .addGET((req, res) => {
 * res.end('GET /service');
 * });
 */
class RouteMap {
  constructor(prefix = '/bitmonx') {
    this.prefix = prefix;
    this._routes = {};
    this._paramsIncludedRoutes = {};
  }

  add(route, paramsIncluded = false) {
    if (paramsIncluded) {
      if (this._paramsIncludedRoutes[route] === undefined) {
        this._paramsIncludedRoutes[route] = new RouteHandler(route);
      }

      return this._paramsIncludedRoutes[route];
    } else {
      if (this._routes[route] === undefined) {
        this._routes[route] = new RouteHandler(route);
      }
      return this._routes[route];
    }
  }

  get(route) {
    let _route = route;
    if (route.startsWith(this.prefix)) {
      _route = route.substring(this.prefix.length);
    }

    let routeHandler = this._routes[_route];
    if (routeHandler) {
      return routeHandler;
    }

    // match the path parameters in the route
    // split the path and the route into
    for (const key in this._paramsIncludedRoutes) {
      let path = key.split('/');
      let route = _route.split('/');

      if (path.length !== route.length) {
        continue;
      }

      let isMatch = true;
      let params = {};
      for (let i = 0; i < path.length; i++) {
        if (path[i] === route[i]) {
          continue;
        }

        if (path[i].startsWith(':')) {
          params[path[i].substring(1)] = route[i];
          continue;
        }

        isMatch = false;
        break;
      }

      if (isMatch) {
        return this._paramsIncludedRoutes[key];
      }
    }
  }
}

/**
 * RouteHandler class to handle the route handlers for different HTTP methods for a route
 * @class
 * @classdesc RouteHandler class to handle the route handlers for different HTTP methods for a route
 * @param {string} route - The route for which the handlers are to be added
 * @returns {RouteHandler} - A new RouteHandler object
 * @example
 * const RouteHandler = require('./route_map');
 * const routeHandler = new RouteHandler('/service');
 * routeHandler.addGET((req, res) => {
 *  res.end('GET /service');
 * });
 * routeHandler.addPOST((req, res) => {
 * res.end('POST /service');
 * });
 * routeHandler.addPUT((req, res) => {
 * res.end('PUT /service');
 * });
 */
class RouteHandler {
  route;
  handlers;

  constructor(route) {
    this.route = route;
    this.handlers = {};
  }

  _add(handler, method, paramHandler = null) {
    if (!(handler instanceof Function))
      throw new Error('Handler must be a function');

    if (paramHandler) {
      this.handlers[method] = (req, res) => {
        paramHandler(req, res, `${this.prefix}${this.route}`, handler);
      };
    } else {
      this.handlers[method] = handler;
    }
  }

  addGET(handler, paramHandler = null) {
    this._add(handler, 'GET', paramHandler);

    return this;
  }

  addPOST(handler, paramHandler = null) {
    this._add(handler, 'POST', paramHandler);

    return this;
  }

  addPUT(handler, paramHandler = null) {
    this._add(handler, 'PUT', paramHandler);

    return this;
  }

  addPATCH(handler, paramHandler = null) {
    this._add(handler, 'PATCH', paramHandler);

    return this;
  }

  addOPTION(handler, paramHandler = null) {
    this._add(handler, 'OPTION', paramHandler);

    return this;
  }

  addDELETE(handler, paramHandler = null) {
    this._add(handler, 'DELETE', paramHandler);

    return this;
  }

  addHEAD(handler, paramHandler = null) {
    this._add(handler, 'HEAD', paramHandler);

    return this;
  }

  GET() {
    return this.handlers.GET;
  }

  POST() {
    return this.handlers.POST;
  }

  PUT() {
    return this.handlers.PUT;
  }

  PATCH() {
    return this.handlers.PATCH;
  }

  DELETE() {
    return this.handlers.DELETE;
  }

  OPTION() {
    return this.handlers.OPTION;
  }

  HEADER() {
    return this.handlers.HEAD;
  }

  get(method) {
    switch (method) {
      case 'GET':
        return this.GET();
      case 'POST':
        return this.POST();
      case 'PUT':
        return this.PUT();
      case 'PATCH':
        return this.PATCH();
      case 'DELETE':
        return this.DELETE();
      case 'HEAD':
        return this.HEAD();
      case 'OPTION':
        return this.OPTION();
      default:
        return null;
    }
  }
}

module.exports = RouteMap;
