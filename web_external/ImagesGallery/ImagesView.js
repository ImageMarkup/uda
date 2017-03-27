isic.views.ImagesView = isic.View.extend({
    initialize: function (settings) {
        this.completeFacets = new isic.collections.ImagesFacetCollection();
        // TODO: when filteredFacets fetch returns no images, all models are gone / removed
        this.filteredFacets = new isic.collections.ImagesFacetCollection();
        this.filters = new isic.collections.ImagesFilters();

        // TODO: replace this with an inline grammar
        this.filterLoaded = isic.SerializeFilterHelpers.loadFilterGrammar();

        this.images = new isic.collections.SelectableImageCollection();
        this.images.pageLimit = 50;

        // Rather than issue a second fetch request for this.filteredFacets,
        // copy the response of the first request for this.completeFacets
        this.listenTo(this.completeFacets, 'sync', function (collection, resp, options) {
            // TODO: ideally, this.filteredFacets would only be reset when
            // this.completeFacets triggered an "update" (which would prevent resets when
            // "sync" had no changes); however, it's difficult to deep-copy all of
            // the models from this.completeFacets to this.filteredFacets without having
            // access to the raw HTTP response
            this.filteredFacets.reset(resp, {parse: true});

            this.images.fetch();

            this.filters.initialize(collection);
        });
        this.listenTo(this.filters, 'change', function () {
            // TODO: Ideally, this should select and cancel only the old set of requests; until
            // that's fixed, hopefully nobody will click histogram buttons too early in the page
            // load
            girder.cancelRestRequests();

            var filterQuery = JSON.stringify(this.filters.asAst());
            // TODO: If there's no filterQuery, we could just reset filteredFacets to completeFacets
            this.filteredFacets.fetch({
                // filteredFacets is a direct subclass of Backbone.Collection, with different
                // arguments to ".fetch"
                data: {
                    filter: filterQuery
                }
            });
            this.images.fetch({
                offset: 0,
                filter: filterQuery
            });
        });

        this.render();
    },

    render: function () {
        this.$el.html(isic.templates.imagesPage());

        if (!(this.addedTemplate)) {
            isic.shims.recolorImageFilters(['#00ABFF', '#444499', '#CCCCCC']);
            this.addedTemplate = true;
        }
        if (!this.addedCollapseImage) {
            // little hack to inject the correct expander image path into the
            // stylesheet (afaik, we can't access girder.staticRoot from the
            // stylus files)
            var isicStylesheet = Array.from(document.styleSheets)
                .filter(function (sheet) {
                    return sheet.href &&
                        sheet.href.indexOf('isic_archive.app.min.css') !== -1;
                })[0];
            isicStylesheet.insertRule('#isic-images-histogramPane ' +
                '.attributeSection .header input.expander:before ' +
                '{background-image: url(' + girder.staticRoot +
                    '/built/plugins/isic_archive/extra/img/collapse.svg);}',
                0);
            this.addedCollapseImage = true;
        }

        // This will self-render when this.completeFacets updates
        this.facetsPane = new isic.views.ImagesFacetsPane({
            completeFacets: this.completeFacets,
            filteredFacets: this.filteredFacets,
            filters: this.filters,
            el: this.$('#isic-images-facetsPane'),
            parentView: this
        });

        // This will self-render when this.images updates
        this.imageWall = new isic.views.ImageWall({
            images: this.images,
            el: this.$('#isic-images-imageWall'),
            parentView: this
        });

        // This will self-render immediately
        this.pagingPane = new isic.views.ImagesPagingPane({
            completeFacets: this.completeFacets,
            filteredFacets: this.filteredFacets,
            images: this.images,
            filters: this.filters,
            el: this.$('#isic-images-pagingPane'),
            parentView: this
        });

        // This will self-render when this.images is selected
        this.imageDetailsPane = new isic.views.ImageDetailsPane({
            images: this.images,
            el: this.$('#isic-images-imageDetailsPane'),
            parentView: this
        });

        // This kicks off the loading and rendering of all data
        this.filterLoaded.done(_.bind(function () {
            this.completeFacets.fetch();
        }, this));

        // TODO: Issue an "images.fetch()" here too, so it can run in parallel with
        // "completeFacets.fetch()"; unfortunately, ImageWall depends on completeFacets being
        // completely loaded before "images" resolves

        return this;
    }
});

isic.router.route('images', 'images', function () {
    var nextView = isic.views.ImagesView;
    if (!isic.models.UserModel.currentUserCanAcceptTerms()) {
        nextView = isic.views.TermsAcceptanceView;
    }
    girder.events.trigger('g:navigateTo', nextView);
});