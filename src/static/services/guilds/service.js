import { call, select } from 'redux-saga/effects';

import BaseService from '../../utils/baseService';
import BaseSaga, { apiRequest } from '../../utils/baseSaga';

class GuildSaga extends BaseSaga {
  * attendanceEstimate(id, body = {}, params = {}, context = {}) {
    return this.axios.get(this.getItemUrl(id, context) + 'attendance_estimate/', body, params);
  }

  attendanceEstimateSaga(action, form = null) {
    return (function* ({ id, payload = {}, params = {}, context = {}, onSuccess = null, form = null } = {}) {
      const combinedContext = yield this.mergeDefaultContext(context);

      yield call(apiRequest, {
        action: action,
        fn: () => this.attendanceEstimate(id, payload, params, combinedContext),
        onSuccess,
      });
    }).bind(this);
  }
}

class GuildService extends BaseService {
  getAdditionalActions() {
    // To be extended by sub-classes
    return ['attendanceEstimate'];
  }

  getExtendedInitialState() {
    return {
      attendanceEstimate: null,
    }
  }

  attendanceEstimateSuccessReducer() {
    return (state, payload) => ({
      ...state,
      attendanceEstimate: payload,
    })
  }
}

const saga = new GuildSaga('/api/guilds/');
const service = new GuildService('GUILDS', 'guild', saga, { list: true, get: true, update: true, create: true, destroy: true });

export default service;