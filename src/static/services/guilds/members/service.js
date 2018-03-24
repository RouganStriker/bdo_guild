import { select } from 'redux-saga/effects';

import BaseService from '../../../utils/baseService';
import BaseSaga from '../../../utils/baseSaga';

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
}

const saga = new WarSaga('/api/guilds/{guild_id}/members/', 'members', true);
const service = new BaseService('GUILD_MEMBERS', 'members', saga, { list: true, get: true });

export default service;