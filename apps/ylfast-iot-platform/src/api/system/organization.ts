import type { BasicModel } from '#/api/basic';

import { requestClient } from '#/api/request';
import { parseTemplate } from '#/utils';

export namespace SystemOrganizationApi {
  export interface OrganizationEntity extends BasicModel {
    name: string;
    parentId?: string;
    sortIndex?: number;
    describe?: string; // or description? sticking to common conventions or what role group uses
    children?: OrganizationEntity[];
    [key: string]: any;
  }

  export const basicApi = '/organization';

  export const ApiMethod = {
    tree: `${basicApi}/_all/tree`,
    save: `${basicApi}`,
    update: `${basicApi}/{id}`,
    delete: `${basicApi}/{id}`,
    bindUser: `${basicApi}/{id}/users/_bind`,
    unbindUser: `${basicApi}/{id}/users/_unbind`,
  };
}

/**
 * Get Organization Tree
 */
export const getOrganizationTree = async () => {
  return requestClient.get<SystemOrganizationApi.OrganizationEntity[]>(
    SystemOrganizationApi.ApiMethod.tree,
  );
};

/**
 * Save Organization (Create)
 */
export const saveOrganization = async (
  data: Partial<SystemOrganizationApi.OrganizationEntity>,
) => {
  return requestClient.post<SystemOrganizationApi.OrganizationEntity>(
    SystemOrganizationApi.ApiMethod.save,
    data,
  );
};

/**
 * Update Organization
 */
export const updateOrganization = async (
  id: string,
  data: Partial<SystemOrganizationApi.OrganizationEntity>,
) => {
  return requestClient.put<SystemOrganizationApi.OrganizationEntity>(
    `${SystemOrganizationApi.basicApi}/${id}`,
    data,
  );
};

/**
 * Delete Organization
 */
export const deleteOrganization = async (id: string) => {
  return requestClient.delete<boolean>(
    `${SystemOrganizationApi.basicApi}/${id}`,
  );
};

/**
 * Bind Users to Organization
 * Note: The requirement mentioned "Batch Bind User", usually this involves sending a list of user IDs to an endpoint.
 * Since the specific API for binding wasn't explicitly provided in the prompt's snippet (it only mentioned the query condition),
 * I will assume a standard pattern or maybe it uses the `saveUser` with modified orgId?
 *
 * Wait, the prompt says: "Table operations... Batch Bind User... Batch Unbind".
 * Usually this implies an association table or an endpoint.
 * I will assume endpoints like `/organization/{orgId}/users` (POST/DELETE) or similar exists.
 * If not, I'll have to adjust later. For now I will define placeholders.
 */

export const bindUsersToOrg = async (orgId: string, userIds: string[]) => {
  return requestClient.post(
    parseTemplate(SystemOrganizationApi.ApiMethod.bindUser, { id: orgId }),
    userIds,
  );
};

export const unbindUsersFromOrg = async (orgId: string, userIds: string[]) => {
  return requestClient.post(
    parseTemplate(SystemOrganizationApi.ApiMethod.unbindUser, { id: orgId }),
    userIds,
  );
};
