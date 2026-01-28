/**
 * PDF 인증서 생성 서비스
 * jsPDF를 사용하여 AICT Essential 인증서 PDF를 생성합니다.
 */

import { jsPDF } from 'jspdf';

export interface CertificateData {
  certificateId: string;
  name: string;
  score: number;
  jobRole: string;
  examDate: string;
  expiryDate: string;
  competencies: {
    defining: number;
    prompting: number;
    protecting: number;
    refining: number;
    acumen: number;
    integrating: number;
  };
}

// 인증서 ID 생성
export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `AICT-${year}-${random}`;
}

// 만료일 계산 (1년 후)
export function calculateExpiryDate(examDate: Date): string {
  const expiry = new Date(examDate);
  expiry.setFullYear(expiry.getFullYear() + 1);
  return expiry.toISOString().split('T')[0];
}

// PDF 인증서 생성
export async function generateCertificatePDF(data: CertificateData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 배경색 (아이보리)
  doc.setFillColor(252, 251, 247);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 테두리 (네이비)
  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(3);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // 내부 장식 테두리 (골드)
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(1);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // 상단 로고 영역
  doc.setFillColor(30, 58, 95);
  doc.rect(10, 10, pageWidth - 20, 25, 'F');

  // 로고 텍스트
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AICT Essential', pageWidth / 2, 27, { align: 'center' });

  // 인증서 타이틀
  doc.setTextColor(30, 58, 95);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE OF ACHIEVEMENT', pageWidth / 2, 55, { align: 'center' });

  // AI 역량 인증서 (한글)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('AI Competency Certification', pageWidth / 2, 63, { align: 'center' });

  // 수여 대상자
  doc.setTextColor(30, 58, 95);
  doc.setFontSize(12);
  doc.text('This is to certify that', pageWidth / 2, 80, { align: 'center' });

  // 이름
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(201, 162, 39);
  doc.text(data.name, pageWidth / 2, 95, { align: 'center' });

  // 설명문
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 58, 95);
  const description = `has successfully demonstrated proficiency in AI literacy and practical application`;
  doc.text(description, pageWidth / 2, 108, { align: 'center' });
  doc.text(`by achieving a score of ${data.score}/100 on the AICT Essential Certification Exam.`, pageWidth / 2, 115, { align: 'center' });

  // 세부 정보 박스
  const boxY = 125;
  const boxHeight = 35;
  doc.setFillColor(245, 239, 215);
  doc.roundedRect(40, boxY, pageWidth - 80, boxHeight, 3, 3, 'F');

  // 세부 정보
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const col1X = 60;
  const col2X = pageWidth / 2 - 20;
  const col3X = pageWidth - 100;

  doc.text('Certificate ID', col1X, boxY + 12);
  doc.text('Job Role', col2X, boxY + 12);
  doc.text('Validity', col3X, boxY + 12);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text(data.certificateId, col1X, boxY + 22);
  doc.text(data.jobRole, col2X, boxY + 22);
  doc.text(`${data.examDate} ~ ${data.expiryDate}`, col3X, boxY + 22);

  // 역량 점수 (6개)
  const competencyY = boxY + boxHeight + 15;
  const competencyWidth = (pageWidth - 80) / 6;
  const competencies = [
    { name: 'Defining', score: data.competencies.defining },
    { name: 'Prompting', score: data.competencies.prompting },
    { name: 'Protecting', score: data.competencies.protecting },
    { name: 'Refining', score: data.competencies.refining },
    { name: 'Acumen', score: data.competencies.acumen },
    { name: 'Integrating', score: data.competencies.integrating },
  ];

  competencies.forEach((comp, index) => {
    const x = 40 + competencyWidth * index + competencyWidth / 2;

    // 점수 원형 배경
    doc.setFillColor(30, 58, 95);
    doc.circle(x, competencyY + 8, 10, 'F');

    // 점수
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${comp.score}`, x, competencyY + 11, { align: 'center' });

    // 역량명
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(comp.name, x, competencyY + 25, { align: 'center' });
  });

  // QR 코드 위치 표시 (실제 QR 코드는 별도로 추가)
  const qrSize = 25;
  const qrX = pageWidth - 50;
  const qrY = pageHeight - 50;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(qrX, qrY, qrSize, qrSize);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Scan to verify', qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' });

  // 하단 발급 정보
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Issued by AICT (AI Competency Training)`, 40, pageHeight - 25);
  doc.text(`Verify at: aict-platform.github.io/verify/${data.certificateId}`, 40, pageHeight - 18);

  return doc.output('blob');
}

// PDF 다운로드
export async function downloadCertificatePDF(data: CertificateData): Promise<void> {
  const blob = await generateCertificatePDF(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AICT_Certificate_${data.certificateId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 인증서 이미지 생성 (Canvas 기반)
export async function generateCertificateImage(data: CertificateData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // A4 가로 비율 (297mm x 210mm -> 1189px x 842px at 4x)
  const width = 1189;
  const height = 842;
  canvas.width = width;
  canvas.height = height;

  // 배경색 (아이보리)
  ctx.fillStyle = '#FCFBF7';
  ctx.fillRect(0, 0, width, height);

  // 테두리 (네이비)
  ctx.strokeStyle = '#1E3A5F';
  ctx.lineWidth = 12;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // 내부 장식 테두리 (골드)
  ctx.strokeStyle = '#C9A227';
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // 상단 배너 (네이비)
  ctx.fillStyle = '#1E3A5F';
  ctx.fillRect(40, 40, width - 80, 100);

  // 로고 텍스트
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('AICT Essential', width / 2, 105);

  // 인증서 타이틀
  ctx.fillStyle = '#1E3A5F';
  ctx.font = 'bold 56px Arial';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', width / 2, 220);

  // 부제목
  ctx.fillStyle = '#64748B';
  ctx.font = '28px Arial';
  ctx.fillText('AI Competency Certification', width / 2, 260);

  // 수여 대상자 안내
  ctx.fillStyle = '#1E3A5F';
  ctx.font = '24px Arial';
  ctx.fillText('This is to certify that', width / 2, 320);

  // 이름 (골드)
  ctx.fillStyle = '#C9A227';
  ctx.font = 'bold 56px Arial';
  ctx.fillText(data.name, width / 2, 380);

  // 설명문
  ctx.fillStyle = '#1E3A5F';
  ctx.font = '22px Arial';
  ctx.fillText('has successfully demonstrated proficiency in AI literacy and practical application', width / 2, 430);
  ctx.fillText(`by achieving a score of ${data.score}/100 on the AICT Essential Certification Exam.`, width / 2, 460);

  // 세부 정보 박스
  ctx.fillStyle = '#F5EFD7';
  roundedRect(ctx, 160, 490, width - 320, 100, 12);
  ctx.fill();

  // 세부 정보 헤더
  ctx.fillStyle = '#64748B';
  ctx.font = '18px Arial';
  const col1X = 260;
  const col2X = width / 2;
  const col3X = width - 260;
  ctx.fillText('Certificate ID', col1X, 525);
  ctx.fillText('Job Role', col2X, 525);
  ctx.fillText('Validity', col3X, 525);

  // 세부 정보 값
  ctx.fillStyle = '#1E3A5F';
  ctx.font = 'bold 22px Arial';
  ctx.fillText(data.certificateId, col1X, 560);
  ctx.fillText(data.jobRole, col2X, 560);
  ctx.fillText(`${data.examDate} ~ ${data.expiryDate}`, col3X, 560);

  // 역량 점수 표시
  const competencyY = 640;
  const competencySpacing = (width - 320) / 6;
  const competencies = [
    { name: 'Defining', score: data.competencies.defining },
    { name: 'Prompting', score: data.competencies.prompting },
    { name: 'Protecting', score: data.competencies.protecting },
    { name: 'Refining', score: data.competencies.refining },
    { name: 'Acumen', score: data.competencies.acumen },
    { name: 'Integrating', score: data.competencies.integrating },
  ];

  competencies.forEach((comp, index) => {
    const x = 160 + competencySpacing * index + competencySpacing / 2;

    // 원형 배경
    ctx.beginPath();
    ctx.arc(x, competencyY, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#1E3A5F';
    ctx.fill();

    // 점수
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(`${comp.score}`, x, competencyY + 8);

    // 역량명
    ctx.fillStyle = '#64748B';
    ctx.font = '16px Arial';
    ctx.fillText(comp.name, x, competencyY + 55);
  });

  // 하단 발급 정보
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748B';
  ctx.font = '18px Arial';
  ctx.fillText('Issued by AICT (AI Competency Training)', 160, height - 80);
  ctx.fillText(`Verify at: aict-platform.github.io/verify/${data.certificateId}`, 160, height - 50);

  // Blob으로 변환
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png', 1.0);
  });
}

// Canvas용 둥근 사각형 그리기 헬퍼
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// 이미지 다운로드
export async function downloadCertificateImage(data: CertificateData): Promise<void> {
  const blob = await generateCertificateImage(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AICT_Certificate_${data.certificateId}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
