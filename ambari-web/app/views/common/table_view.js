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

var App = require('app');
var filters = require('views/common/filter_view');

App.TableView = Em.View.extend(App.UserPref, {

  init: function() {
    this.set('filterConditions', []);
    this._super();
  },

  /**
   * Defines to show pagination or show all records
   * @type {Boolean}
   */
  pagination: true,

  /**
   * Shows if all data is loaded and filtered
   * @type {Boolean}
   */
  filteringComplete: false,

  /**
   * intermediary for filteringComplete
   * @type {Boolean}
   */
  tableFilteringComplete: false,

  /**
   * The number of rows to show on every page
   * The value should be a number converted into string type in order to support select element API
   * Example: "10", "25"
   * @type {String}
   */
  displayLength: null,

  /**
   * default value of display length
   * The value should be a number converted into string type in order to support select element API
   * Example: "10", "25"
   */
  defaultDisplayLength: "10",

  /**
   * number of items in table after applying filters
   */
  filteredCount: Em.computed.alias('filteredContent.length'),

  /**
   * total number of items in table before applying filters
   */
  totalCount: Em.computed.alias('content.length'),

  /**
   * Do filtering, using saved in the local storage filter conditions
   */
  willInsertElement: function () {
    var self = this;
    var name = this.get('controller.name');
    if (!this.get('displayLength') && this.get('state') !== "inBuffer") {
      if (App.db.getDisplayLength(name)) {
        self.set('displayLength', App.db.getDisplayLength(name));
        Em.run.next(function () {
          self.initFilters();
        });
      } else {
        if (!$.mocho) {
          this.getUserPref(this.displayLengthKey()).complete(function () {
            self.initFilters();
          });
        }
      }
    }
  },

  /**
   * initialize filters
   * restore values from local DB
   * or clear filters in case there is no filters to restore
   */
  initFilters: function () {
    var name = this.get('controller.name');
    var self = this;
    var filterConditions = App.db.getFilterConditions(name);
    if (!Em.isEmpty(filterConditions)) {
      this.set('filterConditions', filterConditions);

      var childViews = this.get('childViews');

      filterConditions.forEach(function (condition, index, filteredConditions) {
        var view = !Em.isNone(condition.iColumn) && childViews.findProperty('column', condition.iColumn);
        if (view) {
          if (view.get('emptyValue')) {
            view.clearFilter();
            self.saveFilterConditions(condition.iColumn, view.get('appliedEmptyValue'), condition.type, false);
          } else {
            view.setValue(condition.value);
          }
          Em.run.next(function () {
            view.showClearFilter();
            // check if it is the last iteration
            if (filteredConditions.length - index - 1 === 0) {
              self.set('tableFilteringComplete', true);
            }
          });
        }
      });
    } else {
      this.set('tableFilteringComplete', true);
    }
  },

  /**
   * Persist-key of current table displayLength property
   * @param {String} loginName current user login name
   * @returns {String}
   */
  displayLengthKey: function (loginName) {
    if (App.get('testMode')) {
      return 'pagination_displayLength';
    }
    loginName = loginName ? loginName : App.router.get('loginName');
    return this.get('controller.name') + '-pagination-displayLength-' + loginName;
  },

  /**
   * Set received from server value to <code>displayLengthOnLoad</code>
   * @param {Number} response
   * @param {Object} request
   * @param {Object} data
   * @returns {*}
   */
  getUserPrefSuccessCallback: function (response, request, data) {
    this.set('displayLength', response);
    return response;
  },

  /**
   * Set default value to <code>displayLength</code> (and send it on server) if value wasn't found on server
   * @returns {Number}
   */
  getUserPrefErrorCallback: function () {
    // this user is first time login
    var displayLengthDefault = this.get('defaultDisplayLength');
    this.set('displayLength', displayLengthDefault);
    if (App.isAccessible('upgrade_ADMIN')) {
      this.saveDisplayLength();
    }
    this.filter();
    return displayLengthDefault;
  },

  /**
   * Return pagination information displayed on the page
   * @type {String}
   */
  paginationInfo: function () {
    return this.t('tableView.filters.paginationInfo').format(this.get('startIndex'), this.get('endIndex'), this.get('filteredCount'));
  }.property('filteredCount', 'endIndex'),

  paginationLeft: Ember.View.extend({
    tagName: 'a',
    template: Ember.Handlebars.compile('<i class="icon-arrow-left"></i>'),
    classNameBindings: ['class'],
    class: function () {
      if (this.get("parentView.startIndex") > 1) {
        return "paginate_previous";
      }
      return "paginate_disabled_previous";
    }.property("parentView.startIndex", 'parentView.filteredCount'),

    click: function () {
      if (this.get('class') === "paginate_previous") {
        this.get('parentView').previousPage();
      }
    }
  }),

  paginationRight: Ember.View.extend({
    tagName: 'a',
    template: Ember.Handlebars.compile('<i class="icon-arrow-right"></i>'),
    classNameBindings: ['class'],
    class: function () {
      if ((this.get("parentView.endIndex")) < this.get("parentView.filteredCount")) {
        return "paginate_next";
      }
      return "paginate_disabled_next";
    }.property("parentView.endIndex", 'parentView.filteredCount'),

    click: function () {
      if (this.get('class') === "paginate_next") {
        this.get('parentView').nextPage();
      }
    }
  }),

  paginationFirst: Ember.View.extend({
    tagName: 'a',
    template: Ember.Handlebars.compile('<i class="icon-step-backward"></i>'),
    classNameBindings: ['class'],
    class: function () {
      if ((this.get("parentView.endIndex")) > parseInt(this.get("parentView.displayLength"))) {
        return "paginate_previous";
      }
      return "paginate_disabled_previous";
    }.property("parentView.endIndex", 'parentView.filteredCount'),

    click: function () {
      if (this.get('class') === "paginate_previous") {
        this.get('parentView').firstPage();
      }
    }
  }),

  paginationLast: Ember.View.extend({
    tagName: 'a',
    template: Ember.Handlebars.compile('<i class="icon-step-forward"></i>'),
    classNameBindings: ['class'],
    class: function () {
      if (this.get("parentView.endIndex") !== this.get("parentView.filteredCount")) {
        return "paginate_next";
      }
      return "paginate_disabled_next";
    }.property("parentView.endIndex", 'parentView.filteredCount'),

    click: function () {
      if (this.get('class') === "paginate_next") {
        this.get('parentView').lastPage();
      }
    }
  }),

  /**
   * Select View with list of "rows-per-page" options
   * @type {Ember.View}
   */
  rowsPerPageSelectView: Em.Select.extend({
    content: ['10', '25', '50', '100'],
    change: function () {
      this.get('parentView').saveDisplayLength();
    }
  }),

  /**
   * Start index for displayed content on the page
   */
  startIndex: 1,

  /**
   * Calculate end index for displayed content on the page
   */
  endIndex: function () {
    if (this.get('pagination') && this.get('displayLength')) {
      return Math.min(this.get('filteredCount'), this.get('startIndex') + parseInt(this.get('displayLength')) - 1);
    } else {
      return this.get('filteredCount') || 0;
    }
  }.property('startIndex', 'displayLength', 'filteredCount'),

  /**
   * Onclick handler for previous page button on the page
   */
  previousPage: function () {
    var result = this.get('startIndex') - parseInt(this.get('displayLength'));
    this.set('startIndex', (result < 2) ? 1 : result);
  },

  /**
   * Onclick handler for next page button on the page
   */
  nextPage: function () {
    var result = this.get('startIndex') + parseInt(this.get('displayLength'));
    if (result - 1 < this.get('filteredCount')) {
      this.set('startIndex', result);
    }
  },
  /**
   * Onclick handler for first page button on the page
   */
  firstPage: function () {
    this.set('startIndex', 1);
  },
  /**
   * Onclick handler for last page button on the page
   */
  lastPage: function () {
    var pagesCount = this.get('filteredCount') / parseInt(this.get('displayLength'));
    var startIndex = (this.get('filteredCount') % parseInt(this.get('displayLength')) === 0) ?
      (pagesCount - 1) * parseInt(this.get('displayLength')) :
      Math.floor(pagesCount) * parseInt(this.get('displayLength'));
    this.set('startIndex', ++startIndex);
  },

  /**
   * Calculates default value for startIndex property after applying filter or changing displayLength
   */
  updatePaging: function (controller, property) {
    var displayLength = this.get('displayLength');
    var filteredContentLength = this.get('filteredCount');
    if (property == 'displayLength') {
      this.set('startIndex', Math.min(1, filteredContentLength));
    } else if (!filteredContentLength) {
      this.set('startIndex', 0);
    } else if (this.get('startIndex') > filteredContentLength) {
      this.set('startIndex', Math.floor((filteredContentLength - 1) / displayLength) * displayLength + 1);
    } else if (!this.get('startIndex')) {
      this.set('startIndex', 1);
    }
  }.observes('displayLength', 'filteredCount'),

  /**
   * Apply each filter to each row
   *
   * @param {Number} iColumn number of column by which filter
   * @param {Object} value
   * @param {String} type
   */
  updateFilter: function (iColumn, value, type) {
    this.saveFilterConditions(iColumn, value, type, false);
    this.filtersUsedCalc();
    this.filter();
  },

  /**
   * save filter conditions to local storage
   * @param iColumn {Number}
   * @param value {String|Array}
   * @param type {String}
   * @param skipFilter {Boolean}
   */
  saveFilterConditions: function(iColumn, value, type, skipFilter) {
    var filterCondition = this.get('filterConditions').findProperty('iColumn', iColumn);

    if (filterCondition) {
      filterCondition.value = value;
      filterCondition.skipFilter = skipFilter;
    } else {
      filterCondition = {
        skipFilter: skipFilter,
        iColumn: iColumn,
        value: value,
        type: type
      };
      this.get('filterConditions').push(filterCondition);
    }
    // remove empty entries
    this.set('filterConditions', this.get('filterConditions').filter(function(item){ return !Em.isEmpty(item.value); }));
    App.db.setFilterConditions(this.get('controller.name'), this.get('filterConditions'));
  },

  saveDisplayLength: function() {
    var self = this;
    Em.run.next(function() {
      App.db.setDisplayLength(self.get('controller.name'), self.get('displayLength'));
      if (!App.get('testMode')) {
        if (App.isAccessible('upgrade_ADMIN')) {
          self.postUserPref(self.displayLengthKey(), self.get('displayLength'));
        }
      }
    });
  },

  clearFilterConditionsFromLocalStorage: function() {
    var result = false;
    var currentFCs = App.db.getFilterConditions(this.get('controller.name'));
    if (currentFCs != null) {
      App.db.setFilterConditions(this.get('controller.name'), null);
      result = true;
    }
    return result;
  },

  /**
   * Contain filter conditions for each column
   * @type {Array}
   */
  filterConditions: [],

  /**
   * Contains content after implementing filters
   * @type {Array}
   */
  filteredContent: [],

  /**
   * Determine if <code>filteredContent</code> is empty or not
   * @type {Boolean}
   */
  hasFilteredItems: Em.computed.bool('filteredCount'),

  /**
   * Contains content to show on the current page of data page view
   * @type {Array}
   */
  pageContent: function () {
    return this.get('filteredContent').slice(this.get('startIndex') - 1, this.get('endIndex'));
  }.property('filteredCount', 'startIndex', 'endIndex'),

  /**
   * flag to toggle displaying filtered hosts counter
   */
  showFilteredContent: function () {
    var result = false;
    if (this.get('filterConditions.length') > 0) {
      this.get('filterConditions').forEach(function(f) {
        if (f.value) {
          if (Em.typeOf(f.value) == "array") {
            if (f.value[0] || f.value[1]) {
              result = true;
            }
          } else {
            result = true;
          }
        }
      });
    }
    return result;
  }.property('filteredContent.length'),
  /**
   * Filter table by filterConditions
   */
  filter: function () {
    var content = this.get('content');
    var filterConditions = this.get('filterConditions').filterProperty('value');
    var result;
    var assoc = this.get('colPropAssoc');
    if (filterConditions.length) {
      result = content.filter(function (item) {
        var match = true;
        filterConditions.forEach(function (condition) {
          var filterFunc = filters.getFilterByType(condition.type, false);
          if (match) {
            match = filterFunc(item.get(assoc[condition.iColumn]), condition.value);
          }
        });
        return match;
      });
      this.set('filteredContent', result);
    } else {
      this.set('filteredContent', content ? content.toArray() : []);
    }
  }.observes('content.length'),

  /**
   * sort content by active sort column
   */
  sortContent: function() {
    var activeSort = App.db.getSortingStatuses(this.get('controller.name')).find(function (sort) {
      return (sort.status === 'sorting_asc' || sort.status === 'sorting_desc');
    });
    var sortIndexes = {
      'sorting_asc': 1,
      'sorting_desc': -1
    };

    this.get('content').sort(function (a, b) {
      if (a.get(activeSort.name) > b.get(activeSort.name)) return sortIndexes[activeSort.status];
      if (a.get(activeSort.name) < b.get(activeSort.name)) return -(sortIndexes[activeSort.status]);
      return 0;
    });
    this.filter();
  },

  /**
   * Does any filter is used on the page
   * @type {Boolean}
   */
  filtersUsed: false,

  /**
   * Determine if some filters are used on the page
   * Set <code>filtersUsed</code> value
   */
  filtersUsedCalc: function() {
    var filterConditions = this.get('filterConditions');
    if (!filterConditions.length) {
      this.set('filtersUsed', false);
      return;
    }
    var filtersUsed = false;
    filterConditions.forEach(function(filterCondition) {
      if (filterCondition.value.toString() !== '') {
        filtersUsed = true;
      }
    });
    this.set('filtersUsed', filtersUsed);
  },

  /**
   * Run <code>clearFilter</code> in the each child filterView
   */
  clearFilters: function() {
    this.set('filterConditions', []);
    this.get('_childViews').forEach(function(childView) {
      if (childView['clearFilter']) {
        childView.clearFilter();
      }
    });
  }

});
