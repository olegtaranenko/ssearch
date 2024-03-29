Ext.define('SSearch.view.Viewport', {
	renderTo: Ext.getBody(),
	extend: 'Ext.container.Viewport',
	requires:[
		'Ext.rtl.*',
		'Ext.tab.Panel',
		'Ext.layout.container.Border'
	],

	layout: {
		type: 'border'
	},

	items: [{
		region: 'west',
		xtype: 'panel',
		title: 'west',
		width: 150
	},{
		region: 'center',
		xtype: 'tabpanel',
		items:[{
			title: 'Center Tab 1',
			items: [{
				xtype: 'main'
			}]
		}]
	}]
});