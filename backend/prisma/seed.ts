import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'decoracao' }, update: {}, create: { name: 'Decoração', slug: 'decoracao', description: 'Peças decorativas únicas', icon: '🏠' } }),
    prisma.category.upsert({ where: { slug: 'pecas-mecanicas' }, update: {}, create: { name: 'Peças Mecânicas', slug: 'pecas-mecanicas', description: 'Componentes e engrenagens', icon: '⚙️' } }),
    prisma.category.upsert({ where: { slug: 'brinquedos' }, update: {}, create: { name: 'Brinquedos', slug: 'brinquedos', description: 'Brinquedos e miniaturas', icon: '🎮' } }),
    prisma.category.upsert({ where: { slug: 'joias' }, update: {}, create: { name: 'Joias & Acessórios', slug: 'joias', description: 'Peças exclusivas', icon: '💍' } }),
    prisma.category.upsert({ where: { slug: 'utilitarios' }, update: {}, create: { name: 'Utilitários', slug: 'utilitarios', description: 'Produtos do dia a dia', icon: '🔧' } }),
    prisma.category.upsert({ where: { slug: 'educacional' }, update: {}, create: { name: 'Educacional', slug: 'educacional', description: 'Modelos educativos e científicos', icon: '📚' } }),
    prisma.category.upsert({ where: { slug: 'arte' }, update: {}, create: { name: 'Arte', slug: 'arte', description: 'Esculturas e arte 3D', icon: '🎨' } }),
    prisma.category.upsert({ where: { slug: 'automotivo' }, update: {}, create: { name: 'Automotivo', slug: 'automotivo', description: 'Peças e acessórios automotivos', icon: '🚗' } }),
  ]);
  console.log(`✅ ${categories.length} categorias criadas`);

  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@printhub3d.com' },
    update: {},
    create: {
      email: 'admin@printhub3d.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log(`✅ Admin criado: ${admin.email}`);

  const maker1Password = await bcrypt.hash('maker123', 12);
  const maker1User = await prisma.user.upsert({
    where: { email: 'maker1@printhub3d.com' },
    update: {},
    create: {
      email: 'maker1@printhub3d.com',
      password: maker1Password,
      name: 'Carlos Almeida',
      role: 'MAKER',
      isVerified: true,
      phone: '(11) 99999-0001',
    },
  });

  const makerProfile1 = await prisma.makerProfile.upsert({
    where: { userId: maker1User.id },
    update: {},
    create: {
      userId: maker1User.id,
      companyName: 'AlmeidaTech 3D',
      bio: 'Especialista em impressão 3D com mais de 5 anos de experiência. Trabalho com PLA, ABS, PETG e resinas. Produção rápida e qualidade garantida.',
      status: 'ACTIVE',
      rating: 4.8,
      totalReviews: 47,
      totalOrders: 152,
      responseTime: 2,
      latitude: -23.5505,
      longitude: -46.6333,
      city: 'São Paulo',
      state: 'SP',
      printers: ['Creality Ender 3 Pro', 'Bambu Lab P1P', 'Elegoo Saturn 3'],
      materials: ['PLA', 'ABS', 'PETG', 'Resina', 'TPU'],
      maxBuildVolume: '300x300x400mm',
      kycStatus: 'APPROVED',
    },
  });

  const maker2Password = await bcrypt.hash('maker123', 12);
  const maker2User = await prisma.user.upsert({
    where: { email: 'maker2@printhub3d.com' },
    update: {},
    create: {
      email: 'maker2@printhub3d.com',
      password: maker2Password,
      name: 'Fernanda Costa',
      role: 'MAKER',
      isVerified: true,
      phone: '(21) 99999-0002',
    },
  });

  const makerProfile2 = await prisma.makerProfile.upsert({
    where: { userId: maker2User.id },
    update: {},
    create: {
      userId: maker2User.id,
      companyName: 'FernaPrint Studio',
      bio: 'Artesã digital especializada em joias, arte e decoração. Cada peça é única e produzida com amor e dedicação.',
      status: 'ACTIVE',
      rating: 4.9,
      totalReviews: 89,
      totalOrders: 267,
      responseTime: 1,
      latitude: -22.9068,
      longitude: -43.1729,
      city: 'Rio de Janeiro',
      state: 'RJ',
      printers: ['Bambu Lab X1C', 'Formlabs Form 3'],
      materials: ['Resina', 'PLA+', 'PETG', 'Nylon'],
      maxBuildVolume: '256x256x256mm',
      kycStatus: 'APPROVED',
    },
  });

  const client1Password = await bcrypt.hash('client123', 12);
  const client1 = await prisma.user.upsert({
    where: { email: 'cliente@printhub3d.com' },
    update: {},
    create: {
      email: 'cliente@printhub3d.com',
      password: client1Password,
      name: 'João Silva',
      role: 'CLIENT',
      isVerified: true,
      phone: '(11) 98888-0001',
    },
  });
  console.log(`✅ Usuários criados: ${maker1User.email}, ${maker2User.email}, ${client1.email}`);

  const products = [
    {
      makerId: makerProfile1.id,
      categoryId: categories[1]!.id,
      name: 'Engrenagem Industrial 42mm',
      slug: 'engrenagem-industrial-42mm',
      description: 'Engrenagem de precisão impressa em PLA de alta resistência. Ideal para projetos de robótica, automação e prototipagem. Tolerância de 0.1mm.',
      price: 45.90,
      comparePrice: 65.00,
      material: 'PLA',
      color: 'Preto',
      weight: 45.0,
      dimensions: '42x42x15mm',
      stock: 25,
      isFeatured: true,
      rating: 4.7,
      totalReviews: 23,
      totalSales: 87,
      tags: ['engrenagem', 'industrial', 'robótica', 'automação'],
      images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=800'],
    },
    {
      makerId: makerProfile2.id,
      categoryId: categories[0]!.id,
      name: 'Vaso Geométrico Minimalista',
      slug: 'vaso-geometrico-minimalista',
      description: 'Vaso decorativo com design geométrico único. Impresso em PETG translúcido para um efeito visual deslumbrante. Perfeito para flores artificiais ou como peça de decoração.',
      price: 89.90,
      comparePrice: 120.00,
      material: 'PETG',
      color: 'Translúcido Azul',
      weight: 150.0,
      dimensions: '120x120x200mm',
      stock: 8,
      isFeatured: true,
      rating: 4.9,
      totalReviews: 41,
      totalSales: 134,
      tags: ['vaso', 'decoração', 'geométrico', 'minimalista'],
      images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'],
    },
    {
      makerId: makerProfile1.id,
      categoryId: categories[2]!.id,
      name: 'Miniatura Dragon Age',
      slug: 'miniatura-dragon-age',
      description: 'Miniatura colecionável detalhada de dragão, impressa em resina de alta resolução. Acabamento liso e detalhes precisos. Perfeita para RPG ou decoração.',
      price: 129.90,
      material: 'Resina',
      color: 'Bege/Natural',
      weight: 80.0,
      dimensions: '100x60x80mm',
      stock: 5,
      isFeatured: true,
      rating: 4.8,
      totalReviews: 18,
      totalSales: 45,
      tags: ['miniatura', 'dragão', 'rpg', 'colecionável', 'resina'],
      images: ['https://images.unsplash.com/photo-1631479847584-ad71c0a9a2ad?w=800'],
    },
    {
      makerId: makerProfile2.id,
      categoryId: categories[3]!.id,
      name: 'Anel Personalizado Floral',
      slug: 'anel-personalizado-floral',
      description: 'Anel com design floral delicado, impresso em resina biocompatível. Disponível em diferentes tamanhos. Pode ser personalizado com iniciais.',
      price: 59.90,
      material: 'Resina Biocompatível',
      color: 'Rose Gold',
      weight: 5.0,
      dimensions: '20x20x8mm',
      stock: 15,
      isFeatured: false,
      rating: 5.0,
      totalReviews: 29,
      totalSales: 98,
      tags: ['anel', 'joia', 'floral', 'personalizado'],
      images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800'],
    },
    {
      makerId: makerProfile1.id,
      categoryId: categories[4]!.id,
      name: 'Suporte Ergonômico Smartphone',
      slug: 'suporte-ergonomico-smartphone',
      description: 'Suporte de mesa ajustável para smartphones e tablets. Design ergonômico com ângulo ajustável de 0° a 90°. Compatível com todos os modelos.',
      price: 34.90,
      comparePrice: 49.90,
      material: 'PLA+',
      color: 'Cinza',
      weight: 95.0,
      dimensions: '100x80x120mm',
      stock: 30,
      isFeatured: false,
      rating: 4.6,
      totalReviews: 56,
      totalSales: 203,
      tags: ['suporte', 'smartphone', 'ergonômico', 'mesa'],
      images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'],
    },
    {
      makerId: makerProfile2.id,
      categoryId: categories[5]!.id,
      name: 'Modelo Anatômico Coração',
      slug: 'modelo-anatomico-coracao',
      description: 'Modelo anatômico detalhado do coração humano para fins educacionais. Desmontável em 4 partes. Escala 1:1 baseado em dados médicos reais.',
      price: 189.90,
      material: 'PLA',
      color: 'Vermelho/Rosa',
      weight: 200.0,
      dimensions: '150x100x120mm',
      stock: 3,
      isFeatured: true,
      rating: 4.9,
      totalReviews: 12,
      totalSales: 28,
      tags: ['anatomia', 'educação', 'medicina', 'coração'],
      images: ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800'],
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }
  console.log(`✅ ${products.length} produtos criados`);

  await prisma.order.upsert({
    where: { id: 'seed-order-001' },
    update: {},
    create: {
      id: 'seed-order-001',
      clientId: client1.id,
      makerId: makerProfile1.id,
      status: 'PRINTING',
      subtotal: 45.90,
      shipping: 15.00,
      total: 60.90,
      notes: 'Entregar antes do dia 30',
      estimatedAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items: {
        create: [{
          productId: (await prisma.product.findUnique({ where: { slug: 'engrenagem-industrial-42mm' } }))!.id,
          quantity: 1,
          price: 45.90,
          material: 'PLA',
          color: 'Preto',
        }],
      },
      tracking: {
        create: [
          { status: 'PENDING', description: 'Pedido criado e aguardando confirmação', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { status: 'CONFIRMED', description: 'Pedido confirmado pelo maker', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          { status: 'PRINTING', description: 'Impressão iniciada', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        ],
      },
    },
  });
  console.log(`✅ Pedido de exemplo criado`);

  await prisma.quoteRequest.upsert({
    where: { id: 'seed-quote-001' },
    update: {},
    create: {
      id: 'seed-quote-001',
      clientId: client1.id,
      title: 'Peça customizada para drone',
      description: 'Preciso de um braço de reposição para meu drone DJI Phantom 4. A peça original quebrou e não encontro no mercado.',
      width: 120,
      height: 15,
      depth: 20,
      material: 'ABS',
      resistance: 'Alta',
      quantity: 2,
      budget: 80.00,
      status: 'OPEN',
      latitude: -23.5505,
      longitude: -46.6333,
      city: 'São Paulo',
      state: 'SP',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`✅ Solicitação de orçamento criada`);

  console.log('\n✨ Seed concluído com sucesso!');
  console.log('\n📧 Credenciais de teste:');
  console.log('  Admin:   admin@printhub3d.com  / admin123');
  console.log('  Maker 1: maker1@printhub3d.com / maker123');
  console.log('  Maker 2: maker2@printhub3d.com / maker123');
  console.log('  Cliente: cliente@printhub3d.com / client123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
