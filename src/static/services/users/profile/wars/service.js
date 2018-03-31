import BaseService from '../../../../utils/baseService';
import BaseSaga from '../../../../utils/baseSaga';

const saga = new BaseSaga('/api/users/profile/{profile_id}/wars/', 'wars');
const service = new BaseService('USER_WARS', 'user_wars', saga, { list: true, get: true });

export default service;