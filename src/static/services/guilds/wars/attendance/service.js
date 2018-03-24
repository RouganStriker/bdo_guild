import { call, select } from 'redux-saga/effects';

import BaseService from '../../../../utils/baseService';
import BaseSaga, { apiRequest } from '../../../../utils/baseSaga';

class WarAttendanceSaga extends BaseSaga {
  * getContext() {
    // Overridden by child classes to auto generate the context
    const baseContext = {};
    const guild_id = yield select(state => state.guild.selected && state.guild.selected.id || null);
    const war_id = yield select(state => state.war.selected && state.war.selected.id || null);

    if (guild_id !== null) {
      baseContext['guild_id'] = guild_id;
    }
    if (war_id !== null) {
      baseContext['war_id'] = war_id;
    }

    return baseContext;
  }

  getMyAttendance(context = {}, params = {}) {
    const baseURL = this.getBaseUrl(context);

    return this.axios.get(`${baseURL}me/`, { params });
  }

  getMyAttendanceSaga(action) {
    return (function* ({ context = {}, params = {} } = {}) {
      const combinedContext = yield this.mergeDefaultContext(context);

      yield call(apiRequest, {
        action: action,
        fn: () => this.getMyAttendance(combinedContext, params),
      });
    }).bind(this);
  }

  updateMyAttendance(context = {}, payload = {}) {
    const baseURL = this.getBaseUrl(context);

    return this.axios.post(`${baseURL}me/`, payload);
  }

  updateMyAttendanceSaga(action) {
    return (function* ({ context = {}, payload = {}, onSuccess = null } = {}) {
      const combinedContext = yield this.mergeDefaultContext(context);

      yield call(apiRequest, {
        action: action,
        fn: () => this.updateMyAttendance(combinedContext, payload),
      });

      onSuccess && onSuccess();
    }).bind(this);
  }
}

class WarAttendanceService extends BaseService {
  getAdditionalActions() {
    // To be extended by sub-classes
    return ['getMyAttendance', 'updateMyAttendance'];
  }

  getMyAttendanceSuccessReducer() {
    return (state, payload) => ({
      ...state,
      myAttendance: payload,
    })
  }

  updateMyAttendanceSuccessReducer() {
    return (state, payload) => ({
      ...state,
      myAttendance: payload,
    })
  }

  getInitialState() {
    const initialState = super.getInitialState();

    initialState['myAttendance'] = null

    return initialState;
  }
}

const saga = new WarAttendanceSaga('/api/guilds/{guild_id}/wars/{war_id}/attendance/', '', true);
const service = new WarAttendanceService('GUILD_WARS_ATTENDANCE', 'warAttendance', saga, { list: true, create: true, update: true, destroy: true });

export default service;