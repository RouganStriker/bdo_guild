import { call, select } from 'redux-saga/effects';

import BaseService from '../../../utils/baseService';
import BaseSaga, { apiRequest } from '../../../utils/baseSaga';

class WarSaga extends BaseSaga {
  * getContext() {
    // Overridden by child classes to auto generate the context
    const baseContext = {};
    const guild_id = yield select(state => state.guild.selected && state.guild.selected.id || null);

    if (guild_id !== null) {
      baseContext['guild_id'] = guild_id;
    }

    return baseContext;
  }

  * finish(id, body = {}, params = {}, context = {}) {
    return this.axios.post(this.getItemUrl(id, context) + 'finish/', body, params);
  }

  finishSaga(action, form = null) {
    return (function* ({ id, payload = {}, params = {}, context = {}, onSuccess = null, form = null } = {}) {
      const combinedContext = yield this.mergeDefaultContext(context);

      yield call(apiRequest, {
        action: action,
        fn: () => this.finish(id, payload, params, combinedContext),
        form: form,
        onSuccess,
      });
    }).bind(this);
  }
}

class WarService extends BaseService {
  getAdditionalActions() {
    // To be extended by sub-classes
    return ['finish'];
  }
}

const saga = new WarSaga('/api/guilds/{guild_id}/wars/', 'war', true);
const service = new WarService('GUILD_WARS', 'war', saga, { list: true, get: true, update: true, create: true, destroy: true });

export default service;