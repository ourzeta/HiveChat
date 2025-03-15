'use server';
import { groups, users } from '@/app/db/schema';
import { db } from '@/app/db';
import { desc, eq } from 'drizzle-orm';
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function getUserList(groupId?: string) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  let result
  try {
    if (!groupId || groupId === '_all') {
      result = await db.query.users.findMany({
        orderBy: [desc(users.createdAt)],
      });
    } else {
      result = await db.query.users.findMany({
        where: eq(users.groupId, groupId),
        orderBy: [desc(users.createdAt)],
        with: {
          group: {
            columns: {
              name: true,
            }
          }
        }
      });
    }

    return result;
  } catch (error) {
    throw new Error('query user list fail');
  }
}

export async function addUser(userBasicInfo: { email: string, password: string, isAdmin: boolean, groupId?: string }) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, userBasicInfo.email),
    });

    if (existingUser) {
      return {
        success: false,
        message: '邮箱已被注册',
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userBasicInfo.password, salt);

    const group = await db.query.groups.findFirst({
      where: userBasicInfo.groupId? eq(groups.id, userBasicInfo.groupId) : undefined,
    });
    if (!group) {
      return {
        success: false,
        message: 'group not found'
      }
    }

    const result = await db.insert(users).values({
      email: userBasicInfo.email,
      password: hashedPassword,
      isAdmin: userBasicInfo.isAdmin,
      groupId: userBasicInfo.groupId
    });
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      message: 'database add error'
    }
  }
}

export async function deleteUser(email: string) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    await db.delete(users).where(eq(users.email, email));
    return {
      success: true,
      message: '未找到对应邮箱的用户'
    }
  } catch (error) {
    return {
      success: false,
      message: 'database delete error'
    }
  }
}

export async function updateUser(email: string, userBasicInfo: { email: string, password?: string, isAdmin: boolean, groupId?: string }) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!existingUser) {
      return {
        success: false,
        message: '该用户不存在',
      };
    }
    const group = await db.query.groups.findFirst({
      where: userBasicInfo.groupId ? eq(groups.id, userBasicInfo.groupId) : undefined,
    });
    if (!group) {
      return {
        success: false,
        message: 'group not found'
      }
    }
    let updateResult = null;
    if (userBasicInfo.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userBasicInfo.password, salt);
      // 更新用户信息
      updateResult = await db.update(users)
        .set({
          email: userBasicInfo.email,
          password: hashedPassword,
          isAdmin: userBasicInfo.isAdmin,
          groupId: userBasicInfo.groupId
        })
        .where(eq(users.email, email));
    } else {
      updateResult = await db.update(users)
        .set({
          email: userBasicInfo.email,
          isAdmin: userBasicInfo.isAdmin,
          groupId: userBasicInfo.groupId
        })
        .where(eq(users.email, email));
    }
    return {
      success: true,
      message: '用户信息已更新',
    };
  } catch (error) {
    return {
      success: false,
      message: 'database update error'
    }
  }
}