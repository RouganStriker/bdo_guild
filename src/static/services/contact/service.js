import BaseService from '../../utils/baseService';
import BaseSaga, { apiRequest } from '../../utils/baseSaga';

const saga = new BaseSaga('/api/contact/');
const service = new BaseService('CONTACT', 'contact', saga, { create: true });

export default service;