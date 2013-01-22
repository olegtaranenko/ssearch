Ext.Loader.setConfig({
    enabled: true,
    disableCaching: false
});


Ext.application({
    controllers: ["Main"],

    views: ["Main"],

    requires: ['SSearch.common.Config'],

    name: 'SSearch',

    autoCreateViewport: true
});
