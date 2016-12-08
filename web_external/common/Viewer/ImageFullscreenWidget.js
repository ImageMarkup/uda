isic.views.ImageFullscreenWidget = isic.View.extend({
    render: function () {
        this.$el.html(isic.templates.imageFullscreenWidget({
            model: this.model
        })).girderModal(this).on('shown.bs.modal', _.bind(function () {
            this.imageViewerWidget = new isic.views.ImageViewerWidget({
                el: this.$('.isic-image-fullscreen-container'),
                model: this.model,
                parentView: this
            }).render();
        }, this)).on('hidden.bs.modal', _.bind(function () {
            if (this.imageViewerWidget) {
                this.imageViewerWidget.destroy();
                delete this.imageViewerWidget;
            }
        }, this));
    }
});