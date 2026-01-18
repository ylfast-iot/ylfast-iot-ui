import type { UserDetail } from '#/adapter/hsweb/user';
import type {
  BaseSelectorProps,
  SelectorActionType,
} from '#/components/business/common-selector/src/types';

export type UserSelectorProps = BaseSelectorProps;

export type UserSelectorActionType = SelectorActionType<UserDetail>;
