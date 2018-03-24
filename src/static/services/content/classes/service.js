import BaseService from '../../../utils/baseService';
import BaseSaga from '../../../utils/baseSaga';

const saga = new BaseSaga('/api/content/classes/');
const service = new BaseService('BDO_CLASSES', 'characterClasses', saga, { list: true, get: true });

export default service;