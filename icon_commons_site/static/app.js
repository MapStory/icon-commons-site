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
        return {
            getDataURI: function(rawsvg) {
                return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(rawsvg)));
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
            var coloredSVG = process($scope.data.rawsvg, $scope.color.fill, $scope.color.stroke);
            $scope.colored = {
                rawsvg: coloredSVG,
                uri: SVG.getDataURI(coloredSVG)
            };
            var port = '';
            if ($location.port() != 80) {
                port = ':' + $location.port();
            }
            $scope.coloredLink = $location.protocol() + "://" + $location.host() + port + path + '?' + 'fill=' + encodeURIComponent($scope.color.fill) + "&stroke=" + encodeURIComponent($scope.color.stroke);
        }
        function readMetaData() {
            // @todo cleanup this POC
            var element = angular.element(document.createElement('div'));
            element.html($scope.data.rawsvg);
            element = element.find('svg').find('metadata')[0];
            var metadata = [];
            if (element) {
                Array.forEach(element.getElementsByTagName('*'), function(e) {
                    var tag = e.tagName;
                    if (tag == 'cc:license') {
                        metadata.push({
                            key:'License',
                            href:e.attributes.getNamedItem('rdf:resource').value
                        });
                    }
                    if (tag == 'dc:publisher') {
                        var el = angular.element(e).find('cc:agent');
                        metadata.push({
                            key:'Publisher',
                            value: el.find('dc:title').text(),
                            href: el.attr('rdf:about')
                        });
                    }
                });
            } else {
                metadata.push({key:'None'});
            }
            $scope.metadata = metadata;
        }
        function iconChanged() {
            if ($scope.data) {
                colorIcon();
                readMetaData();
            }
        }
        $scope.color = {
            fill: '#ff0000',
            stroke: '#0000ff'
        };
        $http.get(path + '/info').then(function(response) {
            $scope.iconInfo = response.data;
        });
        $http.get(path).then(function(response) {
            $scope.data = {
                uri: SVG.getDataURI(response.data),
                rawsvg: response.data
            };
            iconChanged();
        });
        $scope.change = function(svg) {
            $scope.data.uri = SVG.getDataURI(svg);
            $scope.rawsvg = svg;
            iconChanged();
        };
        $scope.sce = function() {
            $scope.data.uri = SVG.getDataURI($scope.data.rawsvg);
        };
        $scope.$watch('color', iconChanged, true);
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
            template: '<img ng-src="{{src.uri}}"></img><div class=bg-danger ng-if=svgErrors>SVG Errors</div>',
            scope: {
                'src': '='
            },
            link: function(scope, element, attrs) {
                var img = element.find('img');
                scope.svgErrors = false;
                function setErrors(e) {
                    scope.$apply(function() {
                        scope.svgErrors = e;
                    });
                }
                img.on('error', function() {
                    setErrors(true);
                    // @todo detect bad load of intial rawsvg and report the problem
                });
                img.on('load', function() {
                    setErrors(false);
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
                'change': '=',
                'isActive': '=',
                'readOnly': '@'
            },
            link: function(scope, element, attrs) {
                var ro = scope.readOnly == 'true';
                var cm = CodeMirror(element[0], {
                    value: scope.data.rawsvg,
                    lineNumbers: true,
                    readOnly: ro,
                    indentUnit: 4,
                    mode: "xml"
                });
                cm.setSize('100%', '50%');
                cm.on('change', function() {
                    scope.$apply(function() {
                        scope.change(cm.getValue());
                    });
                });
                // ugly hack to refresh and fix blank editor in tab
                scope.watch('isActive', function() {
                    cm.refresh();
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