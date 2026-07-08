/**
 * Generate a unique medical record code following the format:
 * MR-YYYY-NNNN (e.g. MR-2026-0001)
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {Promise<string>}
 */
const generateRecordCode = async (prisma) => {
  const year = new Date().getFullYear();
  const prefix = `MR-${year}-`;

  // Find the latest record code for this year
  const latest = await prisma.medical_records.findFirst({
    where: { record_code: { startsWith: prefix } },
    orderBy: { record_code: 'desc' },
    select: { record_code: true },
  });

  let nextNumber = 1;
  if (latest) {
    const lastNumber = parseInt(latest.record_code.split('-').pop(), 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

module.exports = { generateRecordCode };
