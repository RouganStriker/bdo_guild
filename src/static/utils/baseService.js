/*
  Base Service class.

  Auto generate actions, reducers, sagas
*/
import { createAction, createReducer } from 'redux-act';
import { call, fork, put, take } from 'redux-saga/effects';
import { startSubmit, stopSubmit } from 'redux-form';

export const APIMethods = {
  "list": "LIST",
  "get": "GET",
  "update": "UPDATE",
  "create": "CREATE",
  "destroy": "DESTROY"
}


class BaseService {
  constructor(base_name, store_key, saga, { list = false, get = false, update = false, create = false, destroy = false } = {}) {
    // This is the base name used for actions
    this.base_name = base_name.toUpperCase();
    this.store_key = store_key;
    this.saga = saga;
    this.saga.store_key = store_key;
    this.supportedActions = [];

    if (list === true) {
      this.supportedActions.push("list");
    }
    if (get === true) {
      this.supportedActions.push("get");
    }
    if (update === true) {
      this.supportedActions.push("update");
    }
    if (get && update) {
      this.supportedActions.push("updateSelected");
    }
    if (create === true) {
      this.supportedActions.push("create");
    }
    if (destroy === true) {
      this.supportedActions.push("destroy");
    }

    this.supportedActions = [...this.supportedActions, ...this.getAdditionalActions()]
    this.nonAPIActions = ['clearSelected', 'clearLoaded', ...this.getAdditionalNonAPIActions()]

    this.initSupportedActions();

    this.select = createAction(`${this.base_name}_SELECT`);
  }

  getAdditionalActions() {
    // To be extended by sub-classes
    return [];
  }

  getAdditionalNonAPIActions() {
    // To be extended by sub-classes
    return [];
  }

  initSupportedActions() {
    this.supportedActions.forEach((actionType) => {
      const suffix = actionType.toUpperCase()
      this[actionType] = this.createAPIAction(`${this.base_name}_${suffix}`);
    });

    this.nonAPIActions.forEach((actionType) => {
      const suffix = actionType.toUpperCase()
      this[actionType] = createAction(`${this.base_name}_${suffix}`);
    })
  }

  createAPIAction(name) {
    const action = createAction(name);

    // Create sub-actions
    action.request = createAction(`${name}_REQUEST`);
    action.success = createAction(`${name}_SUCCESS`);
    action.error = createAction(`${name}_ERROR`);
    action.complete = createAction(`${name}_COMPLETE`);

    return action;
  }

  listSuccessReducer() {
    return (state, payload) => ({
      ...state,
      isLoaded: true,
      items: payload.items,
      count: payload.count,
      query: payload.query,
    })
  }

  getSuccessReducer() {
    return (state, payload) => ({
      ...state,
      selected: payload,
    })
  }

  updateSelectedSuccessReducer() {
    return (state, payload) => ({
      ...state,
      selected: payload,
    })
  }

  clearSelectedReducer() {
    return (state, payload) => ({
      ...state,
      selected: null,
    })
  }

  clearLoadedReducer() {
    return (state, payload) => ({
      ...state,
      isLoaded: false,
      items: [],
    })
  }

  getExtendedInitialState() {
    // To be overridden by child class
    return {};
  }

  getInitialState() {
    return {
      isLoading: false,
      isLoaded: false,
      items: [],
      errors: null,
      count: 0,
      selected: null,
      query: {
        pageSize: 0,
        page: 1
      },
      ...this.getExtendedInitialState(),
    };
  }

  createReducer = () => {
    var reducer = {
      [this.select]: (state, payload) => ({ ...state, selected: payload })
    };
    var reducerMapping = {}
    const initialState = this.getInitialState();

    this.supportedActions.forEach((actionType) => {
      reducer = {
        ...reducer,
        ...this.createReducerForAction(this[actionType])
      };

      // Custom reducer for success
      if (this[`${actionType}SuccessReducer`]) {
        reducer = {
          ...reducer,
          [this[actionType].success]: this[`${actionType}SuccessReducer`]()
        }
      }
    });

    this.nonAPIActions.forEach((actionType) => {
      if (this[`${actionType}Reducer`]) {
        reducer = {
          ...reducer,
          [this[actionType]]: this[`${actionType}Reducer`]()
        }
      }
    })

    reducerMapping[this.store_key] = createReducer(reducer, initialState);

    return reducerMapping
  }

  createSagaMapping() {
    var sagaMapping = {};

    this.supportedActions.forEach((actionType) => {
      sagaMapping = {
        ...sagaMapping,
        [this[actionType]]: this.saga[`${actionType}Saga`](this[actionType])
      }
    });

    return sagaMapping;
  }

  createReducerForAction = (action) => ({
    [action.request]: (state) => ({ ...state, isLoading: true }),
    [action.error]: (state, payload) => ({ ...state, errors: payload.errors }),
    [action.complete]: (state) => ({ ...state, isLoading: false })
  })
}

export default BaseService;