import type { Component } from 'vue';

const selectRef = new Map<string, Component>();

export const selectRegistry = {
  add(name: string, comp: Component) {
    selectRef.set(name, comp);
  },
  get(name: string) {
    return selectRef.get(name);
  },
  delete(name: string) {
    selectRef.delete(name);
  },
  clear() {
    selectRef.clear();
  },
};

export async function registerSelects() {
  // 动态导入以避免循环依赖
  const [
    DingTalkUserSelect,
    DingTalkOrgSelect,
    WeChatUserSelect,
    WeChatOrgSelect,
    WeChatTagSelect,
    AliyunSmsSignSelect,
    AliyunSmsTemplateSelect,
  ] = await Promise.all([
    import('./notify/dingTalk/DingTalkUserSelect.vue').then((m) => m.default),
    import('./notify/dingTalk/DingTalkOrgSelect.vue').then((m) => m.default),
    import('./notify/wechat/WeChatUserSelect.vue').then((m) => m.default),
    import('./notify/wechat/WeChatOrgSelect.vue').then((m) => m.default),
    import('./notify/wechat/WeChatTagSelect.vue').then((m) => m.default),
    import('./notify/sms/AliyunSmsSignSelect.vue').then((m) => m.default),
    import('./notify/sms/AliyunSmsTemplateSelect.vue').then((m) => m.default),
  ]);

  // 注册业务 ID
  selectRegistry.add('dingTalk-user', DingTalkUserSelect);
  selectRegistry.add('dingTalk-org', DingTalkOrgSelect);
  selectRegistry.add('wechat-user', WeChatUserSelect);
  selectRegistry.add('wechat-org', WeChatOrgSelect);
  selectRegistry.add('wechat-tag', WeChatTagSelect);
  selectRegistry.add('aliyun-sms-signs', AliyunSmsSignSelect);
  selectRegistry.add('aliyun-sms-template', AliyunSmsTemplateSelect);
}
