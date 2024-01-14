import { removeZWNBSP } from '../plugins/FixGetTopicTitlePlugin'

describe('removeZWNBSP', () => {
    it('should remove ZWNBSP', () => {
        const s = '\ufeffHello\ufeff World';
        expect(removeZWNBSP(s)).toBe('Hello World');
    });
});