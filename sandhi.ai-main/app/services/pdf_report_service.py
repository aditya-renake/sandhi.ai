import qrcode
import io
import base64
from pathlib import Path
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.config import settings
from app.schemas.screening import MultimodalRiskEvaluationResponse

class PDFReportService:
    @staticmethod
    def generate_qr_code(data: str) -> tuple[str, bytes]:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=6,
            border=2,
        )
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        buf = io.BytesIO()
        img.save(buf, format='PNG')
        img_bytes = buf.getvalue()
        base64_str = base64.b64encode(img_bytes).decode('utf-8')
        return base64_str, img_bytes

    @staticmethod
    def create_clinical_report_pdf(
        evaluation: MultimodalRiskEvaluationResponse,
        abha_id: str = "N/A",
        output_filename: str = "report.pdf"
    ) -> Path:
        pdf_path = settings.REPORTS_DIR / output_filename
        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#0f766e'), # Teal
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'SubTitleStyle',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#475569'),
            spaceAfter=12
        )
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontSize=12,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=8,
            spaceAfter=4
        )
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=9,
            leading=12
        )

        story = []

        # Header
        story.append(Paragraph("<b>SANDHI-NER (সন্ধি-NER) | EARLY OA SCREENING REPORT</b>", title_style))
        story.append(Paragraph(
            f"Ministry of Development of North Eastern Region (MDoNER) | Ayushman Bharat Aligned<br/>"
            f"Generated on: {datetime.now().strftime('%d %B %Y, %I:%M %p')} | Screening UUID: {evaluation.screening_uuid[:12]}...",
            subtitle_style
        ))

        # QR Code and Patient Demographics
        qr_data = f"SANDHI-NER|ID:{evaluation.patient_id}|RISK:{evaluation.risk_tier}|SCORE:{evaluation.composite_risk_score}|ABHA:{abha_id}"
        _, qr_bytes = PDFReportService.generate_qr_code(qr_data)
        qr_img = RLImage(io.BytesIO(qr_bytes), width=75, height=75)

        demo_data = [
            [
                Paragraph(f"<b>Patient Name:</b> {evaluation.patient_name}", normal_style),
                Paragraph(f"<b>ABHA ID:</b> {abha_id}", normal_style),
                qr_img
            ],
            [
                Paragraph(f"<b>Age / Sex:</b> {evaluation.patient_age} yrs", normal_style),
                Paragraph(f"<b>Occupation:</b> {evaluation.patient_occupation}", normal_style),
                ""
            ],
            [
                Paragraph(f"<b>Location:</b> {evaluation.patient_district}, {evaluation.patient_state}", normal_style),
                Paragraph(f"<b>Phenotype:</b> {evaluation.predicted_phenotype}", normal_style),
                ""
            ]
        ]
        demo_table = Table(demo_data, colWidths=[200, 240, 90])
        demo_table.setStyle(TableStyle([
            ('SPAN', (2, 0), (2, 2)),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(demo_table)
        story.append(Spacer(1, 10))

        # Risk Tier Banner
        tier_color = colors.HexColor('#16a34a') # Green for Low
        if evaluation.risk_tier == "Mild / Early OA":
            tier_color = colors.HexColor('#ca8a04') # Yellow/Amber
        elif evaluation.risk_tier == "Moderate OA":
            tier_color = colors.HexColor('#ea580c') # Orange
        elif evaluation.risk_tier == "Severe OA":
            tier_color = colors.HexColor('#dc2626') # Red

        risk_banner = Table([
            [
                Paragraph(f"<font color='white' size=12><b>EARLY OA RISK INDEX: {evaluation.composite_risk_score} / 100</b></font>", normal_style),
                Paragraph(f"<font color='white' size=12><b>RISK CATEGORY: {evaluation.risk_tier.upper()}</b></font>", normal_style)
            ]
        ], colWidths=[270, 270])
        risk_banner.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), tier_color),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(risk_banner)
        story.append(Spacer(1, 10))

        # Multimodal Assessment Signal Breakdown
        story.append(Paragraph("<b>1. Multimodal Diagnostic Signal Breakdown</b>", section_heading))
        comp = evaluation.risk_components
        signal_data = [
            [Paragraph("<b>Diagnostic Signal</b>", normal_style), Paragraph("<b>Score (0-100)</b>", normal_style), Paragraph("<b>Clinical Interpretation</b>", normal_style)],
            [Paragraph("WOMAC Clinical Symptoms", normal_style), f"{comp.symptom_womac_score}", f"WOMAC: {evaluation.womac_total_score}/96 ({evaluation.womac_percentage}%)"],
            [Paragraph("CV Biomechanics & ROM", normal_style), f"{comp.biomechanics_score}", "Kinematic angles, gait asymmetry & functional mobility"],
            [Paragraph("NER Terrain & Occupation Strain", normal_style), f"{comp.occupational_terrain_score}", f"{evaluation.patient_occupation} strain in {evaluation.patient_state}"],
            [Paragraph("Radiographic X-Ray (if tested)", normal_style), f"{comp.xray_structural_score if comp.xray_structural_score is not None else 'N/A'}", "Kellgren-Lawrence structural severity"]
        ]
        signal_table = Table(signal_data, colWidths=[180, 100, 260])
        signal_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(signal_table)
        story.append(Spacer(1, 10))

        # Primary Contributing Factors
        story.append(Paragraph("<b>2. Primary Risk Markers & Identified Factors</b>", section_heading))
        factors_text = "<br/>• ".join(evaluation.primary_contributing_factors)
        story.append(Paragraph(f"• {factors_text}", normal_style))
        story.append(Spacer(1, 10))

        # Actionable Clinical Plan
        story.append(Paragraph("<b>3. Action Plan, Physiotherapy & Terrain Ergonomics</b>", section_heading))
        
        recs_data = [
            [Paragraph("<b>Prescribed Physiotherapy Regimen:</b>", normal_style)],
            [Paragraph("<br/>• " + "<br/>• ".join(evaluation.recommended_physiotherapy), normal_style)],
            [Paragraph("<b>NER Terrain & Occupational Adjustments:</b>", normal_style)],
            [Paragraph("<br/>• " + "<br/>• ".join(evaluation.ergonomic_terrain_advice), normal_style)],
            [Paragraph("<b>Referral Decision & Facility:</b>", normal_style)],
            [Paragraph(f"<b>Urgency:</b> {evaluation.referral_urgency}<br/><b>Facility:</b> {evaluation.referred_to_hospital or 'Local PHC Follow-up'}", normal_style)]
        ]
        recs_table = Table(recs_data, colWidths=[540])
        recs_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#94a3b8')),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(recs_table)

        doc.build(story)
        return pdf_path
