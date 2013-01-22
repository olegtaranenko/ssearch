Ext.define("SSearch.view.Main", {
	extend: 'Ext.Component',
	xtype: 'main',
	layout: 'form',
//    html: 'Hello, World!!',
	items: [{
		xtype: 'text' +
			'field',
		width: 300,
		fieldLabel: 'Search '

	}],

	initComponent: function() {
		this.callParent();
		var log = this.getLogger();
		log.trace('Hello logger!!', this);
		log.event('event!!')
	}
});