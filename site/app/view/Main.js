Ext.define("SSearch.view.Main", {
    extend: 'Ext.Component',
    xtype: 'main',
    html: 'Hello, World!!',

    initComponent: function() {
        this.callParent();
        var log = this.getLogger();
        log.trace('Hello logger!!', this);
		log.event('event!!')
    }
});