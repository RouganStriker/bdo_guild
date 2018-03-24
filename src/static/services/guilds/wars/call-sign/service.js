import { call, select } from 'redux-saga/effects';

import BaseService from '../../../../utils/baseService';
import BaseSaga, { apiRequest } from '../../../../utils/baseSaga';

class CallSignSaga extends BaseSaga {
  * getContext() {
    // Overridden by child classes to auto generate the context
    const baseContext = {};
    const guild_id = yield select(state => state.guild.selected.id);
    const war_id = yield select(state => state.war.selected.id);

    if (guild_id !== null) {
      baseContext['guild_id'] = guild_id;
    }
    if (war_id !== null) {
      baseContext['war_id'] = war_id;
    }

    return baseContext;
  }

  * assign(id, body = {}, params = {}, context = {}) {
    return this.axios.post(this.getItemUrl(id, context) + 'assign/', body, params);
  }

  assignSaga(action, form = null) {
    return (function* ({ id, payload = {}, params = {}, context = {}, onSuccess = null, form = null } = {}) {
      const combinedContext = yield this.mergeDefaultContext(context);

      yield call(apiRequest, {
        action: action,
        fn: () => this.assign(id, payload, params, combinedContext),
        form: form
      });

      onSuccess && onSuccess();
    }).bind(this);
  }

  * unassign(id, body = {}, params = {}, context = {}) {
    return this.axios.post(this.getItemUrl(id, context) + 'unassign/', body, params);
  }

  unassignSaga(action, form = null) {
    return (function* ({ id, payload = {}, params = {}, context = {}, onSuccess = null, form = null } = {}) {
      const combinedContext = yield this.mergeDefaultContext(context);

      yield call(apiRequest, {
        action: action,
        fn: () => this.unassign(id, payload, params, combinedContext),
        form: form
      });

      onSuccess && onSuccess();
    }).bind(this);
  }
}

class CallSignService extends BaseService {
  getAdditionalActions() {
    // To be extended by sub-classes
    return ['assign', 'unassign'];
  }
}


const saga = new CallSignSaga('/api/guilds/{guild_id}/wars/{war_id}/call-signs/', '', true);
const service = new CallSignService('GUILD_WARS_CALLSIGNS', 'call_sign', saga, { get: true, list: true, create: true, update: true, destroy: true });

export default service;