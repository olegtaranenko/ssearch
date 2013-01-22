Ext.Loader.setConfig({
    enabled: true,
    disableCaching: false
});


Ext.application({
    controllers: ["Main"],

    views: ["Main"],


    name: 'SSearch',

    autoCreateViewport: true
});
