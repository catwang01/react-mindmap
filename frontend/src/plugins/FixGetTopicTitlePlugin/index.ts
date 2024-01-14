export const removeZWNBSP = (s: string): string => {
    return s.replaceAll(/\ufeff/g, "");
}

export function FixGetTopicTitlePlugin() {
    return {
        getTopicTitle(props, next) {
            const res = next();
            return removeZWNBSP(res);
        }
    }
}
