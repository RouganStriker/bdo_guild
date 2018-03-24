import axios from 'axios';
import { call, fork, put, select, take } from 'redux-saga/effects';
import { startSubmit, stopSubmit } from 'redux-form';
const format = require('string-format');


class BaseSaga {
  constructor(baseURL, form = '', requireContext = false) {
    this.axios = axios.create({
      baseURL: '',
      xsrfCookieName: 'bdo-csrftoken',
      xsrfHeaderName: 'X-CSRFToken'
    });

    this.axios.interceptors.response.use(
      (response) => {
        const { method, url } = response.config;
        return response;
      },
      (error) => {
        if (error.status === 401) {
          const { pathname, search, hash } = window.location;
          window.location = window.django.login_url + `?next=${pathname}${search}${hash}`;
          return;
        }
        return Promise.reject(error);
      }
    );

    this.url = baseURL;
    this.form = form;
    this.requireContext = requireContext;
  }

  * getContext() {
    // Overridden by child classes to auto generate the context
    return {};
  }

  getBaseUrl(context = {}) {
    if (this.requireContext && Object.keys(context).length == 0) {
      throw new Error('Service requires context object but none specified');
    }

    if (this.url) {
      return format(this.url, context);
    }
    throw new Error('Service must define "url" in it\'s constructor.');
  }

  getItemUrl(id, context = {}) {
    const baseUrl = this.getBaseUrl(context);
    return `${baseUrl}${id}/`;
  }

  /*
    API Service
  */
  * list(params = {}, context = {}) {
    return this.axios.get(this.getBaseUrl(context), { params });
  }

  get(id, params = {}, context = {}) {
    return this.axios.get(this.getItemUrl(id, context), { params });
  }

  * create(body = {}, params = {}, context = {}) {
    return this.axios.post(this.getBaseUrl(context), body, params);
  }

  * update(id, body = {}, params = {}, context = {}) {
    return this.axios.patch(this.getItemUrl(id, context), body, { params });
  }

  * destroy(id, body = {}, params = {}, context = {}) {
    return this.axios.delete(this.getItemUrl(id, context), body, { params });
  }

  * mergeDefaultContext(context) {
    // Merge custom context into default context
    const defaultContext = yield this.getContext()
    return {
      ...defaultContext,
      ...context,
    }
  }

  /*
    Sagas
  */
  listSaga(action) {
    return (function* ({ params = {}, context = {}, onSuccess = null, onError = null } = {}) {
      const combinedContext = yield this.mergeDefaultContext(context);

      const result = yield call(apiRequest, {
        action: action,
        fn: () => this.list(params, combinedContext),
        resultMap: response => ({
          items: response.results,
          count: response.count,
        }),
        onError,
        onSuccess,
      });

      return result;
    }).bind(this);
  }

  getSaga(action) {
    return (function* ({ id, params = {}, context = {}, onSuccess = null, onError = null} = {}) {
      const combinedContext = yield this.mergeDefaultContext(context);

      const result = yield call(apiRequest, {
        action: action,
        fn: () => this.get(id, params, combinedContext),
        onError,
        onSuccess,
      });

      return result;
    }).bind(this);
  }

  clearSelectedSaga(action) {
    return (function* () {
      // We are only updating the reducer
      return;
    });
  }

  createSaga(action, form = null) {
    return (function* ({ payload = {}, params = {}, context = {}, onSuccess = null, onError = null, form = null } = {}) {
      const combinedContext = yield this.mergeDefaultContext(context);

      const result = yield call(apiRequest, {
        action: action,
        fn: () => this.create(payload, params, combinedContext),
        form: form,
        onError,
        onSuccess,
      });

      return result;
    }).bind(this);
  }

  updateSaga(action) {
    return (function* ({ id, payload = {}, params = {}, context = {}, onSuccess = null, onError = null, form = null } = {}) {
      const combinedContext = yield this.mergeDefaultContext(context);

      const result = yield call(apiRequest, {
        action: action,
        fn: () => this.update(id, payload, params, combinedContext),
        form: form,
        onError,
        onSuccess,
      });

      return result;
    }).bind(this);
  }

  updateSelectedSaga(action) {
    return (function* ({ payload = {}, params = {}, context = {}, form = null, onSuccess = null, onError = null, refetch = true } = {}) {
      const id = yield select(state => state[this.store_key].selected.id);
      const combinedContext = yield this.mergeDefaultContext(context);

      // Update
      yield call(apiRequest, {
        action: action,
        fn: () => this.update(id, payload, {}, combinedContext),
        form: form,
        onError,
        onSuccess,
      });

      // Re-fetch
      if (refetch) {
        yield call(apiRequest, {
          action: action,
          fn: () => this.get(id, params, combinedContext),
        });
      }
    }).bind(this);
  }

  destroySaga(action) {
    return (function* ({ id, payload = {}, params = {}, context  = {}, onSuccess = null} = {}) {
      const combinedContext = yield this.mergeDefaultContext(context);

      yield call(apiRequest, {
        action: action,
        fn: () => this.destroy(id, payload, {}, combinedContext),
        onSuccess,
      });
    }).bind(this);
  }
}


function* processAPIErrors(error, form, onError) {
  const { response } = error;
  const badStatusCodes = [404, 405, 500, 504];

  if (!response || !response.status) {
    console.error('Network error');
  } else if (badStatusCodes.includes(response.status)) {
    console.error('Error processing request');
  } else if (response.status === 403) {
    console.error('Not permitted');
  } else {
    console.error(response);
  }

  onError && onError();

  if (!form) {
    return;
  }

  let errors = {};

  if (response.data) {
    if (response.data.hasOwnProperty('errors')) {
      errors = { _error: response.data.errors };
    } else {
     errors = response.data;
    }
  }

  yield put(stopSubmit(form, errors));
}


export function *apiRequest({ action, fn, form = null, resultMap = null, data = null, onSuccess = null, onError = null }) {
  if (form)  {
    yield put(startSubmit(form));
  }

  yield put(action.request(data));

  let response;

  try {
    response = yield (yield call(fn));
  } catch (error) {
    console.error(error);

    yield put(action.error(error.response));
    yield call(processAPIErrors, error, form, onError);
    yield put(action.complete(response));

    return;
  }

  let responseData;

  if (resultMap) {
    responseData = resultMap(response.data);
  } else if (response.data && response.data.hasOwnProperty('results')) {
    responseData = response.data.results;
  } else {
    responseData = response.data;
  }

  yield put(action.success(responseData));

  // form submit
  if (form) {
    yield put(stopSubmit(form));
  }

  yield put(action.complete(response));

  onSuccess && onSuccess(responseData);

  return responseData;
}

export function* createWatchers(sagaMapping) {
  yield Object.keys(sagaMapping).map((action) => {
    return fork(function* () {
      while (true) {
        const saga = sagaMapping[action];
        const actionResponse = yield take(action);
        yield fork(saga, actionResponse.payload);
      }
    })
  })
}

export default BaseSaga;