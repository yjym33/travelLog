import { PrismaClient, ShareVisibility } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding mock data...');

  // Clean minimal related tables (optional, idempotent-safe approach)
  await prisma.commentLike.deleteMany({});
  await prisma.travelLogComment.deleteMany({});
  await prisma.travelLogLike.deleteMany({});
  await prisma.travelLogShare.deleteMany({});
  await prisma.storyLog.deleteMany({});
  await prisma.story.deleteMany({});
  await prisma.travelLog.deleteMany({});
  await prisma.friendship.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});

  // Users
  const password = await bcrypt.hash('password123', 10);
  const [alice, bob] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alice@example.com',
        password,
        nickname: 'Alice',
        profileImage: null,
        isPublicProfile: true,
        allowFriendRequests: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com',
        password,
        nickname: 'Bob',
        profileImage: null,
        isPublicProfile: true,
        allowFriendRequests: true,
      },
    }),
  ]);

  // Friendship (accepted)
  await prisma.friendship.create({
    data: {
      requesterId: alice.id,
      addresseeId: bob.id,
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    },
  });

  await prisma.user.update({
    where: { id: alice.id },
    data: { friendsCount: 1 },
  });
  await prisma.user.update({
    where: { id: bob.id },
    data: { friendsCount: 1 },
  });

  // Travel Logs
  const seoul = await prisma.travelLog.create({
    data: {
      userId: alice.id,
      lat: 37.5665,
      lng: 126.978,
      placeName: 'Seoul City Hall',
      country: 'Korea',
      emotion: 'happy',
      photos: [],
      diary: '서울 도심 산책과 멋진 사진들!',
      tags: ['Korea', 'City', 'Seoul'],
      visibility: ShareVisibility.PUBLIC,
      allowComments: true,
      allowLikes: true,
    },
  });

  const tokyo = await prisma.travelLog.create({
    data: {
      userId: bob.id,
      lat: 35.6762,
      lng: 139.6503,
      placeName: 'Shibuya Crossing',
      country: 'Japan',
      emotion: 'excited',
      photos: [],
      diary: '시부야 스크램블 교차로의 에너지!',
      tags: ['Japan', 'Tokyo', 'Night'],
      visibility: ShareVisibility.FRIENDS,
      allowComments: true,
      allowLikes: true,
    },
  });

  const paris = await prisma.travelLog.create({
    data: {
      userId: alice.id,
      lat: 48.8584,
      lng: 2.2945,
      placeName: 'Eiffel Tower',
      country: 'France',
      emotion: 'romantic',
      photos: [],
      diary: '에펠탑 아래에서의 황혼.',
      tags: ['France', 'Paris', 'Tower'],
      visibility: ShareVisibility.PUBLIC,
      allowComments: true,
      allowLikes: true,
    },
  });

  // Likes
  await prisma.travelLogLike.create({
    data: { travelLogId: seoul.id, userId: bob.id },
  });
  await prisma.travelLog.update({
    where: { id: seoul.id },
    data: { likeCount: { increment: 1 } },
  });

  // Comments
  const c1 = await prisma.travelLogComment.create({
    data: {
      travelLogId: seoul.id,
      userId: bob.id,
      content: '정말 멋진 사진들이에요! 꼭 가보고 싶어요.',
    },
  });
  await prisma.travelLog.update({
    where: { id: seoul.id },
    data: { commentCount: { increment: 1 } },
  });

  await prisma.travelLogComment.create({
    data: {
      travelLogId: seoul.id,
      userId: alice.id,
      parentId: c1.id,
      content: '고마워요! 다음엔 함께 가요 :)',
    },
  });
  await prisma.travelLogComment.update({
    where: { id: c1.id },
    data: { replyCount: { increment: 1 } },
  });
  await prisma.travelLog.update({
    where: { id: seoul.id },
    data: { commentCount: { increment: 1 } },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
