Custom.utils.ObjectIron = function (map) {

    var lookup;

    // create a list of top level items to search for
    lookup = [];
    for (var i = 0, len = map.length; i < len; i += 1) {
        if (map[i].isRoot) {
            lookup.push("root");
        } else {
            lookup.push(map[i].name);
        }
    }

    var mergeValues = function (parentItem, childItem) {
            var name;
            if (parentItem === null || childItem === null) {
                return;
            }

            for (name in parentItem) {
                if (parentItem.hasOwnProperty(name)) {
                    if (!childItem.hasOwnProperty(name)) {
                        childItem[name] = parentItem[name];
                    }
                }
            }
        },

        mapProperties = function (properties, parent, child) {
            var i,
                len,
                property,
                parentValue,
                childValue;

            if (properties === null || properties.length === 0) {
                return;
            }

            for (i = 0, len = properties.length; i < len; i += 1) {
                property = properties[i];

                if (parent.hasOwnProperty(property.name)) {
                    if (child.hasOwnProperty(property.name)) {
                        // check to see if we should merge
                        if (property.merge) {
                           parentValue = parent[property.name];
                           childValue = child[property.name];

                            // complex objects; merge properties
                            if (typeof parentValue === 'object' && typeof childValue === 'object') {
                                mergeValues(parentValue, childValue);
                            }
                            // simple objects; merge them together
                            else {
                                if (property.mergeFunction != null) {
                                    child[property.name] = property.mergeFunction(parentValue, childValue);
                                } else {
                                    child[property.name] = parentValue + childValue;
                                }
                            }
                        }
                    } else {
                        // just add the property
                        child[property.name] = parent[property.name];
                    }
                }
            }
        },

        mapItem = function (obj, node) {
            var item = obj,
                i,
                len,
                v,
                len2,
                array,
                childItem,
                childNode;

            if (obj.transformFunc) {
                node = obj.transformFunc(node);
            }

            if (item.children === null || item.children.length === 0) {
                return node;
            }

            for (i = 0, len = item.children.length; i < len; i += 1) {
                childItem = item.children[i];
                var itemMapped = null;
                if (node.hasOwnProperty(childItem.name)) {
                    if (childItem.isArray) {
                        array = node[childItem.name + "_asArray"];
                        for (v = 0, len2 = array.length; v < len2; v += 1) {
                            childNode = array[v];
                            mapProperties(item.properties, node, childNode);
                            //copy result in source object
                            itemMapped = mapItem(childItem, childNode);
                            node[childItem.name + "_asArray"][v] = itemMapped;
                            node[childItem.name][v] =  itemMapped;
                        }
                    } else {
                        childNode = node[childItem.name];
                        mapProperties(item.properties, node, childNode);
                        //copy result in source object
                        itemMapped = mapItem(childItem, childNode);
                        node[childItem.name] = itemMapped;
                        node[childItem.name + "_asArray"] =  [itemMapped];
                    }
                }
            }
            return node;
        },

        performMapping = function (source) {
            var i,
                len,
                pi,
                pp,
                item,
                node,
                array;

            if (source === null) {
                return source;
            }

            if (typeof source !== 'object') {
                return source;
            }

            // first look to see if anything cares about the root node
            for (i = 0, len = lookup.length; i < len; i += 1) {
                if (lookup[i] === "root") {
                    item = map[i];
                    node = source;
                    source = mapItem(item, node);
                    // node == source;
                }
            }

            // iterate over the objects and look for any of the items we care about
            for (pp in source) {
                if (source.hasOwnProperty(pp)) {
                    pi = lookup.indexOf(pp);
                    if (pi !== -1) {
                        item = map[pi];

                        if (item.isArray) {
                            array = source[pp + "_asArray"];
                            for (i = 0, len = array.length; i < len; i += 1) {
                                node = array[i];
                                source[pp][i] = mapItem(item, node);
                                source[pp + "_asArray"][i] = mapItem(item, node);
                            }
                        } else {
                            node = source[pp];
                            source[pp] = mapItem(item, node);
                            source[pp + "_asArray"] = [mapItem(item, node)];
                        }
                    }
                    // now check this to see if he has any of the properties we care about
                    source[pp] = performMapping(source[pp]);
                }
            }

            return source;
        };

    return {
        run: performMapping
    };
};