import { call, select } from 'redux-saga/effects';

import BaseService from '../../../../utils/baseService';
import BaseSaga, { apiRequest } from '../../../../utils/baseSaga';

const saga = new BaseSaga('/api/guilds/{guild_id}/wars/{war_id}/stats/', '', true);
const service = new BaseService('GUILD_WARS_STATS', 'war_stats', saga, { get: true, list: true });

export default service;