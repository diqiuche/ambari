/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var computed = Em.computed;
var get = Em.get;
var makeArray = Em.makeArray;

var dataUtils = require('utils/data_manipulation');

function getProperties(self, propertyNames) {
  var ret = {};
  for (var i = 0; i < propertyNames.length; i++) {
    ret[propertyNames[i]] = get(self, propertyNames[i]);
  }
  return ret;
}

function generateComputedWithProperties(macro) {
  return function () {
    var properties = [].slice.call(arguments);
    var computedFunc = computed(function () {
      return macro.apply(this, [getProperties(this, properties)]);
    });

    return computedFunc.property.apply(computedFunc, properties);
  };
}

/**
 *
 * A computed property that returns true if the provided dependent property
 * is equal to the given value.
 * Example*
 * ```javascript
 * var Hamster = Ember.Object.extend({
 *    napTime: Ember.computed.equal('state', 'sleepy')
 *  });
 * var hamster = Hamster.create();
 * hamster.get('napTime'); // false
 * hamster.set('state', 'sleepy');
 * hamster.get('napTime'); // true
 * hamster.set('state', 'hungry');
 * hamster.get('napTime'); // false
 * ```
 * @method equal
 * @param {String} dependentKey
 * @param {String|Number|Object} value
 * @return {Ember.ComputedProperty} computed property which returns true if
 * the original value for property is equal to the given value.
 * @public
 */
computed.equal = function (dependentKey, value) {
  return computed(dependentKey, function () {
    return get(this, dependentKey) === value;
  }).cacheable();
};

/**
 * A computed property that returns true if the provided dependent property is not equal to the given value
 *
 * @method notEqual
 * @param {string} dependentKey
 * @param {*} value
 * @returns {Ember.ComputedProperty}
 */
computed.notEqual = function (dependentKey, value) {
  return computed(dependentKey, function () {
    return get(this, dependentKey) !== value;
  });
};

/**
 * A computed property that returns true if provided dependent properties are equal to the each other
 *
 * @method equalProperties
 * @param {string} dependentKey1
 * @param {string} dependentKey2
 * @returns {Ember.ComputedProperty}
 */
computed.equalProperties = function (dependentKey1, dependentKey2) {
  return computed(dependentKey1, dependentKey2, function () {
    return get(this, dependentKey1) === get(this, dependentKey2);
  });
};

/**
 * A computed property that returns true if provided dependent properties are not equal to the each other
 *
 * @method notEqualProperties
 * @param {string} dependentKey1
 * @param {string} dependentKey2
 * @returns {Ember.ComputedProperty}
 */
computed.notEqualProperties = function (dependentKey1, dependentKey2) {
  return computed(dependentKey1, dependentKey2, function () {
    return get(this, dependentKey1) !== get(this, dependentKey2);
  });
};

/**
 * A computed property that returns grouped collection's items by propertyName-value
 *
 * @method groupBy
 * @param {string} collectionKey
 * @param {string} propertyName
 * @returns {Ember.ComputedProperty}
 */
computed.groupBy = function (collectionKey, propertyName) {
  return computed(collectionKey + '.@each.' + propertyName, function () {
    var collection = get(this, collectionKey);
    return dataUtils.groupPropertyValues(collection, propertyName);
  });
};

/**
 * A computed property that returns filtered collection by propertyName values-list
 * Wrapper to filterProperty-method that allows using list of values to filter
 *
 * @method filterByMany
 * @param {string} collectionKey
 * @param {string} propertyName
 * @param {array} valuesToFilter
 * @returns {Ember.ComputedProperty}
 */
computed.filterByMany = function (collectionKey, propertyName, valuesToFilter) {
  return computed(collectionKey + '.@each.' + propertyName, function () {
    var collection = get(this, collectionKey);
    return dataUtils.filterPropertyValues(collection, propertyName, makeArray(valuesToFilter));
  });
};

/**
 * A computed property that returns collection without elements with value that is in <code>valuesToReject</code>
 * Exclude objects from <code>collection</code> if its <code>key</code> exist in <code>valuesToReject</code>
 *
 * @method rejectMany
 * @param {string} collectionKey
 * @param {string} propertyName
 * @param {array} valuesToReject
 * @returns {Ember.ComputedProperty}
 */
computed.rejectMany = function (collectionKey, propertyName, valuesToReject) {
  return computed(collectionKey + '.@each.' + propertyName, function () {
    var collection = get(this, collectionKey);
    return dataUtils.rejectPropertyValues(collection, propertyName, makeArray(valuesToReject));
  });
};

/**
 * A computed property that returns trueValue if dependent value is true and falseValue otherwise
 *
 * @method ifThenElse
 * @param {string} dependentKey
 * @param {*} trueValue
 * @param {*} falseValue
 * @returns {Ember.ComputedProperty}
 */
computed.ifThenElse = function (dependentKey, trueValue, falseValue) {
  return computed(dependentKey, function () {
    return get(this, dependentKey) ? trueValue : falseValue;
  });
};

/**
 * A computed property that is equal to the logical 'and'
 * Takes any number of arguments
 * Returns true if all of them are truly, false - otherwise
 *
 * @method and
 * @returns {Ember.ComputedProperty}
 */
computed.and = generateComputedWithProperties(function (properties) {
  var value;
  for (var key in properties) {
    value = properties[key];
    if (properties.hasOwnProperty(key) && !value) {
      return false;
    }
  }
  return value;
});

/**
 * A computed property that is equal to the logical 'or'
 * Takes any number of arguments
 * Returns true if at least one of them is truly, false - otherwise
 *
 * @method or
 * @returns {Ember.ComputedProperty}
 */
computed.or = generateComputedWithProperties(function (properties) {
  var value;
  for (var key in properties) {
    value = properties[key];
    if (properties.hasOwnProperty(key) && value) {
      return value;
    }
  }
  return value;
});

/**
 * A computed property that returns sum on the dependent properties values
 * Takes any number of arguments
 *
 * @method sumProperties
 * @returns {Ember.ComputedProperty}
 */
computed.sumProperties = generateComputedWithProperties(function (properties) {
  var sum = 0;
  for (var key in properties) {
    if (properties.hasOwnProperty(key)) {
      sum += properties[key];
    }
  }
  return sum;
});

/**
 * A computed property that returns true if dependent value is greater or equal to the needed value
 *
 * @method gte
 * @param {string} dependentKey
 * @param {*} value
 * @returns {Ember.ComputedProperty}
 */
computed.gte = function (dependentKey, value) {
  return computed(dependentKey, function () {
    return get(this, dependentKey) >= value;
  });
};

/**
 * A computed property that returns true if first dependent property is greater or equal to the second dependent property
 *
 * @method gteProperties
 * @param {string} dependentKey1
 * @param {string} dependentKey2
 * @returns {Ember.ComputedProperty}
 */
computed.gteProperties = function (dependentKey1, dependentKey2) {
  return computed(dependentKey1, dependentKey2, function () {
    return get(this, dependentKey1) >= get(this, dependentKey2);
  });
};

/**
 * A computed property that returns true if dependent property is less or equal to the needed value
 *
 * @method lte
 * @param {string} dependentKey
 * @param {*} value
 * @returns {Ember.ComputedProperty}
 */
computed.lte = function (dependentKey, value) {
  return computed(dependentKey, function () {
    return get(this, dependentKey) <= value;
  });
};

/**
 * A computed property that returns true if first dependent property is less or equal to the second dependent property
 *
 * @method lteProperties
 * @param {string} dependentKey1
 * @param {string} dependentKey2
 * @returns {Ember.ComputedProperty}
 */
computed.lteProperties = function (dependentKey1, dependentKey2) {
  return computed(dependentKey1, dependentKey2, function () {
    return get(this, dependentKey1) <= get(this, dependentKey2);
  });
};

/**
 * A computed property that returns true if dependent value is greater than the needed value
 *
 * @method gt
 * @param {string} dependentKey
 * @param {*} value
 * @returns {Ember.ComputedProperty}
 */
computed.gt = function (dependentKey, value) {
  return computed(dependentKey, function () {
    return get(this, dependentKey) > value;
  });
};

/**
 * A computed property that returns true if first dependent property is greater than the second dependent property
 *
 * @method gtProperties
 * @param {string} dependentKey1
 * @param {string} dependentKey2
 * @returns {Ember.ComputedProperty}
 */
computed.gtProperties = function (dependentKey1, dependentKey2) {
  return computed(dependentKey1, dependentKey2, function () {
    return get(this, dependentKey1) > get(this, dependentKey2);
  });
};

/**
 * A computed property that returns true if dependent value is less than the needed value
 *
 * @method lt
 * @param {string} dependentKey
 * @param {*} value
 * @returns {Ember.ComputedProperty}
 */
computed.lt = function (dependentKey, value) {
  return computed(dependentKey, function () {
    return get(this, dependentKey) < value;
  });
};

/**
 * A computed property that returns true if first dependent property is less than the second dependent property
 *
 * @method gtProperties
 * @param {string} dependentKey1
 * @param {string} dependentKey2
 * @returns {Ember.ComputedProperty}
 */
computed.ltProperties = function (dependentKey1, dependentKey2) {
  return computed(dependentKey1, dependentKey2, function () {
    return get(this, dependentKey1) < get(this, dependentKey2);
  });
};

/**
 * A computed property that returns true if dependent property is match to the needed regular expression
 *
 * @method match
 * @param {string} dependentKey
 * @param {RegExp} regexp
 * @returns {Ember.ComputedProperty}
 */
computed.match = function (dependentKey, regexp) {
  return computed(dependentKey, function () {
    var value = get(this, dependentKey);
    return regexp.test(value);
  });
};

/**
 * A computed property that returns true of some collection's item has property with needed value
 *
 * @method someBy
 * @param {string} collectionKey
 * @param {string} propertyName
 * @param {*} neededValue
 * @returns {Ember.ComputedProperty}
 */
computed.someBy = function (collectionKey, propertyName, neededValue) {
  return computed(collectionKey + '.@each.' + propertyName, function () {
    return get(this, collectionKey).someProperty(propertyName, neededValue);
  });
};

/**
 * A computed property that returns true of all collection's items have property with needed value
 *
 * @method everyBy
 * @param {string} collectionKey
 * @param {string} propertyName
 * @param {*} neededValue
 * @returns {Ember.ComputedProperty}
 */
computed.everyBy = function (collectionKey, propertyName, neededValue) {
  return computed(collectionKey + '.@each.' + propertyName, function () {
    return get(this, collectionKey).everyProperty(propertyName, neededValue);
  });
};

/**
 * A computed property that returns array with values of named property on all items in the collection
 *
 * @method mapBy
 * @param {string} collectionKey
 * @param {string} propertyName
 * @returns {Ember.ComputedProperty}
 */
computed.mapBy = function (collectionKey, propertyName) {
  return computed(collectionKey + '.@each.' + propertyName, function () {
    return get(this, collectionKey).mapProperty(propertyName);
  });
};

/**
 * A computed property that returns array with collection's items that have needed property value
 *
 * @method filterBy
 * @param {string} collectionKey
 * @param {string} propertyName
 * @param {*} neededValue
 * @returns {Ember.ComputedProperty}
 */
computed.filterBy = function (collectionKey, propertyName, neededValue) {
  return computed(collectionKey + '.@each.' + propertyName, function () {
    return get(this, collectionKey).filterProperty(propertyName, neededValue);
  });
};

/**
 * A computed property that returns first collection's item that has needed property value
 *
 * @method findBy
 * @param {string} collectionKey
 * @param {string} propertyName
 * @param {*} neededValue
 * @returns {Ember.ComputedProperty}
 */
computed.findBy = function (collectionKey, propertyName, neededValue) {
  return computed(collectionKey + '.@each.' + propertyName, function () {
    return get(this, collectionKey).findProperty(propertyName, neededValue);
  });
};

/**
 * A computed property that returns value equal to the dependent
 * Should be used as 'short-name' for deeply-nested values
 *
 * @method alias
 * @param {string} dependentKey
 * @returns {Ember.ComputedProperty}
 */
computed.alias = function (dependentKey) {
  return computed(dependentKey, function () {
    return get(this, dependentKey);
  })
};

/**
 * A computed property that returns true if dependent property exists in the needed values
 *
 * @method existsIn
 * @param {string} dependentKey
 * @param {array} neededValues
 * @returns {Ember.ComputedProperty}
 */
computed.existsIn = function (dependentKey, neededValues) {
  return computed(dependentKey, function () {
    var value = get(this, dependentKey);
    return makeArray(neededValues).contains(value);
  })
};