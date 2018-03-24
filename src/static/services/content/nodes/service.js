import BaseService from '../../../utils/baseService';
import BaseSaga from '../../../utils/baseSaga';

const saga = new BaseSaga('/api/content/nodes/');
const service = new BaseService('BDO_NODES', 'warNodes', saga, { list: true, get: true });

export default service;