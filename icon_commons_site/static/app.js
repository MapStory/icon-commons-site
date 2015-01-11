(function() {
    var module = angular.module('icon_commons', ['ui.bootstrap', 'ngRoute']);

    module.config(function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: '/static/home.html'
            })
            .when('/tags/:tag?', {
                controller: 'Tags',
                templateUrl: '/static/tags.html'
            })
            .when('/icons/collections/:collection*', {
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

    function process(svg, fill, stroke) {
        var element = angular.element(document.createElement('div'));
        element.html(svg);
        // @todo make smarter
        ['path', 'rect'].forEach(function(el) {
            angular.forEach(element.find(el), function(e) {
                // @todo does it make sense to override stroke width?
                e = angular.element(e);
                var css = {
                    opacity: 1
                };
                var existingFill = e.css('fill') || e.attr('fill') || '';
                console.log(existingFill);
                if (existingFill != 'none' && existingFill != 'rgb(255, 255, 255)' && existingFill.toLowerCase() != '#ffffff') {
                    css.fill = fill;
                }
                var existingStroke = e.css('stroke') || e.attr('stroke');
                if (existingStroke != 'none') {
                    css.stroke = stroke;
                }
                e.css(css);
            });
        });
        return element.html();
    }

    module.controller('IconView', function($scope, $location, $http, SVG) {
        var path = $location.path();
        function colorIcon() {
            if ($scope.data) {
                $scope.colored = {
                    uri: SVG.getDataURI(process($scope.data.rawsvg, $scope.color.fill, $scope.color.stroke))
                };
                var port = '';
                if ($location.port() != 80) {
                    port = ':' + $location.port();
                }
                $scope.coloredLink = $location.protocol() +"://" + $location.host() + port + path + '?' + 'fill=' + encodeURIComponent($scope.color.fill) + "&stroke=" + encodeURIComponent($scope.color.stroke);
            }
        }
        $scope.color = {
            fill:'#ff0000',
            stroke:'#0000ff'
        };
        $http.get(path + '/info').then(function(response) {
            $scope.iconInfo = response.data;
        });
        $http.get(path).then(function(response) {
            $scope.data = {
                uri: SVG.getDataURI(response.data),
                rawsvg: response.data
            };
            colorIcon();
        });
        $scope.change = function(svg) {
            $scope.data.uri = SVG.getDataURI(svg);
            $scope.rawsvg = svg;
            colorIcon();
        };
        $scope.sce = function() {
            $scope.data.uri = SVG.getDataURI($scope.data.rawsvg);
        };
        $scope.$watch('color', colorIcon, true);
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

    module.controller('Tags', function($scope, $http, $routeParams, IconService) {
        $scope.search = {};
        $scope.searchPhrase = $routeParams.tag;
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
        if ($routeParams.tag) {
            $scope.typeaheadSelect($routeParams.tag);
        }
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

    module.directive('svgImage', function() {
        return {
            restrict: 'E',
            template: '<img ng-src="{{src.uri}}"></img>',
            scope: {
                'src': '='
            },
            link: function(scope, element, attrs) {
                var img = element.find('img');
                img.on('error', function() {
                    console.log('error', arguments);
                });
                img.on('load', function() {
                    console.log('load', arguments);
                });
            }
        };
    });

    module.directive('svgEditor', function() {
        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                'data': '=',
                'change': '='
            },
            link: function(scope, element, attrs) {
                var cm = CodeMirror(element[0], {
                    value: scope.data.rawsvg,
                    mode: "xml"
                });
                cm.setSize('100%','50%');
                cm.on('change', function() {
                    scope.$apply(function() {
                        scope.change(cm.getValue());
                    });
                });
            }
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