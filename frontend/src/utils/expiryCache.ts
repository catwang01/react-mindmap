import { log } from '../plugins/CreateJupyterNotebookPlugin/logger';
import { ms } from './ms';

export const expiryCache = (fn, obj) => {
    const cached = {};
    const boundFn = fn.bind(obj);
    const wrapper = (...args) => {
        const now = Date.now();
        const diff = ms("5 minutes");
        const key = JSON.stringify(args)
        console.log(`Key is ${key}`);
        if (!cached.hasOwnProperty(key) || cached[key].time + diff < now) {
            log(`cache is missing or expried for key ${key}`);
            const ret = boundFn(...args);
            cached[key] = {
                value: ret,
                time: now
            };
        }
        log(`cache is hit for key ${key}`);
        return cached[key].value;
    };
    return wrapper;
};
