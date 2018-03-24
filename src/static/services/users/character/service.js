import BaseService from '../../../utils/baseService';
import BaseSaga from '../../../utils/baseSaga';

const saga = new BaseSaga('/api/users/characters/', 'character');
const service = new BaseService('USER_CHARACTER', 'character', saga, { list: true, get: true, update: true, create: true, destroy: true });

export default service;