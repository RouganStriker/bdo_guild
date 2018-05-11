import { call, select } from 'redux-saga/effects';

import BaseService from '../../../utils/baseService';
import BaseSaga, { apiRequest } from '../../../utils/baseSaga';

const saga = new BaseSaga('/api/guilds/{guild_id}/activity/', '', true);
const service = new BaseService('GUILD_ACTIVITY', 'guild_activity', saga, { list: true, get: true });

export default service;