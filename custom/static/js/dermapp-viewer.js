'use strict';
/*global derm_app, $, console*/
/*jslint browser: true*/

var olViewer = derm_app.factory('olViewer',
    function (ol, $http, $log, xmlParser) {

        var olViewer = function (mapContainer) {

            $log.debug('Creating olViewer:', this);

            var self = this;

            // Instance variables
            this.image_source = undefined;
            this.image_layer = undefined;

            this.map = undefined;
            this.draw_mode = undefined;
            this.draw_label = undefined;

            this.last_click_location = undefined;
            this.last_job_id = undefined;
            this.fill_tolerance = 50;

            this.paint_size = 70;

//            this.select_interaction = new ol.interaction.Select();
//            this.selected_features = this.select_interaction.getFeatures();
//            var collection = select.getFeatures();
//            this.selected_features.on('add', function(e){
//                $log.debug('add', e);
//            });
//            this.selected_features.on('remove', function(e){
//                $log.debug('remove', e);
//            });

            // annotations added that need to be saved
//            this.clearTemporaryAnnotations();

            // current list of features
            // annotations previously saved

            var styleFunction = (function () {
                return function (feature, resolution) {
                    if (feature.get('hexcolor')) {
                        return [
                            new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: feature.get('hexcolor'),
                                    width: 2
                                }),
                                fill: new ol.style.Fill({
                                    color: feature.get('rgbcolor')
                                })
                            })
                        ];
                    } else {
                        return [
                            new ol.style.Style({
                                fill: new ol.style.Fill({
                                    color: 'rgba(255, 255, 255, 0.2)'
                                }),
                                stroke: new ol.style.Stroke({
                                    color: '#000000',
                                    width: 0
                                }),
                                image: new ol.style.Circle({
                                    radius: 0,
                                    fill: new ol.style.Fill({
                                        color: '#000000'
                                    })
                                })
                            })
                        ];
                    }
                };
            })();

            this.vector_source = new ol.source.Vector();
            this.vector_layer = new ol.layer.Vector({
                source: this.vector_source,
                style: styleFunction
            });

            this.draw_interaction = new ol.interaction.Draw({
                source: this.vector_source,
                type: 'Polygon'
            });

            this.draw_interaction.on('drawend', function (e) {
                var properties;

                if (self.draw_label === 'lesion') {
                    properties = {
                        icon: 'static/derm/images/lesion.jpg',
                        hexcolor: '#ff0000',
                        source: 'manual pointlist',
                        title: self.draw_label,
                        rgbcolor: 'rgba(255, 255, 255, 0.1)'
                    };
                } else if (self.draw_label === 'normal') {
                    properties = {
                        icon: 'static/derm/images/normal.jpg',
                        hexcolor: '#0099ff',
                        source: 'manual pointlist',
                        title: self.draw_label,
                        rgbcolor: 'rgba(255, 255, 255, 0.1)'
                    };
                } else {
                    properties = {};
                }

                //e.feature.setValues(properties);
                e.feature.setProperties(properties);

                //$log.debug(e.feature.getProperties());
                // need to manually update the angular state, since they're not directly linked
                externalApply();
            });

            // initialize map (imageviewer)
            this.map = new ol.Map({
                renderer: 'canvas',
                target: mapContainer
            });

            // set map event handlers
            this.map.on('singleclick', function(evt) {
                var click_coords = [evt.coordinate[0], -evt.coordinate[1]];

                if (self.draw_mode === 'navigate') {
                    self.last_click_location = click_coords;

                } else if (self.draw_mode === 'pointlist') {
                    self.last_click_location = evt.coordinate;

                } else if (self.draw_mode === 'autofill') {
                    self.last_click_location = click_coords;
                    self.autofill(click_coords);

                } else if (self.draw_mode === 'lines') {
                    self.last_click_location = evt.coordinate;
                    self.addPoint(evt.coordinate);
                }
            });

            $(this.map.getViewport()).on('mousemove', function (evt) {
                var pixel = self.map.getEventPixel(evt.originalEvent);
                self.featuresAtPoint(pixel);
            });
        };


        // Define the "instance" methods using the prototype
        // and standard prototypal inheritance.
        olViewer.prototype = {

            clearCurrentImage: function () {
                if (this.image_layer) {
                    this.map.removeLayer(this.image_layer);
                }
            },

            hasLayerAnnotations: function () {
                return this.vector_source.getFeatures().length > 0;
            },

            moveToFeature: function (feature) {
                this.map.getView().fitGeometry(
                    feature.getGeometry(),
                    this.map.getSize(),
                    {
                        padding: [120, 20, 20, 20],
                        constrainResolution: false
                    }
                );
            },

            featuresAtPoint: function (pixel) {
                var feature = this.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                    return feature;
                });
                var info = document.getElementById('objectinfo');

                if (feature) {
                    var icon = feature.get('icon');

                    if (icon) {
                        info.src = icon;
                        info.style.display = 'inline';
                    } else {
                        info.src = '/uda/static/na.jpg';
                        info.style.display = 'none';
                    }
                } else {
                    info.style.display = 'none';
                    info.src = '/uda/static/na.jpg'
                }
            },

            featureListFromAnnotation: function (annotation) {
                // $log.debug(annotation);
                var features_list = [];

                if (annotation.polygons.length > 0) {
                    var af_feature = new ol.Feature({
                        classification: annotation.classification
                    });

                    af_feature.setGeometry(new ol.geom.Polygon([annotation.polygons]));
                    features_list.push(af_feature);
                }

                if (annotation.lines.length > 0) {
                    var l_feature = new ol.Feature({
                        classification: annotation.classification
                    });

                    l_feature.setGeometry(new ol.geom.Polygon([annotation.lines]));
                    features_list.push(l_feature);
                }

                return features_list;
            },

            grabCurrentTiles: function () {
                if (this.segmentannotator) {
                    var index_values = this.segmentannotator.getIndicies();
                    return index_values;
                }
                return [];
            },

            clearTiles: function () {
                if (this.segmentannotator) {
                    this.segmentannotator.clearTiles();
                }
            },

            loadTiles: function (tiles) {
                if (this.segmentannotator) {
                    this.segmentannotator.loadTiles(tiles);
                }
            },

            disableTiles: function () {
                if (this.segmentannotator) {
                    //this.segmentannotator.disable();
                    // The implementation of "disable" is broken
                    this.segmentannotator.layers.highlight.canvas.style.display = 'none';

                }
            },

            enableTiles: function () {
                if (this.segmentannotator) {
                    //this.segmentannotator.enable();
                    // The implementation of "enable" is broken
                    this.segmentannotator.layers.highlight.canvas.style.display = 'block';
                }
            },

            getFeatures: function () {
                return this.vector_source.getFeatures();
            },

            setAnnotations: function (features) {
                if (features) {
                    this.vector_source.addFeatures(features);
                }
            },

            clearLayerAnnotations : function (step) {
                this.vector_source.clear();
            },

            acceptPainting: function () {
                var annotation = this.segmentannotator.getAnnotation();
                var extent = this.map.getView().calculateExtent(this.map.getSize());
                var tr = ol.extent.getTopRight(extent);
                var bl = ol.extent.getBottomLeft(extent);
                var segmenturl = 'segment';

                var msg = {
                    image: annotation,
                    extent: [tr, bl]
                };

                var self = this;
                // interesting hack to get the UI to update without external scopy applys
                $http.post(segmenturl, msg).success(function (response) {

                    $log.debug(response);

                    self.vector_source.clear();

                    var f = new ol.format.GeoJSON();

                    for (var i=0; i<response.features.length; i++) {

                        var jsObject = JSON.parse(response.features[i]);

                        var label = _labels[parseInt(jsObject.properties.labelindex)];
                        jsObject.properties.label = label;

                        var hexcolor = rgbToHex(label.color[0], label.color[1], label.color[2]);
                        var rgbcolor = 'rgba(' + label.color[0] + ',' + label.color[1] + ',' + label.color[2] + ',0.0)';

                        jsObject.properties.rgbcolor = rgbcolor;
                        jsObject.properties.icon = label.icon;
                        jsObject.properties.hexcolor = hexcolor;
                        jsObject.properties.title = label.title;

                        var featobj = f.readFeature(jsObject);

                        self.vector_source.addFeature(featobj);
                    }

                    // manually request an updated frame async
                    self.map.render();
                });
            },

            selectAnnotationLabel: function (detailvalue) {
                this.segmentannotator.setCurrentLabel(detailvalue.toString());
            },

            hidePaintLayerIfVisible: function () {
                if (this.segmentannotator) {
//                    $("#annotatorcontainer").hide();
                }
            },

            showPaintLayerIfVisible: function () {
                if (this.segmentannotator) {
//                    $("#annotatorcontainer").show();

//                    $("#map").hide();
//                    this.map.render();
                    return true;
                }
                return false;
            },

            removeDrawInteraction: function () {
                if (this.draw_interaction) {
                    this.map.removeInteraction(this.draw_interaction);
                }
            },

            clearPaintByNumber: function () {
                if (this.segmentannotator) {
                    delete this.segmentannotator;
                    $('#annotatorcontainer').empty();
                }
            },

            loadPainting: function (imageId, segmentationId, onLoadCallback) {
                var self = this;

                self.segmentannotator = new UDASegmentAnnotator(
                    imageId,
                    segmentationId,
                    {
                        regionSize: self.paint_size,
                        backgroundColor: [0,0,0],
                        container: document.getElementById('annotatorcontainer'),
                        fillAlpha: 0,
                        highlightAlpha: 0,
                        boundaryAlpha: 190,
                        labels: _labels,
                        onload: onLoadCallback || function () {
    //                        $("#annotatorcontainer").show();
                        }
                    }
                );
            },

            startPainting: function () {
                var self = this;

                this.map.once('postcompose', function (event) {
                    var canvas = event.context.canvas;

                    if (self.segmentannotator) {
//                        self.showPaintLayerIfVisible()
                    } else {
//                        $log.debug("input", canvas.width, canvas.height);

                        self.segmentannotator = new SLICSegmentAnnotator(canvas, {
                            regionSize: self.paint_size,
                            container: document.getElementById('annotatorcontainer'),
                            backgroundColor: [0,0,0],
                            fillAlpha: 0,
                            highlightAlpha: 0,
                            boundaryAlpha: 190,
                            labels: _labels,
                            onload: function (self) {}
                        });
                    }

                    var feature = new ol.Feature({
                        title: 'superpixel placeholder',
                        longtitle: 'superpixel region',
                        icon: ''
                    });

                    // set the geometry of this feature to be the screen extents
                    feature.setGeometry(new ol.geom.Point([0, 0]));

                    self.vector_source.clear();
                    self.vector_source.addFeature(feature);

                    self.segmentannotator.setCurrentLabel(0);

                    externalApply();
                });
            },

            setFillParameter: function (new_fill_tolerance) {
                this.fill_tolerance = new_fill_tolerance;
            },

            setPaintParameter: function (new_paint_size) {
                this.paint_size = new_paint_size;
            },

            hasSegmentation: function () {
              return this.segmentannotator !== undefined;
            },

            regenerateFill: function () {
              this.autofill(this.last_click_location);
            },

            autofill: function (click_coords) {
                var self = this;

//                var extent = this.map.getView().calculateExtent(this.map.getSize());
//                var tr = ol.extent.getTopRight(extent);
//                var tl = ol.extent.getTopLeft(extent);
//                var bl = ol.extent.getBottomLeft(extent);
                // think: if x is positive on left, subtract from total width
                // if x on right is greater than width, x = width

                var segmentURL = '/api/v1/image/' + this.current_image_id + '/segment';
                var msg = {
                    tolerance: this.fill_tolerance,
                    seed: click_coords.map(Math.round)
                };
                $http.post(segmentURL, msg).success(function (response) {

                    self.vector_source.clear();
                    var f = new ol.format.GeoJSON();

                    // flip the sign of the y-coordinates
                    var coordinates = response.geometry.coordinates[0];
                    for (var j=0; j<coordinates.length; j++) {
                        coordinates[j][1] = -1 * coordinates[j][1];
                    }

                    var featobj = f.readFeature(response);
                    featobj.setId(0);
                    featobj.setProperties({
                        rgbcolor: 'rgba(255, 255, 255, 0.1)',
                        hexcolor: '#ff0000',
                        title : self.draw_label,
                        icon : '/uda/static/derm/images/lesion.jpg'
                    });

                    self.vector_source.addFeature(featobj);

                    // manually request an updated frame async
                    self.map.render();
                });
            },

            hasJobResult: function (results) {
                if (results.uuid == this.last_job_id) {
                    $log.debug(results.result);
                }
            },

            setDrawMode: function (draw_mode, draw_label) {
                this.draw_mode = draw_mode;
                this.draw_label = draw_label;

                $log.debug('Draw settings:', this.draw_mode, this.draw_label);

                if (draw_mode == 'navigate') {

                } else if (draw_mode == 'paintbrush') {

                } else if (draw_mode == 'autofill') {

                } else if (draw_mode == 'pointlist') {
                    this.map.addInteraction(this.draw_interaction);
                }
            },

            getSegmentationPackage: function () {
                var extent = this.map.getView().calculateExtent(this.map.getSize());
                var tr = ol.extent.getTopRight(extent);
//                var tl = ol.extent.getTopLeft(extent)
                var bl = ol.extent.getBottomLeft(extent);

                var content = {
                    viewercoordinates: {
                        topright: ol.extent.getTopRight(extent),
                        topleft: ol.extent.getTopLeft(extent),
                        bottomright: ol.extent.getBottomRight(extent),
                        bottomleft: ol.extent.getBottomLeft(extent),
                    },
                    canvasdimensions: {
                        width: this.segmentannotator.width,
                        height: this.segmentannotator.height
                    },
                    rgb: this.segmentannotator.getCanvasAsPNG(),
                    tiles: this.segmentannotator.getTilesAsPNG(),
                    regionsize: this.paint_size
                };
                return content;
//                return this.segmentannotator.getAllData();
            },

//          designed for the Girder-based url-rewrite.
            loadImageWithURL: function (image_id) {
                var self = this;

                self.current_image_id = image_id;
                var base_url = '/api/v1/item/' + image_id;
                self.segmentation_list = [];

                self.zoomify_url = base_url + '/zoomify';
                self.data_url = window.location.protocol + '//' + window.location.hostname +  base_url + '/fif';

                var image_properties_xml = self.zoomify_url  + '/ImageProperties.xml';

                $http.get(image_properties_xml).then(function (hresp) {
                    /* Parse a Zoomify protocol metadata request
                    */
                    var parseMetaData = function (response) {
                        // Simply split the reponse as a string
                        var tmp = response.split('"');
                        var w = parseInt(tmp[1]);
                        var h = parseInt(tmp[3]);
                        var ts = parseInt(tmp[11]);
                        // Calculate the number of resolutions - smallest fits into a tile
                        var max = (w>h)? w : h;
                        var n = 1;
                        while ( max > ts ) {
                          max = Math.floor( max/2 );
                          n++;
                        }
                        var result = {
                          max_size: { w: w, h: h },
                          tileSize: { w: ts, h: ts },
                          num_resolutions: n
                        };
                        return result;
                    };

                    var metadata = parseMetaData(hresp.data);
                    // $log.debug(metadata);

                    self.imageCenter = [metadata.max_size.w / 2, - metadata.max_size.h / 2];

                    self.proj = new ol.proj.Projection({
                        code: 'ZOOMIFY',
                        units: 'pixels',
                        extent: [0, 0, metadata.max_size.w, metadata.max_size.h]
                    });

                    // https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes
                    var crossOrigin = 'use-credentials';

                    self.image_source = new ol.source.Zoomify({
                        url: self.zoomify_url + '/',
                        size: [metadata.max_size.w, metadata.max_size.h],
                        crossOrigin: crossOrigin
                    });

                    self.image_layer = new ol.layer.Tile({
                       source: self.image_source,
                       preload: 1
                    });

                    self.nativeSize = metadata.max_size;

                    self.view = new ol.View({
                      projection: self.proj,
                      center: self.imageCenter,
                      zoom: 2,
                      maxZoom: metadata.num_resolutions
                    });

                    self.map.addLayer(self.image_layer);
                    self.map.addLayer(self.vector_layer);
                    self.map.setView(self.view);
                });
            }
        };
        return olViewer;
    }
);

