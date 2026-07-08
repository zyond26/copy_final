const prisma = require('./src/config/prisma');

async function main() {
  const appointments = await prisma.appointments.findMany({
    include: {
      doctor: true,
      patient: true
    }
  });
  console.log('--- APPOINTMENTS ---');
  for (const app of appointments) {
    console.log({
      id: app.id.toString(),
      code: app.appointment_code,
      doctor: app.doctor.full_name,
      doctor_id: app.doctor_id.toString(),
      patient: app.patient.full_name,
      date: app.appointment_date,
      status: app.status
    });
  }
  console.log('Total:', appointments.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
