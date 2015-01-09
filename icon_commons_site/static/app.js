(function() {
    var module = angular.module('icon_commons', ['ui.bootstrap']);

    module.controller('App', function($scope, $http) {
        var app = this;
        app.search = {};
        $http.get('/icons/collections').then(function(response) {
            app.collections = response.data.collections;
        });
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
                app.search.href = 'icons/icon?tag=' + response.config.params.tag;
                handleCollections(app.search, response);
            });
        };
        function handleCollections(collection, response) {
            var icons = response.data.icons;
            if (collection._icons) {
                collection._icons = collection._icons.concat(icons);
            } else {
                collection._icons = icons;
            }
            collection._more = response.data.page < response.data.pages;
            collection._nextPage = response.data.page + 1;
        }
        $scope.opened = function(collection) {
            if (collection._icons) {
                return;
            }
            $http.get(collection.href).then(function(response) {
                handleCollections(collection, response);
            });
        };
        $scope.loadMore = function(collection) {
            $http.get(collection.href, {
                params: {
                    page: collection._nextPage
                }
            }).then(function(response) {
                handleCollections(collection, response);
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