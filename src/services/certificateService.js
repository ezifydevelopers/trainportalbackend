const prisma = require('../prismaClient');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

class CertificateService {
  static async generateCertificate(userId, companyId) {
    try {
      // Get user and company details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { company: true }
      });

      const company = await prisma.company.findUnique({
        where: { id: companyId }
      });

      if (!user || !company) {
        throw new Error('User or company not found');
      }

      // Check if user has completed all modules
      const completedModules = await prisma.traineeProgress.findMany({
        where: {
          userId: userId,
          isCompleted: true
        },
        include: {
          module: true
        }
      });

      const totalModules = await prisma.trainingModule.count({
        where: { companyId: companyId }
      });

      if (completedModules.length < totalModules) {
        throw new Error('User has not completed all modules');
      }

      // Check if certificate already exists
      const existingCertificate = await prisma.certificate.findFirst({
        where: {
          userId: userId,
          companyId: companyId,
          isActive: true
        }
      });

      if (existingCertificate) {
        return existingCertificate;
      }

      // Generate certificate number
      const certificateNumber = this.generateCertificateNumber(userId, companyId);

      // Create certificate record
      const certificate = await prisma.certificate.create({
        data: {
          userId: userId,
          companyId: companyId,
          certificateNumber: certificateNumber,
          completedAt: new Date(),
          pdfPath: null // Will be updated after PDF generation
        }
      });

      // Generate PDF
      const pdfPath = await this.generatePDF(certificate, user, company);

      // Update certificate with PDF path
      const updatedCertificate = await prisma.certificate.update({
        where: { id: certificate.id },
        data: { pdfPath: pdfPath }
      });

      return updatedCertificate;

    } catch (error) {
      throw error;
    }
  }

  static generateCertificateNumber(userId, companyId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `EZIFY-${companyId}-${userId}-${timestamp}-${random}`;
  }

  static async generatePDF(certificate, user, company) {
    return new Promise((resolve, reject) => {
      try {
        // Create uploads/certificates directory if it doesn't exist
        const certDir = path.join(__dirname, '../../uploads/certificates');
        if (!fs.existsSync(certDir)) {
          fs.mkdirSync(certDir, { recursive: true });
        }

        const fileName = `certificate-${certificate.certificateNumber}.pdf`;
        const filePath = path.join(certDir, fileName);

        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margin: 50
        });

        // Pipe to file
        doc.pipe(fs.createWriteStream(filePath));

        // Add background
        doc.rect(0, 0, doc.page.width, doc.page.height)
           .fill('#f8f9fa');

        // Add border
        doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
           .stroke('#2c3e50', 3);

        // Add inner border
        doc.rect(50, 50, doc.page.width - 100, doc.page.height - 100)
           .stroke('#34495e', 1);

        // Add Ezify logo area (placeholder)
        doc.fontSize(24)
           .fill('#2c3e50')
           .text('EZIFY', 100, 80, { align: 'center' });

        // Add certificate title
        doc.fontSize(36)
           .fill('#2c3e50')
           .text('CERTIFICATE OF COMPLETION', 0, 150, { align: 'center' });

        // Add decorative line
        doc.moveTo(200, 200)
           .lineTo(600, 200)
           .stroke('#e74c3c', 2);

        // Add "This is to certify that" text
        doc.fontSize(18)
           .fill('#34495e')
           .text('This is to certify that', 0, 250, { align: 'center' });

        // Add trainee name
        doc.fontSize(32)
           .fill('#2c3e50')
           .text(user.name.toUpperCase(), 0, 300, { align: 'center' });

        // Add company name
        doc.fontSize(18)
           .fill('#34495e')
           .text(`from ${company.name}`, 0, 350, { align: 'center' });

        // Add completion text
        doc.fontSize(16)
           .fill('#34495e')
           .text('has successfully completed the training program', 0, 400, { align: 'center' });

        // Add completion date
        const completionDate = certificate.completedAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        doc.fontSize(16)
           .fill('#34495e')
           .text(`on ${completionDate}`, 0, 450, { align: 'center' });

        // Add certificate number
        doc.fontSize(12)
           .fill('#7f8c8d')
           .text(`Certificate Number: ${certificate.certificateNumber}`, 0, 500, { align: 'center' });

        // Add Ezify signature area
        doc.fontSize(14)
           .fill('#2c3e50')
           .text('EZIFY Training Portal', 150, 550, { align: 'left' });

        doc.fontSize(12)
           .fill('#7f8c8d')
           .text('Authorized Signature', 150, 570, { align: 'left' });

        // Add company signature area
        doc.fontSize(14)
           .fill('#2c3e50')
           .text(company.name, 550, 550, { align: 'right' });

        doc.fontSize(12)
           .fill('#7f8c8d')
           .text('Company Representative', 550, 570, { align: 'right' });

        // Finalize PDF
        doc.end();

        // Wait for PDF to be written
        doc.on('end', () => {
          resolve(`/uploads/certificates/${fileName}`);
        });

        doc.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  static async getCertificateByUser(userId) {
    return await prisma.certificate.findMany({
      where: { userId: userId, isActive: true },
      include: { company: true },
      orderBy: { issuedAt: 'desc' }
    });
  }

  static async getCertificateByCompany(companyId) {
    return await prisma.certificate.findMany({
      where: { companyId: companyId, isActive: true },
      include: { user: true },
      orderBy: { issuedAt: 'desc' }
    });
  }

  static async getAllCertificates() {
    return await prisma.certificate.findMany({
      where: { isActive: true },
      include: { user: true, company: true },
      orderBy: { issuedAt: 'desc' }
    });
  }

  static async getCertificateById(certificateId) {
    return await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { user: true, company: true }
    });
  }

  static async revokeCertificate(certificateId) {
    return await prisma.certificate.update({
      where: { id: certificateId },
      data: { isActive: false }
    });
  }
}

module.exports = CertificateService;
