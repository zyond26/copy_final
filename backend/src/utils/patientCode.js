/**
 * Generate a unique patient code following the format defined in Chương 3:
 * EMR-YYYY-NNNN (e.g. EMR-2025-0001)
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {Promise<string>}
 */
const generatePatientCode = async (prisma) => {
  const year = new Date().getFullYear();
  const prefix = `EMR-${year}-`;

  // Find the latest patient code for this year
  const latest = await prisma.patients.findFirst({
    where: { patient_code: { startsWith: prefix } },
    orderBy: { patient_code: 'desc' },
    select: { patient_code: true },
  });

  let nextNumber = 1;
  if (latest) {
    const lastNumber = parseInt(latest.patient_code.split('-').pop(), 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

module.exports = { generatePatientCode };
