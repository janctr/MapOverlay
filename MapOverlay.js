define(['qlik', 'text!./template.html', 'css!./index.css'], function (
    qlik,
    template
) {
    function getObjectContentId(layout) {
        // `#${layout.qInfo.qId}_content` - targets the body of the object
        return `${layout.qInfo.qId}_content`;
    }

    function qualifySelector(layout, selector) {
        // Use this when making jQuery selections
        // so other qlik objects are not targeted
        const contentId = `#${getObjectContentId(layout)}`; // Prepend to every query

        console.log(`${contentId} ${selector}`);
        return `${contentId} ${selector}`;
    }

    function getMapOverlayEl(layout) {
        return $(`#${layout.qInfo.qId}-container.map-overlay`);
    }

    function placeMasterObject(layout, containerId) {
        console.log('placeMasterObject called: ', layout, containerId);
        if (!layout?.masterObjectId) return;

        qlik.currApp()
            .getObject(containerId, layout.masterObjectId)
            .then(
                function (model) {
                    console.log('displayed object');
                    // scope.initialDisplay = false;
                },
                function (error) {
                    //console.log(error);
                }
            );
    }

    function getMasterObjects() {
        return new Promise(function (resolve, reject) {
            const app = qlik.currApp();
            app.getList('masterobject').then(function (model) {
                app.destroySessionObject(model.layout.qInfo.qId);

                if (!model.layout.qAppObjectList.qItems) {
                    return resolve({ value: '', label: 'No master items' });
                }

                const masterOpts = model.layout.qAppObjectList.qItems.map(
                    ({ qInfo: { qId }, qMeta: { title } }) => ({
                        label: title,
                        value: qId,
                    })
                );

                console.log('masterOpts: ', masterOpts);
                return resolve([
                    { value: '', label: 'Choose master item' },
                    ...masterOpts,
                ]);
            });
        });
    }

    function render(layout) {
        if (getMapOverlayEl(layout).length) {
            // If it's already there, don't put it on the screen again
            return true;
        }

        const wrapperStyles = [];

        if (typeof layout.opacity === 'number') {
            wrapperStyles.push({ prop: 'opacity', value: layout.opacity });
        }

        const styles = wrapperStyles
            .map((style) => `${style.prop}: ${style.value}`)
            .join('; ');

        const overlayEl = $(
            `<div id="${layout.qInfo.qId}-container" class="map-overlay" style="${styles}">
                <div id="${layout.qInfo.qId}-masterobject" class="content"
                style="position: relative !important; padding: 0 !important;"></div>
            </div>`
        );

        // Check if container to render in exists
        if (!$('.idevio-map-canvas').length) {
            return false;
        }
        //

        overlayEl.insertAfter($('.idevio-map-canvas'));

        setTimeout(() => {
            placeMasterObject(layout, `${layout.qInfo.qId}-masterobject`);
        }, 1000);

        const mapOverlayContainerObject = $('.map-overlay-container')
            .parent()
            .parent()
            .parent()
            .parent()
            .parent()
            .parent()
            .parent()
            .parent();

        const visibility =
            qlik.navigation.getMode() === 'edit' ? 'visible' : 'hidden';

        mapOverlayContainerObject.css('visibility', visibility);

        return true;
    }

    return {
        template: template,
        definition: {
            type: 'items',
            component: 'accordion',
            items: {
                settings: {
                    type: 'items',
                    label: 'Settings',
                    translation: 'Settings',
                    items: {
                        masterObject: {
                            type: 'string',
                            component: 'dropdown',
                            label: 'Master object to display',
                            ref: 'masterObjectId',
                            defaultValue: '',
                            options: getMasterObjects(),
                        },
                        opacity: {
                            type: 'number',
                            component: 'slider',
                            label: 'Opacity',
                            ref: 'opacity',
                            defaultValue: 1,
                            min: 0,
                            max: 1,
                            step: 0.1,
                        },
                    },
                },
            },
        },
        support: {
            snapshot: true,
            export: true,
            exportData: false,
        },
        paint: function ($element, layout) {
            console.log('mapoverlay layout: ', layout);
            return qlik.Promise.resolve();
        },
        controller: [
            '$scope',
            function ($scope) {
                //add your rendering code here

                setInterval(() => {
                    render($scope.layout);
                }, 2500);
            },
        ],
    };
});
