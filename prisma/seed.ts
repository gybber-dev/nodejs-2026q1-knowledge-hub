import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = parseInt(process.env.CRYPT_SALT ?? '10', 10);

async function main() {
  // Clean up existing data (order matters: dependents first)
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const adminPasswordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { login: 'admin' },
    update: { password: adminPasswordHash },
    create: { login: 'admin', password: adminPasswordHash, role: 'admin' },
  });

  const editorPasswordHash = await bcrypt.hash('editor123', SALT_ROUNDS);
  const editor = await prisma.user.upsert({
    where: { login: 'editor' },
    update: { password: editorPasswordHash },
    create: { login: 'editor', password: editorPasswordHash, role: 'editor' },
  });

  // Categories
  const catTech = await prisma.category.upsert({
    where: { id: 'cat-tech-001' },
    update: {},
    create: {
      id: 'cat-tech-001',
      name: 'Technology',
      description: 'Tech articles',
    },
  });

  const catScience = await prisma.category.upsert({
    where: { id: 'cat-sci-001' },
    update: {},
    create: {
      id: 'cat-sci-001',
      name: 'Science',
      description: 'Science articles',
    },
  });

  const catDesign = await prisma.category.upsert({
    where: { id: 'cat-des-001' },
    update: {},
    create: {
      id: 'cat-des-001',
      name: 'Design',
      description: 'Design articles',
    },
  });

  // Articles
  const article1 = await prisma.article.create({
    data: {
      title: 'Getting Started with Node.js',
      content: 'Node.js is a JavaScript runtime built on Chrome V8 engine.',
      status: 'published',
      authorId: admin.id,
      categoryId: catTech.id,
      tags: {
        connectOrCreate: [
          { where: { name: 'nodejs' }, create: { name: 'nodejs' } },
          { where: { name: 'javascript' }, create: { name: 'javascript' } },
        ],
      },
    },
  });

  const article2 = await prisma.article.create({
    data: {
      title: 'TypeScript Best Practices',
      content: 'TypeScript adds static typing to JavaScript.',
      status: 'published',
      authorId: editor.id,
      categoryId: catTech.id,
      tags: {
        connectOrCreate: [
          { where: { name: 'typescript' }, create: { name: 'typescript' } },
          { where: { name: 'javascript' }, create: { name: 'javascript' } },
        ],
      },
    },
  });

  const article3 = await prisma.article.create({
    data: {
      title: 'Introduction to Docker',
      content: 'Docker is a platform for containerizing applications.',
      status: 'draft',
      authorId: admin.id,
      categoryId: catTech.id,
      tags: {
        connectOrCreate: [
          { where: { name: 'docker' }, create: { name: 'docker' } },
          { where: { name: 'devops' }, create: { name: 'devops' } },
        ],
      },
    },
  });

  await prisma.article.create({
    data: {
      title: 'Quantum Computing Explained',
      content: 'Quantum computing uses quantum-mechanical phenomena.',
      status: 'published',
      authorId: editor.id,
      categoryId: catScience.id,
      tags: {
        connectOrCreate: [
          { where: { name: 'science' }, create: { name: 'science' } },
        ],
      },
    },
  });

  await prisma.article.create({
    data: {
      title: 'UI Design Principles',
      content: 'Good UI design focuses on user experience and clarity.',
      status: 'archived',
      authorId: admin.id,
      categoryId: catDesign.id,
      tags: {
        connectOrCreate: [
          { where: { name: 'design' }, create: { name: 'design' } },
        ],
      },
    },
  });

  // Comments
  await prisma.comment.createMany({
    data: [
      {
        content: 'Great introduction!',
        articleId: article1.id,
        authorId: editor.id,
      },
      {
        content: 'Very helpful, thanks.',
        articleId: article1.id,
        authorId: null,
      },
      {
        content: 'TypeScript is awesome!',
        articleId: article2.id,
        authorId: admin.id,
      },
    ],
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
