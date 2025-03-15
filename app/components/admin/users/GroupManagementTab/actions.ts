'use server';
import { groupModels, groups, llmModels } from '@/app/db/schema';
import { db } from '@/app/db';
import { eq, inArray } from 'drizzle-orm';
import { auth } from "@/auth";

type GroupWithModels = Awaited<ReturnType<typeof db.query.groups.findMany>>[number] & {
  models: {
    model: {
      id: number;
      name: string;
      displayName: string;
      provider: {
        providerName: string;
        provider: string;
      };
    };
  }[];
}

export async function getGroupList() {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    const result = await db.query.groups.findMany({
      with: {
        models: {
          with: {
            model: {
              columns: {
                id: true,
                name: true,
                displayName: true,
                createdAt: true,
                updatedAt: true,
              },
              with: {
                provider: {
                  columns: {
                    providerName: true,
                    provider: true
                  }
                } as const
              }
            }
          }
        }
      },
      orderBy: (groups) => [groups.createdAt],
    });

    const groupsTableList = result.map(group => ({
      id: group.id,
      name: group.name,
      modelProviderList: (group as unknown as GroupWithModels).models.map(m => `${m.model.provider.providerName || 'unknown'} | ${m.model.displayName}`),
      models: (group as unknown as GroupWithModels).models.map(m => m.model.id),
      modelType: group.modelType,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      isDefault: group.isDefault,
    }))
    return groupsTableList;
  } catch (error) {
    throw new Error('query group list fail: \n' + error);
  }
}

export async function addGroup(GroupInfo: { name: string, modelType?: 'all' | 'specific', models?: number[] }) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  let allModels: typeof llmModels.$inferSelect[] = []
  try {
    if (GroupInfo.modelType === 'all') {
      allModels = []
    } else if (GroupInfo.models?.length) {
      allModels = await db.query.llmModels.findMany({
        where: (inArray(llmModels.id, GroupInfo.models))
      })

    }
    const result = await db.insert(groups).values({
      name: GroupInfo.name,
      modelType: GroupInfo.modelType,
    }).returning()
    if (allModels.length > 0) {
      await db.insert(groupModels)
        .values(
          allModels.map(model => ({
            groupId: result[0].id,
            modelId: model.id,
          }))
        )
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      message: 'database add error',
    }
  }
}


export async function deleteGroup(groupId: string) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId)
    });

    if (group?.isDefault) {
      return {
        success: false,
        message: 'Cannot delete default group'
      };
    }
    await db.delete(groups).where(eq(groups.id, groupId));
    return {
      success: true,
      message: 'delete success'
    }
  } catch (error) {
    return {
      success: false,
      message: 'delete fail'
    }
  }
}
export async function updateGroup(groupId: string, groupInfo: {
  models?: number[];
  name: string;
  modelType: 'all' | 'specific';
}) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  let allModels: typeof llmModels.$inferSelect[] = []
  try {
    if (groupInfo.modelType === 'all') {
      allModels = []
    } else if (groupInfo.models?.length) {
      allModels = await db.query.llmModels.findMany({
        where: (inArray(llmModels.id, groupInfo.models))
      })

    }
    await db.update(groups)
      .set({
        name: groupInfo.name,
        modelType: groupInfo.modelType
      })
      .where(eq(groups.id, groupId));
    await db.delete(groupModels)
      .where(eq(groupModels.groupId, groupId));
    if (allModels.length > 0) {
      await db.insert(groupModels)
        .values(
          allModels.map(model => ({
            groupId: groupId,
            modelId: model.id,
          }))
        )
    }
    return {
      success: true,
      message: 'update success'
    }
  } catch (error) {
    return {
      success: false,
      message: 'update fail \n' + error
    }
  }
}
