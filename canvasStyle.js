/*
 * Styles
*/

$(document).ready(function() {
        function adjustSize() {
            return function() {
                var menuContainer = $('.container');
                var canvasWrapper = $('.wrapper');
                var canvasContainer = $('.canvas-container');
                var allCanvas = $('canvas');

                // reset to 100%, so adjustment calculations do not break
                canvasWrapper.css('height', '100%');

                // adjust
                canvasWrapper.css('width', menuContainer.outerWidth(false));
                canvasWrapper.css('height', canvasWrapper.height() - menuContainer.height());
                canvasWrapper.css('margin-left', menuContainer.css('margin-left'));

                // adjust Fabric.js
                canvasContainer.css('width', '100%');
                canvasContainer.css('height', '100%');

                canvas.setWidth(canvasContainer.width());
                canvas.setHeight(canvasContainer.height());
                canvas.calcOffset();
            };
        };

        adjustSize()();

        $(window).resize(function() {
            adjustSize()();
        });
});