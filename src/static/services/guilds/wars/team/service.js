import { call, select } from 'redux-saga/effects';

import BaseService from '../../../../utils/baseService';
import BaseSaga, { apiRequest } from '../../../../utils/baseSaga';

class WarTeamSaga extends BaseSaga {
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


  * setSlot(id, body = {}, params = {}, context = {}) {
    return this.axios.post(this.getItemUrl(id, context) + 'set_slot/', body, params);
  }

  setSlotSaga(action, form = null) {
    return (function* ({ id, payload = {}, params = {}, context = {}, onSuccess = null, form = null } = {}) {
      const combinedContext = yield this.mergeDefaultContext(context);

      yield call(apiRequest, {
        action: action,
        fn: () => this.setSlot(id, payload, params, combinedContext),
        form: form
      });

      onSuccess && onSuccess();
    }).bind(this);
  }
}

class WarTeamService extends BaseService {
  getAdditionalActions() {
    // To be extended by sub-classes
    return ['setSlot'];
  }
}


const saga = new WarTeamSaga('/api/guilds/{guild_id}/wars/{war_id}/teams/', '', true);
const service = new WarTeamService('GUILD_WARS_TEAMS', 'war_team', saga, { get: true, list: true, create: true, update: true, destroy: true });

export default service;