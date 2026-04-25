import type { VbenFormSchema } from '@vben/common-ui';

import { z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { getOrganizationTree } from '#/api/system/organization';
import { queryGroupDetailTree } from '#/api/system/role';
import { SIGNATURE_METHOD } from '#/enums';

export interface IntegrationFormStrategy {
  key: string;
  label: string;
  buildSchema: (context: { provider?: string }) => VbenFormSchema[];
}

// ============== SSO Client Strategy ==============

function getSsoConfigSchemaByProvider(provider: string) {
  const schemas: VbenFormSchema[] = [];

  switch (provider) {
    case 'dingtalk-ent-app': {
      schemas.push(
        {
          fieldName: 'configuration.appKey',
          label: $t(
            'application.form.dingtalkAppKey',
            '钉钉应用公钥 (appKey/clientId)',
          ),
          component: 'Input',
          rules: 'required',
          componentProps: {
            placeholder: $t(
              'application.form.dingtalkAppKeyPlaceholder',
              '请输入钉钉应用公钥',
            ),
          },
        },
        {
          fieldName: 'configuration.appSecret',
          label: $t(
            'application.form.dingtalkAppSecret',
            '钉钉应用密钥 (appSecret/clientSecret)',
          ),
          component: 'InputPassword',
          rules: 'required',
          componentProps: {
            placeholder: $t(
              'application.form.dingtalkAppSecretPlaceholder',
              '请输入钉钉应用密钥',
            ),
          },
        },
        {
          fieldName: 'configuration.callbackUri',
          label: $t('application.form.callbackUri', '回调地址 (Callback URI)'),
          component: 'Input',
          rules: z
            .string()
            .url($t('common.invalidUrl', '请输入正确的URL地址'))
            .min(1, $t('common.required', '此项为必填项')),
          help: $t(
            'application.form.dingtalkCallbackUriHelp',
            '必须为合法的 http(s) 链接地址，钉钉后台设置的重定向 URL。',
          ),
          componentProps: {
            placeholder: $t(
              'application.form.callbackUriPlaceholder',
              '允许重定向的回调地址 (如 https://...)',
            ),
          },
        },
      );

      break;
    }
    case 'internal-standalone':
    case 'third-party': {
      schemas.push(
        {
          fieldName: 'configuration.clientId',
          label: $t(
            'application.form.oauth2ClientId',
            'OAuth2 客户端标识 (clientId)',
          ),
          component: 'Input',
          rules: 'required',
          componentProps: {
            placeholder: $t(
              'application.form.oauth2ClientIdPlaceholder',
              '请输入客户端标识',
            ),
          },
        },
        {
          fieldName: 'configuration.clientSecret',
          label: $t(
            'application.form.oauth2ClientSecret',
            'OAuth2 客户端密钥 (clientSecret)',
          ),
          component: 'InputPassword',
          rules: 'required',
          componentProps: {
            placeholder: $t(
              'application.form.oauth2ClientSecretPlaceholder',
              '请输入客户端密钥',
            ),
          },
        },
        {
          fieldName: 'configuration.scope',
          label: $t('application.form.oauth2Scope', '授权范围 (scope)'),
          component: 'Input',
          help: $t(
            'application.form.oauth2ScopeHelp',
            'OIDC/OAuth2 请求授权的 scope 范围。多值通常用空格分隔，默认可不填。',
          ),
          componentProps: {
            placeholder: $t(
              'application.form.oauth2ScopePlaceholder',
              '例如: openid profile (选填)',
            ),
          },
        },
        {
          fieldName: 'configuration.authorizationUrl',
          label: $t(
            'application.form.oauth2AuthUrl',
            '授权跳转地址 (authorizationUrl)',
          ),
          component: 'Input',
          rules: z
            .string()
            .url($t('common.invalidUrl', '请输入正确的URL地址'))
            .min(1, $t('common.required', '此项为必填项')),
          help: $t(
            'application.form.oauth2AuthUrlHelp',
            'OIDC/OAuth2 标准的 authorize 端点地址。',
          ),
          componentProps: {
            placeholder: $t(
              'application.form.oauth2AuthUrlPlaceholder',
              '如 https://.../authorize',
            ),
          },
        },
        {
          fieldName: 'configuration.tokenUrl',
          label: $t(
            'application.form.oauth2TokenUrl',
            '获取令牌地址 (tokenUrl)',
          ),
          component: 'Input',
          rules: z
            .string()
            .url($t('common.invalidUrl', '请输入正确的URL地址'))
            .min(1, $t('common.required', '此项为必填项')),
          help: $t(
            'application.form.oauth2TokenUrlHelp',
            'OIDC/OAuth2 标准的 token 端点地址。',
          ),
          componentProps: {
            placeholder: $t(
              'application.form.oauth2TokenUrlPlaceholder',
              '如 https://.../token',
            ),
          },
        },
        {
          fieldName: 'configuration.userInfoUrl',
          label: $t(
            'application.form.oauth2UserInfoUrl',
            '获取用户信息地址 (userInfoUrl)',
          ),
          component: 'Input',
          rules: z
            .string()
            .url($t('common.invalidUrl', '请输入正确的URL地址'))
            .min(1, $t('common.required', '此项为必填项')),
          help: $t(
            'application.form.oauth2UserInfoUrlHelp',
            'OIDC/OAuth2 标准的 userinfo 端点地址。',
          ),
          componentProps: {
            placeholder: $t(
              'application.form.oauth2UserInfoUrlPlaceholder',
              '如 https://.../userinfo',
            ),
          },
        },
        {
          fieldName: 'configuration.redirectUri',
          label: $t('application.form.callbackUri', '回调地址 (Callback URI)'),
          component: 'Input',
          rules: z
            .string()
            .url($t('common.invalidUrl', '请输入正确的URL地址'))
            .min(1, $t('common.required', '此项为必填项')),
          help: $t(
            'application.form.oauth2RedirectUriHelp',
            'OIDC/OAuth2 标准的 redirect_uri 允许回调地址。',
          ),
          componentProps: {
            placeholder: $t(
              'application.form.callbackUriPlaceholder',
              '允许重定向的回调地址 (如 https://...)',
            ),
          },
        },
        {
          fieldName: 'configuration.accessTokenProperty',
          label: $t(
            'application.form.oauth2AccessTokenProp',
            'Access Token 属性映射 (accessTokenProperty)',
          ),
          component: 'Input',
          help: $t(
            'application.form.oauth2AccessTokenPropHelp',
            '表示返回数据中 access_token 属性的映射（支持 x.x.x）。不填时默认取响应结构中的 access_token 属性。',
          ),
          componentProps: {
            placeholder: $t(
              'application.form.oauth2AccessTokenPropPlaceholder',
              '如 data.accessToken (选填)',
            ),
          },
        },
        {
          fieldName: 'configuration.userProperty.userId',
          label: $t('application.form.oauth2UserIdProp', '用户ID映射字段'),
          component: 'Input',
          help: $t(
            'application.form.oauth2UserIdPropHelp',
            '从三方接口返回的 JSON 结构中提取唯一标识的 JSONPath 或字段名（如 id、sub）。',
          ),
          componentProps: {
            placeholder: $t(
              'application.form.oauth2UserIdPropPlaceholder',
              '如 id',
            ),
          },
        },
        {
          fieldName: 'configuration.userProperty.username',
          label: $t(
            'application.form.oauth2UsernameProp',
            '用户名/昵称映射字段',
          ),
          component: 'Input',
          help: $t(
            'application.form.oauth2UsernamePropHelp',
            '提取名称的字段路径，多个可选备用字段用逗号隔开（如 name,nickname）。',
          ),
          componentProps: {
            placeholder: $t(
              'application.form.oauth2UsernamePropPlaceholder',
              '如 name,nickname',
            ),
          },
        },
        {
          fieldName: 'configuration.userProperty.avatar',
          label: $t('application.form.oauth2AvatarProp', '头像映射字段'),
          component: 'Input',
          help: $t(
            'application.form.oauth2AvatarPropHelp',
            '提取头像 URL 的字段路径（如 avatar,picture）。',
          ),
          componentProps: {
            placeholder: $t(
              'application.form.oauth2AvatarPropPlaceholder',
              '如 avatar',
            ),
          },
        },
      );

      break;
    }
    case 'wechat-miniapp':
    case 'wechat-webapp': {
      schemas.push(
        {
          fieldName: 'configuration.clientId',
          label: $t(
            'application.form.wechatAppId',
            '微信应用标识 (appId/clientId)',
          ),
          component: 'Input',
          rules: 'required',
          componentProps: {
            placeholder: $t(
              'application.form.wechatAppIdPlaceholder',
              '请输入微信应用标识',
            ),
          },
        },
        {
          fieldName: 'configuration.clientSecret',
          label: $t(
            'application.form.wechatAppSecret',
            '微信应用密钥 (appSecret/clientSecret)',
          ),
          component: 'InputPassword',
          rules: 'required',
          componentProps: {
            placeholder: $t(
              'application.form.wechatAppSecretPlaceholder',
              '请输入微信应用密钥',
            ),
          },
        },
      );
      if (provider === 'wechat-webapp') {
        schemas.push({
          fieldName: 'configuration.redirectUri',
          label: $t('application.form.callbackUri', '回调地址 (Callback URI)'),
          component: 'Input',
          rules: z
            .string()
            .url($t('common.invalidUrl', '请输入正确的URL地址'))
            .min(1, $t('common.required', '此项为必填项')),
          help: $t(
            'application.form.wechatRedirectUriHelp',
            '微信网页扫码登录所允许的回调授权地址。',
          ),
          componentProps: {
            placeholder: $t(
              'application.form.callbackUriPlaceholder',
              '允许重定向的回调地址 (如 https://...)',
            ),
          },
        });
      }

      break;
    }
    // No default
  }

  return schemas;
}

export const ssoClientStrategy: IntegrationFormStrategy = {
  key: 'ssoClient',
  label: $t('application.integration.ssoClient', 'SSO单点登录'),
  buildSchema: (context) => {
    const dynamicSsoSchema = context.provider
      ? getSsoConfigSchemaByProvider(context.provider)
      : [];

    const baseSchema = [
      {
        fieldName: 'roleIdList',
        label: $t('application.form.ssoRoleList', '开通/授权角色 (必填)'),
        component: 'ApiSelect',
        rules: 'required',
        helpMessage: $t(
          'application.form.ssoRoleListHelp',
          '用户首次通过此SSO应用登录时，平台将默认赋予这些角色权限。',
        ),
        componentProps: {
          api: async (params: any) => {
            const data = await queryGroupDetailTree(params);
            return data.map((group) => ({
              label: group.groupName,
              options: (group.roles || []).map((role) => ({
                label: role.name,
                value: role.id,
              })),
            }));
          },
          mode: 'multiple',
        },
      },
      {
        fieldName: 'orgIdList',
        label: $t('application.form.ssoOrgList', '默认加入组织'),
        component: 'ApiTreeSelect',
        helpMessage: $t(
          'application.form.ssoOrgListHelp',
          '如果不指定，用户首次通过此应用登录后将会游离于组织架构之外。',
        ),
        componentProps: {
          api: getOrganizationTree,
          fieldNames: { children: 'children', label: 'name', value: 'id' },
          multiple: true,
          treeDefaultExpandAll: true,
        },
      },
      {
        fieldName: 'autoCreateUser',
        label: $t('application.form.autoCreateUser', '自动创建用户'),
        component: 'Switch',
        defaultValue: false,
        componentProps: { class: 'w-[fit-content]' },
      },
      {
        fieldName: 'usernamePrefix',
        label: $t('application.form.usernamePrefix', '用户名前缀'),
        component: 'Input',
        componentProps: {
          placeholder: $t(
            'application.form.usernamePrefixPlaceholder',
            '如 dt_ (选填)',
          ),
        },
        dependencies: {
          show: (values: Record<string, any>) => values.autoCreateUser,
          triggerFields: ['autoCreateUser'],
        },
      },
      {
        fieldName: 'defaultPasswd',
        label: $t('application.form.defaultPasswd', '默认密码'),
        component: 'InputPassword',
        componentProps: {
          placeholder: $t(
            'application.form.defaultPasswdPlaceholder',
            '默认初始密码',
          ),
        },
        dependencies: {
          show: (values: Record<string, any>) => values.autoCreateUser,
          triggerFields: ['autoCreateUser'],
        },
      },
    ];

    return [...dynamicSsoSchema, ...baseSchema];
  },
};

// ============== API Client Strategy ==============

export const apiClientStrategy: IntegrationFormStrategy = {
  key: 'apiClient',
  label: $t('application.integration.apiClient', 'API客户端'),
  buildSchema: () => [
    {
      fieldName: 'baseUrl',
      label: $t('application.form.apiClientBaseUrl', '接口基础地址 (Base URL)'),
      component: 'Input',
      rules: z
        .string()
        .url($t('common.invalidUrl', '请输入正确的URL地址'))
        .min(1, $t('common.required', '此项为必填项')),
      helpMessage: $t(
        'application.form.apiClientBaseUrlHelp',
        '该第三方应用的接口根路径地址，例如 https://api.dingtalk.com',
      ),
      componentProps: {
        placeholder: $t(
          'application.form.apiClientBaseUrlPlaceholder',
          '如 https://api.example.com',
        ),
      },
    },
    {
      fieldName: 'authConfig.type',
      label: $t('application.form.authType', '认证类型'),
      component: 'Select',
      defaultValue: 'none',
      componentProps: {
        options: [
          {
            label: $t('application.form.authTypeNone', '无认证 (none)'),
            value: 'none',
          },
          {
            label: $t('application.form.authTypeBearer', 'Bearer Token'),
            value: 'bearer',
          },
          {
            label: $t('application.form.authTypeBasic', 'Basic Auth'),
            value: 'basic',
          },
          {
            label: $t('application.form.authTypeOauth2', 'OAuth2'),
            value: 'oauth2',
          },
        ],
      },
    },
    {
      fieldName: 'authConfig.bearer.token',
      label: $t('application.form.authTypeBearer', 'Bearer Token'),
      component: 'Input',
      componentProps: {
        placeholder: $t(
          'application.form.bearerTokenPlaceholder',
          '请输入 Token',
        ),
      },
      dependencies: {
        show: (values: Record<string, any>) =>
          values['authConfig.type'] === 'bearer',
        triggerFields: ['authConfig.type'],
      },
    },
    {
      fieldName: 'authConfig.basic.username',
      label: $t('application.form.basicUsername', 'Basic 用户名'),
      component: 'Input',
      componentProps: {
        placeholder: $t(
          'application.form.basicUsernamePlaceholder',
          '请输入用户名',
        ),
      },
      dependencies: {
        show: (values: Record<string, any>) =>
          values['authConfig.type'] === 'basic',
        triggerFields: ['authConfig.type'],
      },
    },
    {
      fieldName: 'authConfig.basic.password',
      label: $t('application.form.basicPassword', 'Basic 密码'),
      component: 'InputPassword',
      componentProps: {
        placeholder: $t(
          'application.form.basicPasswordPlaceholder',
          '请输入密码',
        ),
      },
      dependencies: {
        show: (values: Record<string, any>) =>
          values['authConfig.type'] === 'basic',
        triggerFields: ['authConfig.type'],
      },
    },
    {
      fieldName: 'authConfig.oauth2.grantType',
      label: $t('application.form.oauth2GrantType', 'OAuth2 授权类型'),
      component: 'Select',
      componentProps: {
        options: [
          {
            label: $t(
              'application.form.oauth2GrantTypeClientCred',
              '凭证模式 (client_credentials)',
            ),
            value: 'client_credentials',
          },
          {
            label: $t(
              'application.form.oauth2GrantTypeAuthCode',
              '授权码模式 (authorization_code)',
            ),
            value: 'authorization_code',
          },
        ],
      },
      dependencies: {
        show: (values: Record<string, any>) =>
          values['authConfig.type'] === 'oauth2',
        triggerFields: ['authConfig.type'],
      },
    },
    {
      fieldName: 'authConfig.oauth2.clientId',
      label: $t('application.form.oauth2ClientId', 'OAuth2 Client ID'),
      component: 'Input',
      componentProps: {
        placeholder: $t(
          'application.form.oauth2ClientIdPlaceholder',
          '请输入 Client ID',
        ),
      },
      dependencies: {
        show: (values: Record<string, any>) =>
          values['authConfig.type'] === 'oauth2',
        triggerFields: ['authConfig.type'],
      },
    },
    {
      fieldName: 'authConfig.oauth2.clientSecret',
      label: $t('application.form.oauth2ClientSecret', 'OAuth2 Client Secret'),
      component: 'InputPassword',
      componentProps: {
        placeholder: $t(
          'application.form.oauth2ClientSecretPlaceholder',
          '请输入 Client Secret',
        ),
      },
      dependencies: {
        show: (values: Record<string, any>) =>
          values['authConfig.type'] === 'oauth2',
        triggerFields: ['authConfig.type'],
      },
    },
    {
      fieldName: 'authConfig.oauth2.tokenUrl',
      label: $t('application.form.oauth2TokenUrl', '获取令牌地址 (Token URL)'),
      component: 'Input',
      rules: z
        .string()
        .url($t('common.invalidUrl', '请输入正确的URL地址'))
        .optional()
        .or(z.literal('')),
      helpMessage: $t(
        'application.form.oauth2TokenUrlHelp',
        '填入获取 Access Token 的标准接口地址。',
      ),
      componentProps: {
        placeholder: $t(
          'application.form.oauth2TokenUrlPlaceholder',
          '例如 https://.../token',
        ),
      },
      dependencies: {
        show: (values: Record<string, any>) =>
          values['authConfig.type'] === 'oauth2',
        triggerFields: ['authConfig.type'],
      },
    },
  ],
};

// ============== API Server Strategy ==============

export const apiServerStrategy: IntegrationFormStrategy = {
  key: 'apiServer',
  label: $t('application.integration.apiServer', 'API服务端'),
  buildSchema: () =>
    [
      {
        fieldName: 'clientId',
        label: $t('application.form.apiServerClientId', '应用标识 (client_id)'),
        component: 'Input',
        help: $t(
          'application.form.apiServerClientIdHelp',
          '等于应用ID，作为 API 调用的凭证之一。',
        ),
        componentProps: {
          disabled: true,
          placeholder: $t(
            'application.form.apiServerClientIdPlaceholder',
            '应用标识 (自动分配)',
          ),
        },
        dependencies: {
          show: (values: Record<string, any>) => !!values.clientId,
          triggerFields: ['clientId'],
        },
      },
      {
        fieldName: 'secureKey',
        label: $t(
          'application.form.apiServerSecureKey',
          '安全密钥 (secureKey/client_secret)，不填自动生成',
        ),
        component: 'InputPassword',
        help: $t(
          'application.form.apiServerSecureKeyHelp',
          '用于客户端签名或换取调用 IoT 平台的凭证密钥。',
        ),
        componentProps: {
          placeholder: $t(
            'application.form.apiServerSecureKeyPlaceholder',
            '留空将由系统自动生成',
          ),
        },
        dependencies: {
          rules: (values: Record<string, any>) =>
            values.clientId ? 'required' : undefined,
          triggerFields: ['clientId'],
        },
      },
      {
        fieldName: 'signature',
        label: $t('application.form.signatureMethod', '签名方式'),
        component: 'Select',
        rules: 'required',
        defaultValue: SIGNATURE_METHOD.MD5.value,
        help: $t(
          'application.form.signatureMethodHelp',
          '当通过签名方式访问接口时会用到',
        ),
        componentProps: {
          placeholder: $t(
            'application.form.signatureMethodPlaceholder',
            '请选择签名方式',
          ),
          options: Object.values(SIGNATURE_METHOD),
        },
      },
      {
        fieldName: 'ipWhiteList',
        label: $t('application.form.ipWhiteList', 'IP白名单'),
        component: 'Textarea',
        help: $t(
          'application.form.ipWhiteListHelp',
          '多个地址以英文逗号分隔，置空则表示不限制。',
        ),
        componentProps: {
          placeholder: $t(
            'application.form.ipWhiteListPlaceholder',
            '例如: 192.168.1.1,10.0.0.1 (可选)',
          ),
        },
      },
      {
        fieldName: 'redirectUri',
        label: $t(
          'application.form.apiServerRedirectUri',
          '回调地址 (Redirect URI)',
        ),
        component: 'Input',
        rules: z
          .string()
          .url($t('common.invalidUrl', '请输入正确的URL地址'))
          .min(1, $t('common.required', '此项为必填项')),
        help: $t(
          'application.form.apiServerRedirectUriHelp',
          '服务端的合法重定向或预留 Webhook 地址。',
        ),
        componentProps: {
          placeholder: $t(
            'application.form.apiServerRedirectUriPlaceholder',
            '请输入合法的回调重定向地址',
          ),
        },
      },
      {
        fieldName: 'roleIdList',
        label: $t('application.form.apiServerRoleList', '通过服务开通默认角色'),
        component: 'ApiSelect',
        help: $t(
          'application.form.apiServerRoleListHelp',
          'API 调用者若通过此配置自动关联出身份模型，将继承下列角色。',
        ),
        rules: 'required',
        componentProps: {
          api: async (params: any) => {
            const data = await queryGroupDetailTree(params);
            return data.map((g) => ({
              label: g.groupName,
              options: (g.roles || []).map((r) => ({
                label: r.name,
                value: r.id,
              })),
            }));
          },
          mode: 'multiple',
        },
      },
      {
        fieldName: 'orgIdList',
        label: $t('application.form.apiServerOrgList', '通过服务开通默认组织'),
        component: 'ApiTreeSelect',
        help: $t(
          'application.form.apiServerOrgListHelp',
          '如上同理，将作为关联身份的基础组织部门。',
        ),
        componentProps: {
          api: getOrganizationTree,
          fieldNames: { children: 'children', label: 'name', value: 'id' },
          multiple: true,
          treeDefaultExpandAll: true,
        },
      },
    ] as VbenFormSchema[],
};

// ============== Page Strategy ==============

export const pageIntegrationStrategy: IntegrationFormStrategy = {
  key: 'page',
  label: $t('application.integration.page', '页面集成'),
  buildSchema: () => [
    {
      fieldName: 'baseUrl',
      label: $t('application.form.pageBaseUrl', '页面根地址 (Base URL)'),
      component: 'Input',
      rules: z
        .string()
        .url($t('common.invalidUrl', '请输入正确的URL地址'))
        .min(1, $t('common.required', '此项为必填项')),
      helpMessage: $t(
        'application.form.pageBaseUrlHelp',
        '外部 UI 页面的起始入口地址，如 https://my-app.com/',
      ),
      componentProps: {
        placeholder: $t(
          'application.form.pageBaseUrlPlaceholder',
          '例如 https://my-app.com/',
        ),
      },
    },
    {
      fieldName: 'owner',
      label: $t('application.form.pageOwner', '页面所属标识 (Owner)'),
      component: 'Input',
      helpMessage: $t(
        'application.form.pageOwnerHelp',
        '用于写入页面菜单 owner；不填时后端默认回退到应用ID。',
      ),
      componentProps: {
        placeholder: $t(
          'application.form.pageOwnerPlaceholder',
          '例如 internal-view（选填）',
        ),
      },
    },
    {
      // 页面集成 V1 只支持根据远端系统的路由模式自动拼接 iframe 地址。
      fieldName: 'routeType',
      label: $t('application.form.pageRouteType', '页面路由模式'),
      component: 'Select',
      defaultValue: 'hash',
      componentProps: {
        options: [
          {
            label: $t('application.form.pageRouteTypeHash', 'Hash 路由'),
            value: 'hash',
          },
          {
            label: $t('application.form.pageRouteTypeHistory', 'History 路由'),
            value: 'history',
          },
        ],
      },
      helpMessage: $t(
        'application.form.pageRouteTypeHelp',
        '用于拼接远端页面访问地址；Hash 路由会自动生成 /#/path 形式。',
      ),
    },
    {
      fieldName: 'requestQueryMenuApi',
      label: $t('application.form.pageMenuApi', '菜单查询接口路径'),
      component: 'Input',
      helpMessage: $t(
        'application.form.pageMenuApiHelp',
        '拉取动态子菜单的通信路径（如果不填将不拉取子集）。',
      ),
      componentProps: {
        placeholder: $t(
          'application.form.pageMenuApiPlaceholder',
          '例如 /api/menus (选填)',
        ),
      },
    },
  ],
};
export const integrationStrategies = {
  ssoClient: ssoClientStrategy,
  apiClient: apiClientStrategy,
  apiServer: apiServerStrategy,
  page: pageIntegrationStrategy,
};
