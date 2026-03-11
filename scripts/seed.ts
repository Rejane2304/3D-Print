import { PrismaClient } from "@prisma/client";
// importación eliminada: User y Product no existen como exportación directa en @prisma/client
import bcrypt from "bcryptjs";
import { updateAllProductPrices } from "../lib/pricing-service.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de base de datos...");

  // Limpiar datos existentes (en orden correcto por dependencias)
  // Limpiar Alert primero (alertas admin)
  await prisma.alert.deleteMany();
  // Limpiar PointsTransaction, ignorar error si no existe
  await prisma.pointsTransaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productPrice.deleteMany();
  await prisma.product.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.material.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.newsletter.deleteMany();

  console.log("🧹 Base de datos limpiada");

  // ========================================
  // MATERIALES
  // ========================================
  const [matPLA, matPETG, matASA, matTPU] = await Promise.all([
    prisma.material.create({
      data: {
        name: "PLA Basic",
        code: "PLA",
        pricePerKg: 20,
        maintenanceFactor: 0.03,
        density: 1.24,
        description:
          "Ideal para prototipos, figuras y objetos decorativos. Biodegradable.",
        inStock: true,
      },
    }),
    prisma.material.create({
      data: {
        name: "PETG Basic",
        code: "PETG",
        pricePerKg: 25,
        maintenanceFactor: 0.04,
        density: 1.27,
        description:
          "Alta resistencia y durabilidad. Perfecto para piezas mecánicas y exteriores.",
        inStock: true,
      },
    }),
    prisma.material.create({
      data: {
        name: "ASA",
        code: "ASA",
        pricePerKg: 30,
        maintenanceFactor: 0.05,
        density: 1.07,
        description:
          "Resistente a UV. Ideal para aplicaciones industriales y automoción.",
        inStock: true,
      },
    }),
    prisma.material.create({
      data: {
        name: "TPU Flexible",
        code: "TPU",
        pricePerKg: 35,
        maintenanceFactor: 0.06,
        density: 1.21,
        description:
          "Material flexible. Para juntas, fundas y piezas que requieren elasticidad.",
        inStock: true,
      },
    }),
  ]);
  console.log("✅ 4 materiales creados (PLA, PETG, ASA, TPU)");

  // ========================================
  // INVENTARIO INICIAL
  // ========================================
  await Promise.all([
    prisma.inventory.create({
      data: {
        materialId: matPLA.id,
        quantity: 5000,
        minStock: 500,
        location: "Estante A-1",
      },
    }),
    prisma.inventory.create({
      data: {
        materialId: matPETG.id,
        quantity: 4000,
        minStock: 500,
        location: "Estante A-2",
      },
    }),
    prisma.inventory.create({
      data: {
        materialId: matASA.id,
        quantity: 2000,
        minStock: 300,
        location: "Estante B-1",
      },
    }),
    prisma.inventory.create({
      data: {
        materialId: matTPU.id,
        quantity: 1500,
        minStock: 300,
        location: "Estante B-2",
      },
    }),
  ]);
  console.log("✅ Inventario inicial creado");

  // ========================================
  // CUPONES DE DESCUENTO
  // ========================================
  await Promise.all([
    prisma.coupon.create({
      data: {
        code: "BIENVENIDO10",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minPurchase: 20,
        maxUses: 100,
        validFrom: new Date("2026-01-01"),
        validUntil: new Date("2026-12-31"),
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: "PROMO5EUR",
        discountType: "FIXED",
        discountValue: 5,
        minPurchase: 30,
        maxUses: 50,
        validFrom: new Date("2026-01-01"),
        validUntil: new Date("2026-06-30"),
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: "VERANO20",
        discountType: "PERCENTAGE",
        discountValue: 20,
        minPurchase: 50,
        maxUses: 200,
        validFrom: new Date("2026-06-21"),
        validUntil: new Date("2026-09-22"),
        isActive: true,
      },
    }),
  ]);
  console.log("✅ 3 cupones de descuento creados");

  // ========================================
  // USUARIOS
  // ========================================
  const hashedAdminPassword = await bcrypt.hash("johndoe123", 10);
  const hashedClientPassword = await bcrypt.hash("cliente123", 10);
  const hashedUserPassword = await bcrypt.hash("user12345", 10);

  // Admin
  await prisma.user.create({
    data: {
      email: "john@doe.com",
      name: "John Doe (Admin)",
      password: hashedAdminPassword,
      role: "admin",
      phone: "+34 612 000 001",
      address: "Calle Admin 1",
      city: "Barcelona",
      state: "Cataluña",
      zipCode: "08001",
      country: "España",
      loyaltyPoints: 500,
    },
  });
  console.log("✅ Admin creado: john@doe.com / johndoe123");

  // Usuario de prueba
  const testUser = await prisma.user.create({
    data: {
      email: "cliente@test.com",
      name: "Cliente Test",
      password: hashedClientPassword,
      role: "user",
      phone: "+34 612 000 002",
      address: "Calle Test 123",
      city: "Madrid",
      state: "Madrid",
      zipCode: "28001",
      country: "España",
      loyaltyPoints: 150,
    },
  });
  console.log("✅ Usuario de prueba creado: cliente@test.com / cliente123");

  // 20 Clientes ficticios
  const clientNames = [
    "María García",
    "Carlos López",
    "Ana Martínez",
    "Pedro Sánchez",
    "Laura Fernández",
    "Miguel González",
    "Carmen Ruiz",
    "Javier Díaz",
    "Sofía Moreno",
    "David Jiménez",
    "Elena Álvarez",
    "Pablo Romero",
    "Lucia Torres",
    "Andrés Vargas",
    "Isabel Ramos",
    "Fernando Castro",
    "Patricia Ortega",
    "Raúl Muñoz",
    "Cristina Blanco",
    "Alberto Gil",
  ];

  const cities = [
    "Barcelona",
    "Madrid",
    "Valencia",
    "Sevilla",
    "Bilbao",
    "Málaga",
    "Zaragoza",
  ];

  const clients = [];
  for (let i = 0; i < clientNames.length; i++) {
    const client = await prisma.user.create({
      data: {
        email: `cliente${i + 1}@email.com`,
        name: clientNames[i],
        password: hashedUserPassword,
        role: "user",
        phone: `+34 6${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`,
        address: `Calle ${["Mayor", "Gran Vía", "Diagonal", "Paseo"][i % 4]} ${i + 1}`,
        city: cities[i % cities.length],
        state: cities[i % cities.length],
        zipCode: String(10000 + i * 1000),
        country: "España",
        loyaltyPoints: Math.floor(Math.random() * 300),
      },
    });
    clients.push(client);
  }
  console.log("✅ 20 clientes ficticios creados");

  // ========================================
  // 30 PRODUCTOS CON PRECIOS REALES
  // printTimeMinutes estimado por dimensiones y complejidad
  // ========================================
  const products = [
    // DECORACIÓN (10 productos)
    {
      name: "Maceta Geométrica Hexagonal",
      description:
        "Elegante maceta con diseño hexagonal moderno. Perfecta para suculentas y cactus. Incluye orificio de drenaje.",
      category: "Decoracion",
      material: "PLA",
      basePricePerGram: 0.045,
      density: 1.24,
      finishCost: 2.5,
      printTimeMinutes: 90,
      isActive: true,
      defaultDimX: 12,
      defaultDimY: 12,
      defaultDimZ: 10,
      minDimX: 8,
      maxDimX: 20,
      minDimY: 8,
      maxDimY: 20,
      minDimZ: 8,
      maxDimZ: 15,
      images: [
        "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTg0K5kVsA11CeMd9GA8jiWcVaBMEmQwkMyn3ObfkjlwaYbX9GtJBK95AWXlpV_nHRXbVUJDa7ZPf-Z1hJ-YPZWHsqbwpu1Jv2NafKWsqVs0g&usqp=CAc",
      ],
      // colors: ["Blanco", "Negro", "Verde Salvia", "Terracota"],
      stock: 45,
      rating: 4.8,
      reviewCount: 32,
      featured: true,
    },
    {
      name: "Lámpara de Mesa Voronoi",
      description:
        "Lámpara decorativa con patrón Voronoi que crea efectos de luz únicos. Compatible con bombillas E27 LED.",
      category: "Decoracion",
      material: "PLA",
      basePricePerGram: 0.048,
      density: 1.24,
      finishCost: 5,
      printTimeMinutes: 240,
      isActive: true,
      defaultDimX: 15,
      defaultDimY: 15,
      defaultDimZ: 25,
      minDimX: 12,
      maxDimX: 25,
      minDimY: 12,
      maxDimY: 25,
      minDimZ: 20,
      maxDimZ: 35,
      images: [
        "https://www.myminifactory.com/object/3d-print-voronoi-lamp-2-lq-10681",
      ],
      colors: ["Blanco", "Amarillo", "Naranja"],
      stock: 28,
      rating: 4.9,
      reviewCount: 47,
      featured: true,
    },
    {
      name: "Estatua Dragón Articulado",
      description:
        "Impresionante dragón articulado con 15 segmentos móviles. Pieza decorativa y juguete de colección.",
      category: "Figuras",
      material: "PETG",
      basePricePerGram: 0.055,
      density: 1.27,
      finishCost: 4,
      printTimeMinutes: 300,
      isActive: true,
      defaultDimX: 30,
      defaultDimY: 8,
      defaultDimZ: 10,
      minDimX: 20,
      maxDimX: 50,
      minDimY: 5,
      maxDimY: 12,
      minDimZ: 6,
      maxDimZ: 15,
      images: [
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuNHho7MtkH_iQtkNcm7xGzSbpiqKyqHsRqg&s",
      ],
      colors: ["Rojo Metálico", "Dorado", "Negro", "Verde Esmeralda"],
      stock: 35,
      rating: 4.7,
      reviewCount: 89,
      featured: true,
    },
    {
      name: "Jarrón Espiral Minimalista",
      description:
        "Jarrón con diseño espiral elegante. Ideal para flores secas o como pieza decorativa independiente.",
      category: "Decoracion",
      material: "PLA",
      basePricePerGram: 0.042,
      density: 1.24,
      finishCost: 3,
      printTimeMinutes: 120,
      isActive: true,
      defaultDimX: 10,
      defaultDimY: 10,
      defaultDimZ: 20,
      minDimX: 8,
      maxDimX: 15,
      minDimY: 8,
      maxDimY: 15,
      minDimZ: 15,
      maxDimZ: 30,
      images: [
        "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600",
      ],
      colors: ["Blanco Mate", "Gris", "Rosa Pálido", "Azul Cielo"],
      stock: 52,
      rating: 4.6,
      reviewCount: 28,
    },
    {
      name: "Portavelas Cristal Geométrico",
      description:
        "Portavelas con forma de cristal facetado. Crea hermosos reflejos de luz con velas tipo t-light.",
      category: "Decoracion",
      material: "PETG",
      basePricePerGram: 0.052,
      density: 1.27,
      finishCost: 2,
      printTimeMinutes: 75,
      isActive: true,
      defaultDimX: 8,
      defaultDimY: 8,
      defaultDimZ: 12,
      minDimX: 6,
      maxDimX: 12,
      minDimY: 6,
      maxDimY: 12,
      minDimZ: 10,
      maxDimZ: 18,
      images: [
        "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600",
      ],
      colors: ["Transparente", "Azul Transparente", "Rosa Transparente"],
      stock: 67,
      rating: 4.5,
      reviewCount: 41,
    },
    {
      name: "Escultura Abstracta Ondas",
      description:
        "Pieza de arte abstracto con formas ondulantes. Ideal para estanterías y mesas de centro.",
      category: "Decoracion",
      material: "PLA",
      basePricePerGram: 0.05,
      density: 1.24,
      finishCost: 4.5,
      printTimeMinutes: 150,
      isActive: true,
      defaultDimX: 15,
      defaultDimY: 10,
      defaultDimZ: 18,
      minDimX: 10,
      maxDimX: 25,
      minDimY: 8,
      maxDimY: 15,
      minDimZ: 12,
      maxDimZ: 25,
      images: [
        "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=600",
      ],
      colors: ["Blanco", "Negro", "Marmol"],
      stock: 23,
      rating: 4.8,
      reviewCount: 19,
    },
    {
      name: "Reloj de Pared Engranajes",
      description:
        "Reloj decorativo con engranajes visibles estéticos. Mecanismo de cuarzo silencioso incluido.",
      category: "Decoracion",
      material: "PLA",
      basePricePerGram: 0.046,
      density: 1.24,
      finishCost: 8,
      printTimeMinutes: 180,
      isActive: true,
      defaultDimX: 30,
      defaultDimY: 30,
      defaultDimZ: 5,
      minDimX: 25,
      maxDimX: 40,
      minDimY: 25,
      maxDimY: 40,
      minDimZ: 4,
      maxDimZ: 8,
      images: [
        "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=600",
      ],
      colors: ["Negro", "Dorado Antiguo", "Cobre"],
      stock: 18,
      rating: 4.9,
      reviewCount: 56,
    },
    {
      name: "Figura Astronauta Sentado",
      description:
        "Encantadora figura de astronauta en pose relajada. Perfecta para escritorios y estanterías.",
      category: "Figuras",
      material: "PLA",
      basePricePerGram: 0.044,
      density: 1.24,
      finishCost: 3.5,
      printTimeMinutes: 90,
      isActive: true,
      defaultDimX: 8,
      defaultDimY: 10,
      defaultDimZ: 12,
      minDimX: 6,
      maxDimX: 15,
      minDimY: 8,
      maxDimY: 18,
      minDimZ: 10,
      maxDimZ: 20,
      images: [
        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600",
      ],
      colors: ["Blanco", "Plata", "Dorado"],
      stock: 41,
      rating: 4.7,
      reviewCount: 63,
    },
    {
      name: "Macetero Cara Romana",
      description:
        "Macetero con forma de busto clásico romano. Combina arte clásico con funcionalidad moderna.",
      category: "Decoracion",
      material: "PLA",
      basePricePerGram: 0.048,
      density: 1.24,
      finishCost: 4,
      printTimeMinutes: 150,
      isActive: true,
      defaultDimX: 12,
      defaultDimY: 15,
      defaultDimZ: 18,
      minDimX: 10,
      maxDimX: 20,
      minDimY: 12,
      maxDimY: 22,
      minDimZ: 15,
      maxDimZ: 25,
      images: [
        "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600",
      ],
      colors: ["Blanco Mármol", "Terracota", "Gris Piedra"],
      stock: 29,
      rating: 4.6,
      reviewCount: 34,
    },
    {
      name: "Set Figuras Geométricas (5 piezas)",
      description:
        "Conjunto de 5 sólidos platónicos decorativos. Perfecto para decoración minimalista.",
      category: "Figuras",
      material: "PLA",
      basePricePerGram: 0.04,
      density: 1.24,
      finishCost: 6,
      printTimeMinutes: 60,
      isActive: true,
      defaultDimX: 6,
      defaultDimY: 6,
      defaultDimZ: 6,
      minDimX: 4,
      maxDimX: 10,
      minDimY: 4,
      maxDimY: 10,
      minDimZ: 4,
      maxDimZ: 10,
      images: [
        "https://images.unsplash.com/photo-1509909756405-be0199881695?w=600",
      ],
      colors: ["Blanco", "Negro", "Pastel Mix"],
      stock: 38,
      rating: 4.5,
      reviewCount: 22,
    },

    // FUNCIONAL (8 productos)
    {
      name: "Organizador de Escritorio Modular",
      description:
        "Sistema modular con 6 compartimentos para bolígrafos, clips, notas y teléfono. Apilable.",
      category: "Funcional",
      material: "PETG",
      basePricePerGram: 0.055,
      density: 1.27,
      finishCost: 3,
      printTimeMinutes: 120,
      isActive: true,
      defaultDimX: 20,
      defaultDimY: 12,
      defaultDimZ: 10,
      minDimX: 15,
      maxDimX: 30,
      minDimY: 10,
      maxDimY: 18,
      minDimZ: 8,
      maxDimZ: 15,
      images: [
        "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600",
      ],
      colors: ["Negro", "Blanco", "Gris", "Madera Clara"],
      stock: 73,
      rating: 4.8,
      reviewCount: 112,
    },
    {
      name: "Soporte Auriculares Gaming",
      description:
        "Soporte ergonómico para auriculares con base antideslizante. Diseño gaming agresivo.",
      category: "Funcional",
      material: "PETG",
      basePricePerGram: 0.052,
      density: 1.27,
      finishCost: 2.5,
      printTimeMinutes: 150,
      isActive: true,
      defaultDimX: 12,
      defaultDimY: 12,
      defaultDimZ: 25,
      minDimX: 10,
      maxDimX: 15,
      minDimY: 10,
      maxDimY: 15,
      minDimZ: 20,
      maxDimZ: 30,
      images: [
        "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600",
      ],
      colors: ["Negro", "Rojo", "RGB (con LEDs)"],
      stock: 56,
      rating: 4.9,
      reviewCount: 87,
    },
    {
      name: "Caja Herramientas Pequeñas",
      description:
        "Organizador con 12 compartimentos para tornillos, tuercas y pequeñas piezas. Tapa con bisagras.",
      category: "Funcional",
      material: "PETG",
      basePricePerGram: 0.058,
      density: 1.27,
      finishCost: 2,
      printTimeMinutes: 90,
      isActive: true,
      defaultDimX: 18,
      defaultDimY: 12,
      defaultDimZ: 5,
      minDimX: 15,
      maxDimX: 25,
      minDimY: 10,
      maxDimY: 18,
      minDimZ: 4,
      maxDimZ: 8,
      images: [
        "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600",
      ],
      colors: ["Naranja", "Azul", "Negro"],
      stock: 84,
      rating: 4.7,
      reviewCount: 65,
    },
    {
      name: "Soporte Tablet/iPad Ajustable",
      description:
        "Soporte multiángulo para tablets de 7 a 13 pulgadas. 5 posiciones de inclinación.",
      category: "Funcional",
      material: "PETG",
      basePricePerGram: 0.054,
      density: 1.27,
      finishCost: 2,
      printTimeMinutes: 60,
      isActive: true,
      defaultDimX: 15,
      defaultDimY: 12,
      defaultDimZ: 3,
      minDimX: 12,
      maxDimX: 20,
      minDimY: 10,
      maxDimY: 15,
      minDimZ: 2,
      maxDimZ: 5,
      images: [
        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600",
      ],
      colors: ["Blanco", "Negro", "Gris Espacial"],
      stock: 62,
      rating: 4.6,
      reviewCount: 48,
    },
    {
      name: "Gancho de Pared Minimalista (Pack 4)",
      description:
        "Set de 4 ganchos adhesivos de diseño discreto. Soportan hasta 3kg cada uno.",
      category: "Funcional",
      material: "PETG",
      basePricePerGram: 0.05,
      density: 1.27,
      finishCost: 1.5,
      printTimeMinutes: 30,
      isActive: true,
      defaultDimX: 5,
      defaultDimY: 3,
      defaultDimZ: 5,
      minDimX: 4,
      maxDimX: 8,
      minDimY: 2,
      maxDimY: 5,
      minDimZ: 4,
      maxDimZ: 8,
      images: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      ],
      colors: ["Blanco", "Negro", "Roble", "Nogal"],
      stock: 120,
      rating: 4.4,
      reviewCount: 91,
    },
    {
      name: "Soporte Cargador iPhone MagSafe",
      description:
        "Base elegante para cargador MagSafe con gestión de cables. Posición vertical u horizontal.",
      category: "Funcional",
      material: "PLA",
      basePricePerGram: 0.045,
      density: 1.24,
      finishCost: 2,
      printTimeMinutes: 60,
      isActive: true,
      defaultDimX: 8,
      defaultDimY: 8,
      defaultDimZ: 10,
      minDimX: 7,
      maxDimX: 12,
      minDimY: 7,
      maxDimY: 12,
      minDimZ: 8,
      maxDimZ: 15,
      images: ["acesorio1.png"],
      colors: ["Blanco", "Negro", "Azul Medianoche"],
      stock: 47,
      rating: 4.8,
      reviewCount: 73,
    },
    {
      name: "Organizador Cables Escritorio",
      description:
        "Canal organizador con clips para hasta 8 cables. Monta bajo escritorio con adhesivo 3M.",
      category: "Funcional",
      material: "PLA",
      basePricePerGram: 0.042,
      density: 1.24,
      finishCost: 1.5,
      printTimeMinutes: 90,
      isActive: true,
      defaultDimX: 40,
      defaultDimY: 5,
      defaultDimZ: 3,
      minDimX: 30,
      maxDimX: 60,
      minDimY: 4,
      maxDimY: 8,
      minDimZ: 2,
      maxDimZ: 5,
      images: [
        "https://images.unsplash.com/photo-1625961332071-7dc0e249a295?w=600",
      ],
      colors: ["Blanco", "Negro", "Gris"],
      stock: 95,
      rating: 4.5,
      reviewCount: 54,
    },
    {
      name: "Estante Flotante Hexagonal",
      description:
        "Estante decorativo hexagonal para pared. Ideal para plantas pequeñas y objetos decorativos.",
      category: "Funcional",
      material: "PETG",
      basePricePerGram: 0.056,
      density: 1.27,
      finishCost: 3.5,
      printTimeMinutes: 180,
      isActive: true,
      defaultDimX: 25,
      defaultDimY: 8,
      defaultDimZ: 22,
      minDimX: 20,
      maxDimX: 35,
      minDimY: 6,
      maxDimY: 12,
      minDimZ: 18,
      maxDimZ: 30,
      images: [
        "https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600",
      ],
      colors: ["Blanco", "Negro", "Roble Natural"],
      stock: 33,
      rating: 4.7,
      reviewCount: 38,
    },

    // ARTICULADO (5 productos)
    {
      name: "Engranaje Planetario Funcional",
      description:
        "Mecanismo de engranajes planetarios completamente funcional. Excelente para educación y demostraciones.",
      category: "Articulados",
      material: "PETG",
      basePricePerGram: 0.06,
      density: 1.27,
      finishCost: 5,
      printTimeMinutes: 90,
      isActive: true,
      defaultDimX: 10,
      defaultDimY: 10,
      defaultDimZ: 5,
      minDimX: 8,
      maxDimX: 15,
      minDimY: 8,
      maxDimY: 15,
      minDimZ: 4,
      maxDimZ: 8,
      images: [
        "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600",
      ],
      colors: ["Multicolor", "Negro/Dorado", "Gris/Rojo"],
      stock: 22,
      rating: 4.9,
      reviewCount: 44,
    },
    {
      name: "Caja de Cambios Demostrativa",
      description:
        "Modelo de transmisión de 3 velocidades transparente. Educativo y fascinante.",
      category: "Articulados",
      material: "PETG",
      basePricePerGram: 0.062,
      density: 1.27,
      finishCost: 8,
      printTimeMinutes: 150,
      isActive: true,
      defaultDimX: 15,
      defaultDimY: 10,
      defaultDimZ: 8,
      minDimX: 12,
      maxDimX: 20,
      minDimY: 8,
      maxDimY: 15,
      minDimZ: 6,
      maxDimZ: 12,
      images: [
        "https://images.unsplash.com/photo-1621369116334-37e194d835f3?w=600",
      ],
      colors: ["Transparente/Naranja", "Negro/Rojo"],
      stock: 15,
      rating: 4.8,
      reviewCount: 31,
    },
    {
      name: "Cubo Infinito Fidget",
      description:
        "Cubo anti-estrés con bisagras que se pliega infinitamente. Adictivo y relajante.",
      category: "Articulados",
      material: "PETG",
      basePricePerGram: 0.055,
      density: 1.27,
      finishCost: 3,
      printTimeMinutes: 45,
      isActive: true,
      defaultDimX: 5,
      defaultDimY: 5,
      defaultDimZ: 5,
      minDimX: 4,
      maxDimX: 8,
      minDimY: 4,
      maxDimY: 8,
      minDimZ: 4,
      maxDimZ: 8,
      images: [
        "https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=600",
      ],
      colors: ["Negro", "Azul", "Verde", "Multicolor"],
      stock: 89,
      rating: 4.6,
      reviewCount: 156,
    },
    {
      name: "Dispensador de Cinta Mécanico",
      description:
        "Dispensador de cinta adhesiva con mecanismo de corte por engranajes. Funcional y decorativo.",
      category: "Articulados",
      material: "PETG",
      basePricePerGram: 0.058,
      density: 1.27,
      finishCost: 4,
      printTimeMinutes: 120,
      isActive: true,
      defaultDimX: 12,
      defaultDimY: 8,
      defaultDimZ: 10,
      minDimX: 10,
      maxDimX: 15,
      minDimY: 6,
      maxDimY: 10,
      minDimZ: 8,
      maxDimZ: 12,
      images: [
        "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600",
      ],
      colors: ["Negro", "Rojo Industrial", "Azul"],
      stock: 27,
      rating: 4.5,
      reviewCount: 23,
    },
    {
      name: "Modelo Motor Radial",
      description:
        "Réplica funcional de motor radial de 5 cilindros. Gira manualmente mostrando el ciclo del motor.",
      category: "Articulados",
      material: "PETG",
      basePricePerGram: 0.065,
      density: 1.27,
      finishCost: 12,
      printTimeMinutes: 240,
      isActive: true,
      defaultDimX: 15,
      defaultDimY: 15,
      defaultDimZ: 10,
      minDimX: 12,
      maxDimX: 22,
      minDimY: 12,
      maxDimY: 22,
      minDimZ: 8,
      maxDimZ: 15,
      images: [
        "https://media.printables.com/media/prints/399341/images/3605477_f7ac08ef-0c9a-415f-ab5a-768309d517df/thumbs/inside/1280x960/jpg/foto2.webp",
      ],
      colors: ["Gris Metálico", "Negro/Dorado"],
      stock: 12,
      rating: 4.9,
      reviewCount: 67,
    },

    // ACCESORIOS (4 productos)
    {
      name: "Llavero Personalizable con QR",
      description:
        "Llavero con espacio para código QR personalizado. Enlaza a tu tarjeta digital de contacto.",
      category: "Accesorios",
      material: "PETG",
      basePricePerGram: 0.05,
      density: 1.27,
      finishCost: 1,
      printTimeMinutes: 15,
      isActive: true,
      defaultDimX: 5,
      defaultDimY: 5,
      defaultDimZ: 0.5,
      minDimX: 4,
      maxDimX: 7,
      minDimY: 4,
      maxDimY: 7,
      minDimZ: 0.3,
      maxDimZ: 1,
      images: [
        "https://images.unsplash.com/photo-1622434641406-a158123450f9?w=600",
      ],
      colors: ["Negro", "Blanco", "Azul", "Rojo"],
      stock: 200,
      rating: 4.3,
      reviewCount: 89,
    },
    {
      name: "Funda Airpods Pro Armadura",
      description:
        "Funda protectora estilo armadura futurista para Airpods Pro. Protección total contra golpes.",
      category: "Accesorios",
      material: "PETG",
      basePricePerGram: 0.058,
      density: 1.27,
      finishCost: 2.5,
      printTimeMinutes: 30,
      isActive: true,
      defaultDimX: 6,
      defaultDimY: 5,
      defaultDimZ: 3,
      minDimX: 5,
      maxDimX: 7,
      minDimY: 4,
      maxDimY: 6,
      minDimZ: 2.5,
      maxDimZ: 4,
      images: [
        "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600",
      ],
      colors: ["Negro Mate", "Gris Espacial", "Verde Militar"],
      stock: 67,
      rating: 4.7,
      reviewCount: 112,
    },
    {
      name: "Clip Organizador Mascarilla (Pack 5)",
      description:
        "Set de 5 clips para ajustar mascarillas detrás de la cabeza. Alivia presión en las orejas.",
      category: "Accesorios",
      material: "PLA",
      basePricePerGram: 0.035,
      density: 1.24,
      finishCost: 0.5,
      printTimeMinutes: 20,
      isActive: true,
      defaultDimX: 12,
      defaultDimY: 2,
      defaultDimZ: 0.3,
      minDimX: 10,
      maxDimX: 15,
      minDimY: 1.5,
      maxDimY: 3,
      minDimZ: 0.2,
      maxDimZ: 0.5,
      images: [
        "https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=600",
      ],
      colors: ["Blanco", "Negro", "Azul", "Rosa"],
      stock: 300,
      rating: 4.2,
      reviewCount: 234,
    },
    {
      name: "Soporte Gafas de Sol Coche",
      description:
        "Clip para visera del coche que sujeta gafas de sol de forma segura. Diseño discreto.",
      category: "Accesorios",
      material: "PETG",
      basePricePerGram: 0.052,
      density: 1.27,
      finishCost: 1.5,
      printTimeMinutes: 25,
      isActive: true,
      defaultDimX: 8,
      defaultDimY: 3,
      defaultDimZ: 2,
      minDimX: 7,
      maxDimX: 10,
      minDimY: 2,
      maxDimY: 4,
      minDimZ: 1.5,
      maxDimZ: 3,
      images: [
        "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600",
      ],
      colors: ["Negro", "Gris", "Beige"],
      stock: 78,
      rating: 4.4,
      reviewCount: 56,
    },

    // FIGURAS ARTÍSTICAS (3 productos)
    {
      name: "Busto Low-Poly Personaje",
      description:
        "Busto estilizado con estética low-poly. Disponible en varios personajes icónicos.",
      category: "Figuras",
      material: "PLA",
      basePricePerGram: 0.048,
      density: 1.24,
      finishCost: 5,
      printTimeMinutes: 180,
      isActive: true,
      defaultDimX: 12,
      defaultDimY: 12,
      defaultDimZ: 18,
      minDimX: 10,
      maxDimX: 18,
      minDimY: 10,
      maxDimY: 18,
      minDimZ: 15,
      maxDimZ: 25,
      images: [
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600",
      ],
      colors: ["Blanco", "Bronce", "Plata", "Negro"],
      stock: 25,
      rating: 4.8,
      reviewCount: 45,
      featured: true,
    },
    {
      name: "Litofanía Personalizada",
      description:
        "Placa que revela imagen al iluminarse por detrás. Envíanos tu foto y la convertimos en arte.",
      category: "Decoracion",
      material: "PLA",
      basePricePerGram: 0.055,
      density: 1.24,
      finishCost: 8,
      printTimeMinutes: 120,
      isActive: true,
      defaultDimX: 15,
      defaultDimY: 2,
      defaultDimZ: 20,
      minDimX: 10,
      maxDimX: 25,
      minDimY: 1,
      maxDimY: 3,
      minDimZ: 15,
      maxDimZ: 30,
      images: [
        "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=600",
      ],
      stock: 50,
      rating: 4.9,
      reviewCount: 189,
    },
    {
      name: "Mapa Topográfico 3D Ciudad",
      description:
        "Relieve topográfico de tu ciudad favorita. Barcelona, Madrid, Valencia y más disponibles.",
      category: "Decoracion",
      material: "PLA",
      basePricePerGram: 0.05,
      density: 1.24,
      finishCost: 10,
      printTimeMinutes: 90,
      isActive: true,
      defaultDimX: 20,
      defaultDimY: 20,
      defaultDimZ: 3,
      minDimX: 15,
      maxDimX: 40,
      minDimY: 15,
      maxDimY: 40,
      minDimZ: 2,
      maxDimZ: 6,
      images: [
        "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600",
      ],
      stock: 18,
      rating: 4.7,
      reviewCount: 78,
    },
  ];

  const createdProducts = [];
  const imageBuckets = [
    "/images/product-01.png",
    "/images/product-02.jpg",
    "/images/product-03.webp",
  ];
  for (const [index, productTemplate] of products.entries()) {
    const product = await prisma.product.create({
      data: {
        ...productTemplate,
        images: [
          imageBuckets[index % imageBuckets.length],
          imageBuckets[(index + 1) % imageBuckets.length],
        ],
      },
    });
    createdProducts.push(product);
  }
  console.log(`✅ ${createdProducts.length} productos creados`);

  // ========================================
  // PRECIOS CALCULADOS (motor avanzado)
  // ========================================
  const priceResult = await updateAllProductPrices();
  console.log(
    `✅ ${priceResult.updated} precios calculados con el motor avanzado (p2s)`,
  );

  // ========================================
  // PEDIDOS FICTICIOS (15 pedidos)
  // ========================================
  const orderStatuses = ["paid", "processing", "shipped", "delivered"];
  const allUsers = [testUser, ...clients];

  for (let i = 0; i < 15; i++) {
    const user = allUsers[i % allUsers.length];
    const numItems = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = [...createdProducts]
      .sort(() => Math.random() - 0.5)
      .slice(0, numItems);

    const orderItems = selectedProducts.map((p) => {
      const qty = Math.floor(Math.random() * 3) + 1;
      const price = p.basePricePerGram * 50 + p.finishCost;
      return {
        productId: p.id,
        name: p.name,
        quantity: qty,
        material: p.material,
        color: "N/A",
        dimX: p.defaultDimX,
        dimY: p.defaultDimY,
        dimZ: p.defaultDimZ,
        unitPrice: price,
      };
    });

    const subtotal = orderItems.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0,
    );
    const tax = subtotal * 0.21;
    const shipping = subtotal > 50 ? 0 : 4.95;
    const total = subtotal + tax + shipping;

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: orderStatuses[i % orderStatuses.length],
        subtotal,
        tax,
        shipping,
        total,
        shippingName: user.name,
        shippingAddress: user.address ?? "Calle Ejemplo 123",
        shippingCity: user.city ?? "Barcelona",
        shippingState: user.state ?? "Cataluña",
        shippingZip: user.zipCode ?? "08001",
        shippingCountry: user.country ?? "España",
        stripeSessionId: `cs_test_demo_${Date.now()}_${i}`,
        items: { create: orderItems },
      },
    });

    // Crear transacción de puntos para pedidos pagados
    if (order.status === "paid" || order.status === "delivered") {
      const pointsEarned = Math.floor(total);
      await prisma.pointsTransaction.create({
        data: {
          userId: user.id,
          points: pointsEarned,
          type: "earned",
          description: `Puntos por pedido #${order.id.slice(0, 8)}`,
          orderId: order.id,
        },
      });
    }
  }
  console.log("✅ 15 pedidos ficticios creados con transacciones de puntos");

  // ========================================
  // RESEÑAS FICTICIAS
  // ========================================
  const reviewComments = [
    "Excelente calidad, superó mis expectativas. El acabado es impecable.",
    "Muy buen producto, llegó rápido y bien empaquetado.",
    "Perfecto para lo que necesitaba. Lo recomiendo.",
    "Buena relación calidad-precio. Volveré a comprar.",
    "El diseño es precioso y la calidad del material es notable.",
    "Cumple perfectamente su función. Muy satisfecho.",
    "Regalo perfecto. A quien se lo di le encantó.",
    "Buen producto pero el envío tardó más de lo esperado.",
  ];

  for (let i = 0; i < 30; i++) {
    const user = allUsers[i % allUsers.length];
    const product = createdProducts[i % createdProducts.length];
    await prisma.review.create({
      data: {
        userId: user.id,
        productId: product.id,
        rating: Math.floor(Math.random() * 2) + 4, // 4 o 5
        comment: reviewComments[i % reviewComments.length],
      },
    });
  }
  console.log("✅ 30 reseñas ficticias creadas");

  // ========================================
  // SUSCRIPTORES NEWSLETTER
  // ========================================
  const newsletterEmails = [
    "suscriptor1@email.com",
    "suscriptor2@email.com",
    "suscriptor3@email.com",
    "newsletter@test.com",
    "promo@ejemplo.com",
  ];
  for (const email of newsletterEmails) {
    await prisma.newsletter.create({ data: { email } });
  }
  console.log("✅ 5 suscriptores de newsletter creados");

  console.log("\n Seed completado exitosamente!");
  console.log("\n Credenciales de acceso:");
  console.log("   Admin: john@doe.com / johndoe123");
  console.log("   Cliente: cliente@test.com / cliente123");
  console.log("\n Materiales disponibles: PLA, PETG, ASA, TPU");
  console.log(
    " Cupones de prueba: BIENVENIDO10 (10%), PROMO5EUR (-5€), VERANO20 (20%)",
  );
}

main() // NOSONAR
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect()); // NOSONAR
