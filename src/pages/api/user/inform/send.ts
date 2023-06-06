// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { connectToDatabase, Inform, User } from '@/service/mongo';
import { authUser } from '@/service/utils/auth';
import { InformTypeEnum } from '@/constants/user';

export type Props = {
  type: `${InformTypeEnum}`;
  title: string;
  content: string;
  userId?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await authUser({ req, authRoot: true });

    await connectToDatabase();

    jsonRes(res, {
      data: await sendInform(req.body),
      message: '发送通知成功'
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}

export async function sendInform({ type, title, content, userId }: Props) {
  if (!type || !title || !content) {
    return Promise.reject('参数错误');
  }

  if (userId) {
    await Inform.create({
      type,
      title,
      content,
      userId
    });

    return;
  }

  // send to all user
  const users = await User.find({}, '_id');
  await Inform.insertMany(
    users.map(({ _id }) => ({
      type,
      title,
      content,
      userId: _id
    }))
  );

  return;
}