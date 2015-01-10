(function() {
    var module = angular.module('icon_commons', ['ui.bootstrap', 'ngRoute']);

    module.config(function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: '/static/home.html'
            })
            .when('/tags', {
                controller: 'Tags',
                templateUrl: '/static/tags.html'
            })
            .when('/icons/collections/:collection', {
                controller: 'Collection',
                templateUrl: '/static/collection.html'
            })
            .when('/collections', {
                controller: 'Collections',
                templateUrl: '/static/collections.html'
            })
            .when('/icons/icon/:icon', {
                controller: 'IconView',
                templateUrl: '/static/icon-view.html'
            });
    });

    module.service('IconService', function() {
        return {
            handleCollections: function(collection, response) {
                var icons = response.data.icons;
                if (collection._icons) {
                    collection._icons = collection._icons.concat(icons);
                } else {
                    collection._icons = icons;
                }
                collection._more = response.data.page < response.data.pages;
                collection._nextPage = response.data.page + 1;
            }
        };
    });

    module.service('SVG', function() {
        var element = angular.element(document.createElement('div'));
        return {
            getDataURI: function(rawsvg) {
                element.html(rawsvg);
                return 'data:image/svg+xml;base64,' + btoa(element.html());
            }
        };
    });

    module.controller('IconView', function($scope, $routeParams, $http, $sce, SVG) {
        $scope.data = {};
        $http.get('/icons/icon/' + $routeParams.icon).then(function(response) {
            $scope.data.uri = SVG.getDataURI(response.data);
            $scope.data.rawsvg = response.data;
        });
        $scope.sce = function() {
            $scope.data.uri = SVG.getDataURI($scope.data.rawsvg);
        };
    });

    module.controller('Collection', function($scope, $routeParams, $http, IconService) {
        $scope.collection = {
            icons: [],
            href: '/icons/collections/' + $routeParams.collection
        };
        $http.get($scope.collection.href).then(function(response) {
            IconService.handleCollections($scope.collection, response);
        });
    });

    module.controller('Collections', function($scope, $http) {
        $http.get('/icons/collections').then(function(response) {
            $scope.collections = response.data.collections;
        });
    });

    module.controller('Tags', function($scope, $http, IconService) {
        $scope.search = {};
        $scope.getTags = function(val) {
            var promise = $http.get('/icons/search/tags', {
                params: {
                    query: val
                }
            }).then(function(response) {
                return response.data.tags;
            });
            return promise;
        };
        $scope.typeaheadSelect = function(tag) {
            $http.get('/icons/icon', {
                params: {
                    tag: tag
                }
            }).then(function(response) {
                // @todo ugly
                $scope.search.href = 'icons/icon?tag=' + response.config.params.tag;
                IconService.handleCollections($scope.search, response);
            });
        };
    });

    module.controller('App', function($scope, $http, IconService) {
        $scope.loadMore = function(collection) {
            $http.get(collection.href, {
                params: {
                    page: collection._nextPage
                }
            }).then(function(response) {
                IconService.handleCollections(collection, response);
            });
        };
    });

    module.directive('iconList', function() {
        return {
            restrict: 'E',
            scope: {
                icons: '='
            },
            templateUrl: '/static/icon-list.html'
        };
    });
})();