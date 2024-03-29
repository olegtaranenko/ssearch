/**
 * @class Ext.util.AbstractMixedCollection
 * @private
 */
Ext.define('Ext.util.AbstractMixedCollection', {
    requires: ['Ext.util.Filter'],

    mixins: {
        observable: 'Ext.util.Observable'
    },

    /**
     * @property {Boolean} isMixedCollection
     * `true` in this class to identify an object as an instantiated MixedCollection, or subclass thereof.
     */
    isMixedCollection: true,

    /**
     * @private Mutation counter which is incremented upon add and remove.
     */
    generation: 0,
    
    /**
     * @private Mutation counter for the index map which is synchronized with the collection's mutation counter
     * when the index map is interrogated and found to be out of sync and needed a rebuild.
     */
    indexGeneration: 0,

    constructor: function(allowFunctions, keyFn) {
        var me = this;

        // Modern constructor signature using a config object
        if (arguments.length === 1 && Ext.isObject(allowFunctions)) {
            me.initialConfig = allowFunctions;
            Ext.apply(me, allowFunctions);
        }
        // Old constructor signature
        else {
            me.allowFunctions = allowFunctions === true;
            if (keyFn) {
                me.getKey = keyFn;
            }
            me.initialConfig = {
                allowFunctions: me.allowFunctions,
                getKey: me.getKey
            };
        }

        me.items = [];
        me.map = {};
        me.keys = [];
        me.indexMap = {};
        me.length = 0;

        /**
         * @event clear
         * Fires when the collection is cleared.
         * @since Ext 1
         */

        /**
         * @event add
         * Fires when an item is added to the collection.
         * @param {Number} index The index at which the item was added.
         * @param {Object} o The item added.
         * @param {String} key The key associated with the added item.
         * @since Ext 1
         */

        /**
         * @event replace
         * Fires when an item is replaced in the collection.
         * @param {String} key he key associated with the new added.
         * @param {Object} old The item being replaced.
         * @param {Object} new The new item.
         * @since Ext 1
         */
       
        /**
         * @event remove
         * Fires when an item is removed from the collection.
         * @param {Object} o The item being removed.
         * @param {String} key (optional) The key associated with the removed item.
         * @since Ext 1
         */

        me.mixins.observable.constructor.call(me);
    },

    /**
     * @cfg {Boolean} allowFunctions Specify <code>true</code> if the {@link #addAll}
     * function should add function references to the collection. Defaults to
     * <code>false</code>.
     * @since Ext 3
     */
    allowFunctions : false,

    /**
     * Adds an item to the collection. Fires the {@link #event-add} event when complete.
     *
     * @param {String/Object} key The key to associate with the item, or the new item.
     *
     * If a {@link #getKey} implementation was specified for this MixedCollection,
     * or if the key of the stored items is in a property called `id`,
     * the MixedCollection will be able to *derive* the key for the new item.
     * In this case just pass the new item in this parameter.
     *
     * @param {Object} [obj] The item to add.
     *
     * @return {Object} The item added.
     * @since Ext 1
     */
    add : function(key, obj) {
        return this.insert(this.length, key, obj);
    },

    /**
     * MixedCollection has a generic way to fetch keys if you implement getKey.  The default implementation
     * simply returns *`item.id`* but you can provide your own implementation
     * to return a different value as in the following examples:
     *
     *    // normal way
     *    var mc = new Ext.util.MixedCollection();
     *    mc.add(someEl.dom.id, someEl);
     *    mc.add(otherEl.dom.id, otherEl);
     *    //and so on
     *
     *    // using getKey
     *    var mc = new Ext.util.MixedCollection({
     *        getKey: function(el){
     *            return el.dom.id;
     *        }
     *    });
     *    mc.add(someEl);
     *    mc.add(otherEl);
     *
     * @param {Object} item The item for which to find the key.
     * @return {Object} The key for the passed item.
     * @since Ext 1
     */
    getKey : function(o) {
         return o.id;
    },

    /**
     * Replaces an item in the collection. Fires the {@link #event-replace} event when complete.
     * @param {String} key The key associated with the item to replace, or the replacement item.
     * 
     * If you supplied a {@link #getKey} implementation for this MixedCollection, or if the key
     * of your stored items is in a property called *`id`*, then the MixedCollection
     * will be able to <i>derive</i> the key of the replacement item. If you want to replace an item
     * with one having the same key value, then just pass the replacement item in this parameter.
     * 
     * @param o {Object} o (optional) If the first parameter passed was a key, the item to associate
     * with that key.
     * @return {Object}  The new item.
     * @since Ext 1
     */
    replace : function(key, o) {
        var me = this,
            old,
            index;

        if (arguments.length == 1) {
            o = arguments[0];
            key = me.getKey(o);
        }
        old = me.map[key];
        if (typeof key == 'undefined' || key === null || typeof old == 'undefined') {
             return me.add(key, o);
        }
        me.generation++;
        index = me.indexOfKey(key);
        me.items[index] = o;
        me.map[key] = o;
        if (me.hasListeners.replace) {
            me.fireEvent('replace', key, old, o);
        }
        return o;
    },

    /**
     * Adds all elements of an Array or an Object to the collection.
     * @param {Object/Array} objs An Object containing properties which will be added
     * to the collection, or an Array of values, each of which are added to the collection.
     * Functions references will be added to the collection if `{@link #allowFunctions}`
     * has been set to `true`.
     * @since Ext 1
     */
    addAll : function(objs) {
        var me = this,
            key;

        if (arguments.length > 1 || Ext.isArray(objs)) {
            me.insert(me.length, arguments.length > 1 ? arguments : objs);
        } else {
            for (key in objs) {
                if (objs.hasOwnProperty(key)) {
                    if (me.allowFunctions || typeof objs[key] != 'function') {
                        me.add(key, objs[key]);
                    }
                }
            }
        }
    },

    /**
     * Executes the specified function once for every item in the collection.
     * The function should return a boolean value.
     * Returning false from the function will stop the iteration.
     *
     * @param {Function} fn The function to execute for each item.
     * @param {Mixed} fn.item The collection item.
     * @param {Number} fn.index The index of item.
     * @param {Number} fn.len Total length of collection.
     * @param {Object} scope (optional) The scope (<code>this</code> reference)
     * in which the function is executed. Defaults to the current item in the iteration.
     *
     * @since Ext 1
     */
    each : function(fn, scope){
        var items = Ext.Array.push([], this.items), // each safe for removal
            i = 0,
            len = items.length,
            item;

        for (; i < len; i++) {
            item = items[i];
            if (fn.call(scope || item, item, i, len) === false) {
                break;
            }
        }
    },

    /**
     * Executes the specified function once for every key in the collection, passing each
     * key, and its associated item as the first two parameters.
     * @param {Function} fn The function to execute for each item.
     * @param {String} fn.key The key of collection item.
     * @param {Mixed} fn.item The collection item.
     * @param {Number} fn.index The index of item.
     * @param {Number} fn.len Total length of collection.
     * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the
     * function is executed. Defaults to the browser window.
     *
     * @since Ext 1
     */
    eachKey : function(fn, scope){
        var keys = this.keys,
            items = this.items,
            i = 0,
            len = keys.length;

        for (; i < len; i++) {
            fn.call(scope || window, keys[i], items[i], i, len);
        }
    },

    /**
     * Returns the first item in the collection which elicits a true return value from the
     * passed selection function.
     * @param {Function} fn The selection function to execute for each item.
     * @param {Mixed} fn.item The collection item.
     * @param {String} fn.key The key of collection item.
     * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the
     * function is executed. Defaults to the browser window.
     * @return {Object} The first item in the collection which returned true from the selection
     * function, or null if none was found.
     */
    findBy : function(fn, scope) {
        var keys = this.keys,
            items = this.items,
            i = 0,
            len = items.length;

        for (; i < len; i++) {
            if (fn.call(scope || window, items[i], keys[i])) {
                return items[i];
            }
        }
        return null;
    },

    //<deprecated since="0.99">
    /**
     * Returns the first item in the collection which elicits a true return value from the passed selection function.
     * @deprecated 4.0 Use {@link #findBy} instead.
     * @since Ext 1
     */
    find : function() {
        if (Ext.isDefined(Ext.global.console)) {
            Ext.global.console.warn('Ext.util.MixedCollection: find has been deprecated. Use findBy instead.');
        }
        return this.findBy.apply(this, arguments);
    },
    //</deprecated>

    /**
     * Inserts an item at the specified index in the collection. Fires the {@link #event-add} event when complete.
     * @param {Number} index The index to insert the item at.
     * @param {String/Object/String[]/Object[]} key The key to associate with the new item, or the item itself.
     * May also be an array of either to insert multiple items at once.
     * @param {Object/Object[]} o (optional) If the second parameter was a key, the new item.
     * May also be an array to insert multiple items at once.
     * @return {Object} The item inserted or an array of items inserted.
     * @since Ext 1
     */
    insert : function(index, key, obj) {
        if (Ext.isIterable(key)) {
            return this.doInsert(index, key, obj);
        }
        return (obj ? this.doInsert(index, [key], [obj]) : this.doInsert(index, [key]))[0];
    },
 
    // Private multi insert implementation.
    doInsert : function(index, keys, objects) {
        var me = this,
            itemKey,
            removeIndex,
            i, len = keys.length,
            fireAdd = me.hasListeners.add,
            syncIndices;

        // Calculate keys array if not passed
        if (objects == null) {
            objects = keys;
            keys = new Array(len);
            for (i = 0; i < len; i++) {
                keys[i] = this.getKey(objects[i]);
            }
        }

        // First, remove duplicates of the keys. If a removal point is less than insertion index, decr insertion index
        me.suspendEvents();
        for (i = 0; i < len; i++) {
            // Must use indexOf - map might be out of sync
            removeIndex = me.indexOfKey(keys[i]);
            if (removeIndex !== -1) {
                if (removeIndex < index) {
                    index--;
                }
                me.removeAt(removeIndex);
            }
        }
        me.resumeEvents();

        // If we are appending and the indices are in sync, its cheap to kep them that way
        syncIndices = index === me.length && me.indexGeneration === me.generation;

        // Insert the new items and new keys in at the insertion point
        Ext.Array.insert(me.items, index, objects);
        Ext.Array.insert(me.keys,  index, keys);
        me.length += len;
        me.generation++;
        if (syncIndices) {
            me.indexGeneration = me.generation;
        }
        for (i = 0; i < len; i++, index++) {
            itemKey = keys[i];
            if (itemKey != null) {
                me.map[itemKey] = objects[i];

                // If the index is still in sync, keep it that way
                if (syncIndices) {
                    me.indexMap[itemKey] = index;
                }
            }
            if (fireAdd) {
                me.fireEvent('add', index, objects[i], itemKey);
            }
        }
        return objects;
    },

    /**
     * Remove an item from the collection.
     * @param {Object} o The item to remove.
     * @return {Object} The item removed or false if no item was removed.
     * @since Ext 1
     */
    remove : function(o) {
        var me = this,
            removeKey,
            index;
        
        // If the indexMap is up to date, then attempt to extract the key to
        // look for in the indexMap.
        // If the object yields a key, we can find its index quickly in the indexMap
        // Note that the getKey is only called if the indexMap is in sync
        if (me.indexGeneration === me.generation && (removeKey = me.getKey(o))) {
            index = me.indexMap[removeKey];
        }

        // Otherwise we have to do it the slow way with a lniear search
        else {
            index = Ext.Array.indexOf(me.items, o);
        }

        return (index === -1) ? false : me.removeAt(index);
    },

    /**
     * Remove all items in the collection. Can also be used
     * to remove only the items in the passed array.
     * @param {Array} [items] An array of items to be removed.
     * @return {Ext.util.MixedCollection} this object
     */
    removeAll : function(items) {
        var me = this, 
            i;

        if (items || me.hasListeners.remove) {
            // Only perform expensive item-by-item removal if there's a listener or specific items
            if (items) {
                for (i = items.length - 1; i >= 0; --i) {
                    me.remove(items[i]);
                }
            } else {
                while (me.length) {
                    me.removeAt(0);
                }
            }
        } else {
            me.length = me.items.length = me.keys.length = 0;
            me.map = {};
            me.indexMap = {};
            me.generation++;
            me.indexGeneration = me.generation;
        }
    },

    /**
     * Remove an item or multiple items starting at a specified index in the collection.
     * Fires the {@link #event-remove} for each item removed.
     * @param {Number} index The index within the collection of the item to remove.
     * @param {Number} [removeCount=1] The nuber of items to remove beginning at the specified index.
     * @return {Object} The last item removed or false if no item was removed.
     * @since Ext 1
     */
    removeAt : function(index, removeCount) {
        var me = this,
            o,
            key,
            i,
            limit,
            fireRemove = me.hasListeners.remove,
            syncIndices,
            trimming;

        if (index < me.length && index >= 0) {
            if (!removeCount) {
                removeCount = 1;
            }
            limit = Math.min(index + removeCount, me.length);

            // If we are removing from end and the indices are in sync, its cheap to kep them that way
            trimming = limit === me.length;
            syncIndices = trimming && me.indexGeneration === me.generation;

            // Loop through the to remove indices deleting from the key hashes
            for (i = index; i < limit; i++) {
                key = me.keys[i];
                if (key != null) {
                    delete me.map[key];
                    if (syncIndices) {
                        delete me.indexMap[key];
                    }
                }
                // Fire the event if anybody is interested
                if (fireRemove) {
                    me.fireEvent('remove', me.items[i], key);
                }
            }
            // Last item encountered
            o = me.items[i - 1];
            
            me.length -= removeCount;
            me.generation++;
            if (syncIndices) {
                me.indexGeneration = me.generation;
            }

            // Chop items and keys arrays.
            // If trimming the trailing end, we can just truncate the array.
            // We can use splice directly. The IE8 bug which Ext.Array works around only affects *insertion*
            // http://social.msdn.microsoft.com/Forums/en-US/iewebdevelopment/thread/6e946d03-e09f-4b22-a4dd-cd5e276bf05a/
            if (trimming) {
                me.items.length = me.keys.length = me.length;
            } else {
                me.items.splice(index, removeCount);
                me.keys.splice(index, removeCount);
            }

            // Return last object removed
            return o;
        }
        return false;
    },

    /**
     * Removed an item associated with the passed key fom the collection.
     * @param {String} key The key of the item to remove.
     * @return {Object} The item removed or false if no item was removed.
     */
    removeAtKey : function(key) {
        return this.removeAt(this.indexOfKey(key));
    },

    /**
     * Returns the number of items in the collection.
     * @return {Number} the number of items in the collection.
     * @since Ext 1
     */
    getCount : function() {
        return this.length;
    },

    /**
     * Returns index within the collection of the passed Object.
     * @param {Object} o The item to find the index of.
     * @return {Number} index of the item. Returns -1 if not found.
     * @since Ext 1
     */
    indexOf : function(o) {
        return o ? this.indexOfKey(this.getKey(o)) : -1;
    },

    /**
     * Returns index within the collection of the passed key.
     * @param {String} key The key to find the index of.
     * @return {Number} index of the key.
     * @since Ext 1
     */
    indexOfKey : function(key) {
        if (this.map[key] == null) {
            return -1;
        }
        if (this.indexGeneration !== this.generation) {
            this.rebuildIndexMap();
        }
        return this.indexMap[key];
    },
    
    rebuildIndexMap: function() {
        var me = this,
            indexMap = me.indexMap = {},
            keys = this.keys,
            len = keys.length,
            i;

        for (i = 0; i < len; i++) {
            indexMap[keys[i]] = i;
        }
        me.indexGeneration = me.generation;
    },

    /**
     * Returns the item associated with the passed key OR index.
     * Key has priority over index.  This is the equivalent
     * of calling {@link #getByKey} first, then if nothing matched calling {@link #getAt}.
     * @param {String/Number} key The key or index of the item.
     * @return {Object} If the item is found, returns the item.  If the item was not found, returns <code>undefined</code>.
     * If an item was found, but is a Class, returns <code>null</code>.
     * @since Ext 1
     */
    get : function(key) {
        var me = this,
            mk = me.map[key],
            item = mk !== undefined ? mk : (typeof key == 'number') ? me.items[key] : undefined;
        return typeof item != 'function' || me.allowFunctions ? item : null; // for prototype!
    },

    /**
     * Returns the item at the specified index.
     * @param {Number} index The index of the item.
     * @return {Object} The item at the specified index.
     */
    getAt : function(index) {
        return this.items[index];
    },

    /**
     * Returns the item associated with the passed key.
     * @param {String/Number} key The key of the item.
     * @return {Object} The item associated with the passed key.
     */
    getByKey : function(key) {
        return this.map[key];
    },

    /**
     * Returns true if the collection contains the passed Object as an item.
     * @param {Object} o  The Object to look for in the collection.
     * @return {Boolean} True if the collection contains the Object as an item.
     * @since Ext 1
     */
    contains : function(o) {
        return this.map[this.getKey(o)] != null;
    },

    /**
     * Returns true if the collection contains the passed Object as a key.
     * @param {String} key The key to look for in the collection.
     * @return {Boolean} True if the collection contains the Object as a key.
     * @since Ext 1
     */
    containsKey : function(key) {
        return this.map[key] != null;
    },

    /**
     * Removes all items from the collection.  Fires the {@link #event-clear} event when complete.
     * @since Ext 1
     */
    clear : function() {
        var me = this;

        me.length = 0;
        me.items = [];
        me.keys = [];
        me.map = {};
        me.indexMap = {};

        me.generation++;
        me.indexGeneration = me.generation;
        if (me.hasListeners.clear) {
            me.fireEvent('clear');
        }
    },

    /**
     * Returns the first item in the collection.
     * @return {Object} the first item in the collection..
     * @since Ext 1
     */
    first : function() {
        return this.items[0];
    },

    /**
     * Returns the last item in the collection.
     * @return {Object} the last item in the collection..
     * @since Ext 1
     */
    last : function() {
        return this.items[this.length - 1];
    },

    /**
     * Collects all of the values of the given property and returns their sum
     * @param {String} property The property to sum by
     * @param {String} [root] 'root' property to extract the first argument from. This is used mainly when
     * summing fields in records, where the fields are all stored inside the 'data' object
     * @param {Number} [start=0] The record index to start at
     * @param {Number} [end=-1] The record index to end at
     * @return {Number} The total
     */
    sum: function(property, root, start, end) {
        var values = this.extractValues(property, root),
            length = values.length,
            sum    = 0,
            i;

        start = start || 0;
        end   = (end || end === 0) ? end : length - 1;

        for (i = start; i <= end; i++) {
            sum += values[i];
        }

        return sum;
    },

    /**
     * Collects unique values of a particular property in this MixedCollection
     * @param {String} property The property to collect on
     * @param {String} root (optional) 'root' property to extract the first argument from. This is used mainly when
     * summing fields in records, where the fields are all stored inside the 'data' object
     * @param {Boolean} allowBlank (optional) Pass true to allow null, undefined or empty string values
     * @return {Array} The unique values
     */
    collect: function(property, root, allowNull) {
        var values = this.extractValues(property, root),
            length = values.length,
            hits   = {},
            unique = [],
            value, strValue, i;

        for (i = 0; i < length; i++) {
            value = values[i];
            strValue = String(value);

            if ((allowNull || !Ext.isEmpty(value)) && !hits[strValue]) {
                hits[strValue] = true;
                unique.push(value);
            }
        }

        return unique;
    },

    /**
     * @private
     * Extracts all of the given property values from the items in the MC. Mainly used as a supporting method for
     * functions like sum and collect.
     * @param {String} property The property to extract
     * @param {String} root (optional) 'root' property to extract the first argument from. This is used mainly when
     * extracting field data from Model instances, where the fields are stored inside the 'data' object
     * @return {Array} The extracted values
     */
    extractValues: function(property, root) {
        var values = this.items;

        if (root) {
            values = Ext.Array.pluck(values, root);
        }

        return Ext.Array.pluck(values, property);
    },

    /**
     * @private
     * For API parity with Store's PageMap class. Buffered rendering checks if the Store has the range
     * required to render. The Store delegates this question to its backing data object which may be an instance
     * of its private PageMap class, or a MixedCollection.
     */
    hasRange: function(start, end) {
        return (end < this.length);
    },

    /**
     * Returns a range of items in this collection
     * @param {Number} startIndex (optional) The starting index. Defaults to 0.
     * @param {Number} endIndex (optional) The ending index. Defaults to the last item.
     * @return {Array} An array of items
     * @since Ext 1
     */
    getRange : function(start, end){
        var me = this,
            items = me.items,
            range = [],
            i;

        if (items.length < 1) {
            return range;
        }

        start = start || 0;
        end = Math.min(end == null ? me.length - 1 : end, me.length - 1);
        if (start <= end) {
            return items.slice(start, end + 1);
        } else {
            for (i = start; i >= end; i--) {
                range[range.length] = items[i];
            }
        }
        return range;
    },

    /**
     * <p>Filters the objects in this collection by a set of {@link Ext.util.Filter Filter}s, or by a single
     * property/value pair with optional parameters for substring matching and case sensitivity. See
     * {@link Ext.util.Filter Filter} for an example of using Filter objects (preferred). Alternatively,
     * MixedCollection can be easily filtered by property like this:</p>
     *
     *    //create a simple store with a few people defined
     *    var people = new Ext.util.MixedCollection();
     *    people.addAll([
     *        {id: 1, age: 25, name: 'Ed'},
     *        {id: 2, age: 24, name: 'Tommy'},
     *        {id: 3, age: 24, name: 'Arne'},
     *        {id: 4, age: 26, name: 'Aaron'}
     *    ]);
     *    
     *    //a new MixedCollection containing only the items where age == 24
     *    var middleAged = people.filter('age', 24);
     *
     * @param {Ext.util.Filter[]/String} property A property on your objects, or an array of {@link Ext.util.Filter Filter} objects
     * @param {String/RegExp} value Either string that the property values
     * should start with or a RegExp to test against the property
     * @param {Boolean} [anyMatch=false] True to match any part of the string, not just the beginning
     * @param {Boolean} [caseSensitive=false] True for case sensitive comparison.
     * @return {Ext.util.MixedCollection} The new filtered collection
     * @since Ext 1
     */
    filter : function(property, value, anyMatch, caseSensitive) {
        var filters = [];

        //support for the simple case of filtering by property/value
        if (Ext.isString(property)) {
            filters.push(new Ext.util.Filter({
                property     : property,
                value        : value,
                anyMatch     : anyMatch,
                caseSensitive: caseSensitive
            }));
        } else if (Ext.isArray(property) || property instanceof Ext.util.Filter) {
            filters = filters.concat(property);
        }

        // At this point we have an array of zero or more Ext.util.Filter objects to filter with,
        // so here we construct a function that combines these filters by ANDing them together
        // and filter by that.
        return this.filterBy(Ext.util.Filter.createFilterFn(filters));
    },

    /**
     * Filter by a function. Returns a <i>new</i> collection that has been filtered.
     * The passed function will be called with each object in the collection.
     * If the function returns true, the value is included otherwise it is filtered.
     * @param {Function} fn The function to be called.
     * @param {Mixed} fn.item The collection item.
     * @param {String} fn.key The key of collection item.
     * @param {Object} scope (optional) The scope (<code>this</code> reference) in
     * which the function is executed. Defaults to this MixedCollection.
     * @return {Ext.util.MixedCollection} The new filtered collection
     * @since Ext 1
     */
    filterBy : function(fn, scope) {
        var me = this,
            newMC  = new this.self(),
            keys   = me.keys,
            items  = me.items,
            length = items.length,
            i;

        newMC.getKey = me.getKey;

        for (i = 0; i < length; i++) {
            if (fn.call(scope || me, items[i], keys[i])) {
                newMC.add(keys[i], items[i]);
            }
        }

        return newMC;
    },

    /**
     * Finds the index of the first matching object in this collection by a specific property/value.
     * @param {String} property The name of a property on your objects.
     * @param {String/RegExp} value A string that the property values
     * should start with or a RegExp to test against the property.
     * @param {Number} [start=0] The index to start searching at.
     * @param {Boolean} [anyMatch=false] True to match any part of the string, not just the beginning.
     * @param {Boolean} [caseSensitive=false] True for case sensitive comparison.
     * @return {Number} The matched index or -1
     * @since Ext 2
     */
    findIndex : function(property, value, start, anyMatch, caseSensitive){
        if(Ext.isEmpty(value, false)){
            return -1;
        }
        value = this.createValueMatcher(value, anyMatch, caseSensitive);
        return this.findIndexBy(function(o){
            return o && value.test(o[property]);
        }, null, start);
    },

    /**
     * Find the index of the first matching object in this collection by a function.
     * If the function returns <i>true</i> it is considered a match.
     * @param {Function} fn The function to be called.
     * @param {Mixed} fn.item The collection item.
     * @param {String} fn.key The key of collection item.
     * @param {Object} [scope] The scope (<code>this</code> reference) in which the function is executed. Defaults to this MixedCollection.
     * @param {Number} [start=0] The index to start searching at.
     * @return {Number} The matched index or -1
     * @since Ext 2
     */
    findIndexBy : function(fn, scope, start){
        var me = this,
            keys = me.keys,
            items = me.items,
            i = start || 0,
            len = items.length;

        for (; i < len; i++) {
            if (fn.call(scope || me, items[i], keys[i])) {
                return i;
            }
        }
        return -1;
    },

    /**
     * Returns a regular expression based on the given value and matching options. This is used internally for finding and filtering,
     * and by Ext.data.Store#filter
     * @private
     * @param {String} value The value to create the regex for. This is escaped using Ext.escapeRe
     * @param {Boolean} anyMatch True to allow any match - no regex start/end line anchors will be added. Defaults to false
     * @param {Boolean} caseSensitive True to make the regex case sensitive (adds 'i' switch to regex). Defaults to false.
     * @param {Boolean} exactMatch True to force exact match (^ and $ characters added to the regex). Defaults to false. Ignored if anyMatch is true.
     * @since Ext 3
     */
    createValueMatcher : function(value, anyMatch, caseSensitive, exactMatch) {
        if (!value.exec) { // not a regex
            var er = Ext.String.escapeRegex;
            value = String(value);

            if (anyMatch === true) {
                value = er(value);
            } else {
                value = '^' + er(value);
                if (exactMatch === true) {
                    value += '$';
                }
            }
            value = new RegExp(value, caseSensitive ? '' : 'i');
        }
        return value;
    },

    /**
     * Creates a shallow copy of this collection
     * @return {Ext.util.MixedCollection}
     * @since Ext 1
     */
    clone : function() {
        var me = this,
            copy = new this.self(me.initialConfig);

        copy.add(me.keys, me.items);
        return copy;
    }
});
