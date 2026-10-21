import {env} from 'cloudflare:workers';
import {EmailAuth} from './service';
export function authService(){if(!env.DB)throw Error('数据库尚未连接');return new EmailAuth(env.DB);}
