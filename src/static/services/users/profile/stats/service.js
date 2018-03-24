import BaseService from '../../../../utils/baseService';
import BaseSaga from '../../../../utils/baseSaga';

const saga = new BaseSaga('/api/users/profile/{profile_id}/stats/', 'stats');
const service = new BaseService('USER_STATS', 'stats', saga, { list: true, get: true });

export default service;