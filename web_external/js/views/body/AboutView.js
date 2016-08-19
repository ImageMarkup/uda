isic.views.AboutView = isic.View.extend({
    initialize: function (settings) {
        this.render();
    },

    render: function () {
        this.$el.html(isic.templates.aboutPage({
            apiRoot: girder.apiRoot,
            staticRoot: girder.staticRoot,
        }));

        return this;
    }
});

isic.router.route('about', 'about', function (id) {
    girder.events.trigger('g:navigateTo', isic.views.AboutView);
});
