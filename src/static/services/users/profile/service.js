import BaseService from '../../../utils/baseService';
import BaseSaga from '../../../utils/baseSaga';

const saga = new BaseSaga('/api/users/profile/', 'profile');
const service = new BaseService('USER_PROFILE', 'profile', saga, { list: true, get: true, update: true, create: true });

export default service;