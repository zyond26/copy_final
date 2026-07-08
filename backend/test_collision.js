const prisma = require('./src/config/prisma');

async function test(dateStr, doctorIdStr) {
  const doctorId = BigInt(doctorIdStr);
  const proposedDate = new Date(dateStr);
  const minDate = new Date(proposedDate.getTime() - 30 * 60 * 1000);
  const maxDate = new Date(proposedDate.getTime() + 30 * 60 * 1000);

  console.log('Testing date:', dateStr);
  console.log('proposedDate:', proposedDate.toISOString());
  console.log('minDate:', minDate.toISOString());
  console.log('maxDate:', maxDate.toISOString());

  const collision = await prisma.appointments.findFirst({
    where: {
      doctor_id: doctorId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      appointment_date: {
        gte: minDate,
        lte: maxDate
      }
    }
  });

  if (collision) {
    console.log('Collision found!', {
      id: collision.id.toString(),
      code: collision.appointment_code,
      date: collision.appointment_date,
      status: collision.status
    });
  } else {
    console.log('No collision!');
  }
}

async function main() {
  // Test doctor 23 with a date on June 26 at 13:35 UTC (which is confirmed)
  await test('2026-06-26T13:35:00.000Z', '23');
  // Test doctor 23 with a date on June 26 at 13:02 UTC (which is cancelled)
  await test('2026-06-26T13:02:00.000Z', '23');
}

main().catch(console.error).finally(() => prisma.$disconnect());
