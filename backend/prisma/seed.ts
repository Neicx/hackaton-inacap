import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = "password123";

async function main() {
  const PASSWORD_HASH = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // --- Usuarios ---
  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      name: "Fuan200",
      email: "admin@gmail.com",
      hashed_password: PASSWORD_HASH,
      role: "admin",
    },
  });

  const tecnicosData = [
    { name: "Roberto Fuentes", email: "roberto@gmail.com" },
    { name: "Camila Soto", email: "camila@gmail.com" },
    { name: "Ignacio Pardo", email: "ignacio@gmail.com" },
    { name: "Fernanda Rojas", email: "fernanda@gmail.com" },
  ];

  const tecnicos = await Promise.all(
    tecnicosData.map((t) =>
      prisma.user.upsert({
        where: { email: t.email },
        update: {},
        create: { ...t, hashed_password: PASSWORD_HASH, role: "technical" },
      })
    )
  );

  const solicitante = await prisma.user.upsert({
    where: { email: "faena.losandes@gmail.com" },
    update: {},
    create: {
      name: "Faena Los Andes",
      email: "faena.losandes@gmail.com",
      hashed_password: PASSWORD_HASH,
      role: "user",
    },
  });

  // --- Máquina ---
  const machine = await prisma.machine.upsert({
    where: { id: "seed-machine-excavadora-320" },
    update: {},
    create: {
      id: "seed-machine-excavadora-320",
      name: "Excavadora CAT 320",
      type: "Excavadora",
    },
  });

  // --- Ticket de ejemplo ---
  const existingTicket = await prisma.ticket.findFirst({
    where: { machine_id: machine.id, name: "Fuga de aceite hidráulico" },
  });

  if (!existingTicket) {
    await prisma.ticket.create({
      data: {
        name: "Fuga de aceite hidráulico",
        description: "Fuga de aceite hidráulico en el brazo principal, pérdida visible bajo la máquina.",
        priority: 3, // ej: 1=Baja, 2=Media, 3=Alta, 4=Crítica
        status: "in_progress",
        created_by_id: solicitante.id,
        assigned_to_id: tecnicos[0].id,
        machine_id: machine.id,
      },
    });
  }


main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
