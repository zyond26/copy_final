/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: {
        unoptimized: true, // Thêm dòng này để Next.js không bị lỗi khi export các file ảnh tĩnh
    },
};

module.exports = nextConfig;