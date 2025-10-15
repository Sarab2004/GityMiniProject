import type { Resource, PermissionEntry, AdminUser, OrgNode } from "../types/admin";
import * as AdminAPI from "../lib/api/admin";

// یک نمونه PermissionEntry صرفاً برای تایپ‌چک
const p: PermissionEntry = { resource: "forms", can_create: true, can_read: true, can_update: false, can_delete: false };

// کمک‌تابع برای تایپ‌چک
function expectType<T>(_v: T) {}

// تایپ خروجی‌ها را چک می‌کنیم (بدون اجرا)
expectType<Promise<AdminUser[]>>(AdminAPI.getAdminUsers());
expectType<Promise<AdminUser>>(AdminAPI.createAdminUser({ username:"x", password:"y", role_slug:"ceo" }));
expectType<Promise<AdminUser>>(AdminAPI.updateAdminUser(1, { permissions: [p], role_slug:"hse_manager" }));
expectType<Promise<void>>(AdminAPI.deleteAdminUser(1, true));

expectType<Promise<OrgNode[] | OrgNode>>(AdminAPI.getOrgTree(true));
expectType<Promise<OrgNode>>(AdminAPI.createChildUser({ parent_id: 1, username:"child", password:"pw", role_slug:"hse_officer" }));
expectType<Promise<OrgNode>>(AdminAPI.moveUser(1, null));
expectType<Promise<OrgNode>>(AdminAPI.renameUser(1, "New Name"));
expectType<Promise<void>>(AdminAPI.deleteUserFromOrg(1, true));

expectType<Promise<Record<Resource,{create:boolean;read:boolean;update:boolean;delete:boolean}>>>(AdminAPI.getMyPermissions());
