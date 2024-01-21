import { FocusMode, Model, ModelModifier, TopicRelationship, createKey, getAllSubTopicKeys, getRelationship } from "@blink-mind/core";
import { ms } from "./ms";
export * from "./md5";
export { ms };

export const downloadFile = (url: string, filename: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
};

export function generateSimpleModel() {
  const rootKey = createKey();

  return Model.create({
    rootTopicKey: rootKey,
    topics: [
      {
        key: rootKey,
        blocks: [{ type: "CONTENT", data: "MainTopic" }]
      }
    ]
  });
}

export function throttled(fn, delay = ms("5 seconds")) {
  let oldtime = null;
  let newtime = null;
  return function (...args) {
    newtime = Date.now();
    if (oldtime === null || newtime - oldtime >= delay) {
      fn.apply(null, args)
      oldtime = Date.now();
      newtime = null;
    }
  }
}

export function getNotesFromModel(model, defaultValue = []) {
  return model?.getIn(['extData', 'allnotes', 'notes'], defaultValue)
}

export function nonEmpty(obj) {
  return (obj !== null) && (obj !== undefined);
}

export function empty(obj) {
  return !nonEmpty(obj)
}

export function getEnv(key, defaultValue = null) {
  // @ts-ignore
  return (process.env.NODE_ENV === 'production' 
                // @ts-ignore
                  ? window.__env__[key] : process.env[key]) ?? defaultValue;
}

export function isTopicVisible(model, topicKey) {
  return topicKey === model.editorRootTopicKey
    || getRelationship(model, topicKey, model.editorRootTopicKey) === TopicRelationship.DESCENDANT;
}

export const getCumSum = (s) => {
  if (!Array.isArray(s))
    throw new Error('s must be an array');
  const cumSum = new Array(s.length + 1).fill(0);
  s.forEach((v, i) => {
    cumSum[i + 1] = cumSum[i] + s[i]
  })
  return cumSum;
}

export const getChildrenCount = (model, topicKey) => {
  if (empty(topicKey)) {
    topicKey = model.focusKey;
  }
  return getAllSubTopicKeys(model, topicKey).length;
}


export const getSiblingTopicKey = (topicKey, model, offset) => {
  const parentTopic = model.getParentTopic(topicKey);
  if (empty(parentTopic) || !isTopicVisible(model, parentTopic.key))
    return undefined;
  const siblingTopicKeys = parentTopic.subKeys
  const siblingKeyCount = siblingTopicKeys.size
  if (siblingKeyCount === 0) return null;
  if (siblingKeyCount === 1) return topicKey;

  const index = siblingTopicKeys.findIndex(key => key == topicKey);
  const siblingIndex = (index + offset + siblingKeyCount) % siblingKeyCount;
  return siblingTopicKeys.get(siblingIndex);
}

export const getSiblingTopicKeyCrossParent = (topicKey, model, offset) => {
  const parentTopic = model.getParentTopic(topicKey);
  if (empty(parentTopic) || !isTopicVisible(model, parentTopic.key))
    return undefined;
  const parentParentTopic = model.getParentTopic(parentTopic.key);
  if (empty(parentParentTopic) || !isTopicVisible(model, parentParentTopic.key))
    return undefined;
  const globalSiblingTopicKeys = parentParentTopic.subKeys
    .map(key => model.getTopic(key).subKeys)
    .reduce((prev, cur) => [...prev, ...cur], []);
  const siblingKeyCount = globalSiblingTopicKeys.length
  if (siblingKeyCount === 1) return topicKey;

  const index = globalSiblingTopicKeys.findIndex(key => key === topicKey);
  const siblingIndex = (index + offset + siblingKeyCount) % siblingKeyCount;
  return globalSiblingTopicKeys[siblingIndex];
}

export const getParentTopicKeyFromController = ({ controller }) => {
  const model = controller.currentModel;
  const topicKey = model.focusKey;
  const parentKey = model.getParentTopic(topicKey)?.key;
  return parentKey;
}

export const getNextSiblingOrParentTopicKey = (topicKey, model, offset) => {
  const nextSiblingTopicKey = getSiblingTopicKey(topicKey, model, offset);
  if (!nextSiblingTopicKey || nextSiblingTopicKey === topicKey)
    return model.getParentTopic(topicKey)?.key;
  return nextSiblingTopicKey;
}

export function expand({ model, topicKey }) {
  let topic = model.getTopic(topicKey);
  if (topic && topic.subKeys.size !== 0) {
    topic = topic.merge({
      collapse: !topic.collapse
    });
    model = model.updateIn(
      ['topics', topic.key, 'collapse'],
      collapse => false
    );
  }
  model = ModelModifier.focusTopic({ model, topicKey, focusMode: FocusMode.NORMAL });
  return model;
}

export class TimeoutError extends Error { }

export const promiseTimeout = (task, timeout) => {
  const timeoutPromise = new Promise(
    (_, reject) => setTimeout(reject, timeout, new TimeoutError())
  );
  return Promise.race([task, timeoutPromise]);
}