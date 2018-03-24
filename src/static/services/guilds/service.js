import BaseService from '../../utils/baseService';
import BaseSaga from '../../utils/baseSaga';

const saga = new BaseSaga('/api/guilds/');
const service = new BaseService('GUILDS', 'guild', saga, { list: true, get: true, update: true, create: true, destroy: true });

export default service;